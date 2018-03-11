const bluebird = require('bluebird');
const redisClient = require('redis').createClient();
const Project = require('../models/project.js');
const Campaign = require('../models/campaign.js');
const Channel = require('../models/channel.js');
const Types = require('mongoose').Types;
const Url = require('url');
const QueryString = require('querystring');

bluebird.promisifyAll(redisClient);

module.exports = (router, wss) => {
    
    router.route('/project/:projectId/campaign-record')

    .get((req, res) => {
        const limit = +req.query.limit || 20;
        let skip = +req.query.skip || 0;

        let query = Campaign.find({project: req.params.projectId});

        if (req.query.startDate) {
            query.find({time: {$gte: new Date(req.query.startDate)}});
        }

        if (req.query.endDate) {
            query.find({time: {$lt: new Date(req.query.endDate)}});
        }

        if(req.query.page && !skip) {
            skip = (req.query.page - 1) * limit;
        }

        query.count()
        .then((total) => {
            return Promise.all([total, query.find().sort({time:-1}).limit(limit).skip(skip).exec()]);
        })
        .then((result) => {
            let [total, page] = result;

            if(skip + page.length > total) {
                total = skip + page.length;
            }

            res.set('items-total', total)
            .set('items-start', Math.min(skip + 1, total))
            .set('items-end', Math.min(skip + limit, total))
            .json(page);
        });
    })

    .post((req, res) => {

        let record = new Campaign(req.body);      // create a new instance of the CampaignRecord model
        const channelId = req.query.channel;

        if(Object.keys(req.body).length === 0) {
            return res.status(400).send({message: 'Empty input.'});
        }

        record.time = record.time ? new Date(record.time) : new Date();
        record.project = req.params.projectId;

        let query;

        if (channelId) {
            query = Channel.findOne({_id: channelId});
        }
        else if (req.query.spid) {
            query = Channel.findOne({spid: req.query.spid});
        }
        else {
            throw 'No channel id.';
        }

        query
        .then((channel) => {
            if(!channel)
                throw 'Invalid channel id.';
            record.fromChannel = {_id: channel._id, name: channel.name};
        })
        .then(() => {
            return Project.findOne({_id: record.project});
        })
        .then((project) => {
            if(!project)
                throw 'Invalid project id.';

            ['openId', 'tempId', 'mobile'].forEach(field => {
                if (Object.keys(record.toObject()).indexOf(field) === -1) {
                    return;
                }

                if (!record[field] || record[field] == 'undefined' || record[field] == 'null') {
                    record[field] = undefined;
                }
            });
            
            if (!record.tempId && !record.openId && !record.mobile) {
                throw 'Cannot identify customer.'
            }

            res.json(record);
            return record.save();
        })
        .then(record => {
            record.syncToUser();
        })
        .catch((err) => {
            return res.status(400).send({message: err});
        });

    });

    wss.on('connection', async (ws, req) => {
        
        const connectedAt = new Date();
        const projectId = req.url.match(/project\/(.*?)(\?.*?)?$/)[1];
        const url = Url.parse(req.url);
        const query = QueryString.parse(url.query);

        try {

            if (projectId && !Types.ObjectId.isValid(projectId)) {
                throw 'Invalid Project ID';
            }

            if (query.channel && !Types.ObjectId.isValid(query.channel)) {
                throw 'Invalid Channel ID';
            }

            if (!query.tempId && !query.openId && !query.mobile) {
                throw 'Non of tempId, openId or mobile is defined';
            }

            const project = await Project.findById(projectId);

            if (!project) {
                throw `Project not found: ${projectId}`;
            }

            let channel;

            if (query.channel) {
                channel = await Channel.findById(query.channel);
            }
            else if (query.spid) {
                channel = await Channel.findOne({spid: query.spid});
            }

            if (!channel) {
                throw `Project ${projectId}: Channel not found: ${query.channel || query.spid}`;
            }

            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
                ws.send(`echo ${message}`);
            });

            ws.on('close', async () => {
                
                const timeStay = new Date() - connectedAt;

                // redis key 'last_seen_{tempId|openId}'
                // value '{"recordId":"{ObjectId}","time":"1500000000000"}'
                let lastSeenOpenId, lastSeenTempId, lastSeenTime = null, lastSeenRecordId;

                if (query.tempId) {
                    lastSeenTempId = JSON.parse(await redisClient.getAsync(`last_seen_${query.tempId}`));
                }

                if (query.openId) {
                    lastSeenOpenId = JSON.parse(await redisClient.getAsync(`last_seen_${query.openId}`));
                }

                if (query.mobile) {
                    lastSeenMobile = JSON.parse(await redisClient.getAsync(`last_seen_${query.mobile}`));
                }

                if (lastSeenTempId) {
                    lastSeenTime = lastSeenTempId.time;
                    lastSeenRecordId = lastSeenTempId.recordId;
                }

                if (lastSeenOpenId
                     && (!lastSeenTempId || lastSeenTempId.time < lastSeenOpenId.time)) {
                    lastSeenTime = lastSeenOpenId.time;
                    lastSeenRecordId = lastSeenOpenId.recordId;
                }

                if (lastSeenMobile
                     && (!lastSeenTempId || lastSeenTempId.time < lastSeenMobile.time)) {
                    lastSeenTime = lastSeenMobile.time;
                    lastSeenRecordId = lastSeenMobile.recordId;
                }

                let campaignRecord;

                // We find the previous stayingTime record and update it
                if (lastSeenRecordId) {
                    campaignRecord = await Campaign.findById(lastSeenRecordId);
                    // console.log(campaignRecord.stayingTime, new Date() - campaignRecord.time);
                    campaignRecord.stayingTime = campaignRecord.stayingTime + (new Date() - campaignRecord.time)
                    campaignRecord.time = new Date();
                    // console.log(`updating stayingTime ${campaignRecord.stayingTime}`);
                }
                // otherwise we create a stayingTime record if we last saw this user 15min ago
                else {
                    campaignRecord = new Campaign({
                        ip: req.connection.remoteAddress,
                        time: new Date(),
                        stayingTime: timeStay,
                        project: project._id,
                        fromChannel: {_id: channel._id, name: channel.name}
                    });
                    // console.log(`creating stayingTime ${timeStay}`);
                }

                const lastSeen = JSON.stringify({recordId: campaignRecord._id, time: new Date().getTime()});

                if (query.openId) {
                    campaignRecord.openId = query.openId;
                    redisClient.setexAsync(`last_seen_${query.openId}`, 300, lastSeen);
                }

                if (query.tempId) {
                    campaignRecord.tempId = query.tempId;
                    redisClient.setexAsync(`last_seen_${query.tempId}`, 300, lastSeen);
                }

                if (query.mobile) {
                    campaignRecord.mobile = query.mobile;
                    redisClient.setexAsync(`last_seen_${query.mobile}`, 300, lastSeen);
                }

                campaignRecord.save();
            });

        }
        catch (e) {
            setTimeout(() => {
                console.error(`${e}, closing WebSocket from ${req.connection.remoteAddress}`)
                ws.close(1003, e);
            });
        }
    });

    return router;
}