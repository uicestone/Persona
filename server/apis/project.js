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
    // Project CURD
    router.route('/project')

        // create a project
        .post((req, res) => {
            
            let project = new Project(req.body);      // create a new instance of the Project model

            if (!req.body.manager) {
                res.status(400).json({message:'请填写管理者'});
            }

            project.brand = req.body.manager.brand;
            project.createdAt = new Date();

            // save the project and check for errors
            project.save().then(project => {
                project.appid = project._id;
                project.save();

                res.json(project);
            }).catch(err => {
                if (err.code === 11000) {
                    res.status(409).json({message:'无法创建重复数据'});
                    console.error(err.message);
                }
                else {
                    console.error(err);
                    res.status(500);
                }
            });
        })

        // get all the projects for current user
        .get((req, res) => {
            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = Project.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if (req.user.roles.indexOf('project_admin') > -1) {
                query.find({
                    'executive._id': req.user._id
                });
            }
            else if (req.user.roles.indexOf('brand_admin') > -1) {
                query.find({
                    'brand.name': req.user.brand.name
                });
            }

            if(req.query.keyword) {
                query.find({$or: [
                    {name: new RegExp(req.query.keyword)},
                    {appid: new RegExp(req.query.keyword)}
                ]});
            }

            ['name', 'url', 'appid', 'platform'].forEach(property => {
                if(req.query[property]) {
                    query.find({[property]: new RegExp(req.query[property])});
                }
            });

            ['startDate', 'endDate'].forEach(property => {
                
                if(req.query[property]) {

                    const range = req.query[property].split(/[~_]/);

                    if(range[0] && !isNaN((new Date(range[0])).getTime())) {
                        query.find({
                            [property]: {$gte: new Date(range[0])}
                        })
                    }

                    if(range[1] && !isNaN((new Date(range[1])).getTime())) {
                        query.find({
                            [property]: {$lte: new Date(range[1])}
                        })
                    }

                }

            })

            if(req.query.orderBy) {
                query.sort({
                    [req.query.orderBy]: (req.query.order === 'desc' || req.query.order === 'false' || Number(req.query.order) <= 0 ? 'desc' : 'asc')
                });
            }

            query.count()
            .then((total) => {
                return Promise.all([total, query.find().limit(limit).skip(skip).exec()]);
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
        });

    // on routes that end in /project/:projectId
    // ----------------------------------------------------
    router.route('/project/:projectId')

        // get the project with that id
        .get((req, res) => {
            Project.findById(req.params.projectId).then(project => {
                res.json(project);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {
            Project.findByIdAndUpdate(req.params.projectId, req.body, {new: true}).then(project => {
                res.json(project);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the project with this id
        .delete((req, res) => {
            Project.findByIdAndRemove(req.params.projectId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    router.route('/project/:projectId/kpi-by-channels').get(async (req, res) => {

        const match = {
            project: Types.ObjectId(req.params.projectId)
        };

        if (req.query.startDate || req.query.endDate) {
            const matchTime = {};
            if (req.query.startDate) {
                matchTime.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                matchTime.$lt = new Date(req.query.endDate);
            }
            match.time = matchTime;
        }

        if (req.query.endDate) {
            match.time.$lt = new Date(req.query.endDate);
        }

        const uvByChannel = await Campaign.aggregate([{
            $match: match
        }, {
            $group: {
                _id: "$fromChannel",
                uniqueIds: {$addToSet: {$ifNull: ["$openId", "$tempId"]}}
            }
        }, {
            $project: {
                count: {$size: "$uniqueIds"}
            }
        }]).allowDiskUse(true);

        const pvByChannel = await Campaign.aggregate([{
            $match: Object.assign({visited: {$exists: true}}, match)
        }, {
            $group: {
                _id: {fromChannel: "$fromChannel", name: "$visited"},
                count: {$sum: 1}
            }
        }, {
            $group: {
                _id: "$_id.fromChannel",
                pages: {$push: {name: "$_id.name", views: "$count"}},
                count: {$sum: "$count"}
            }
        }]).allowDiskUse(true);

        const stayingTimeByChannel = await Campaign.aggregate([{
            $match: Object.assign({stayingTime: {$exists: true}}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                time: {$avg: "$stayingTime"}
            }
        }]).allowDiskUse(true);

        const escapeByChannel = await Campaign.aggregate([
            {
                $match: Object.assign({visited: {$exists: true}}, match)
            },
            {
                $group: {
                    _id : {date:{$dateToString: {format: "%Y-%m-%d", date: "$time"}}, fromChannel:"$fromChannel", uniqueUser:{$ifNull: ["$openId", "$tempId"]}},
                    count: {$sum : 1},
               }
            },
            {
                $match: {count:1}
            },
            {
                $group: {
                    _id:"$_id.fromChannel",
                    count:{$sum:1}
                }
            }
        ]).allowDiskUse(true);

        const sharesByChannel = await Campaign.aggregate([{
            $match: Object.assign({shared: {$exists: true}}, match)
        }, {
            $group: {
                _id: {fromChannel: "$fromChannel", name: "$shared"},
                count: {$sum: 1}
            }
        }, {
            $group: {
                _id: "$_id.fromChannel",
                pages: {$push: {name: "$_id.name", shares: "$count"}},
                count: {$sum: "$count"}
            }
        }]).allowDiskUse(true);

        const registersByChannel = await Campaign.aggregate([{
            $match: Object.assign({$or: [{mobile: {$exists: true}}, {registered: {$exists: true}}]}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                count: {$sum: 1}
            }
        }]);

        const ordersByChannel = await Campaign.aggregate([{
            $match: Object.assign({ordered: {$exists: true}}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                count: {$sum: 1},
                price: {$sum: "$price"}
            }
        }]).allowDiskUse(true);

        const paymentsByChannel = await Campaign.aggregate([{
            $match: Object.assign({paid: {$exists: true}}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                count: {$sum: 1},
                price: {$sum: "$price"}
            }
        }]).allowDiskUse(true);

        res.json({
            pv: pvByChannel,
            uv: uvByChannel,
            stay: stayingTimeByChannel,
            escape: escapeByChannel,
            share: sharesByChannel,
            register: registersByChannel,
            order: ordersByChannel,
            pay: paymentsByChannel
        });
    });

    router.route('/project/:projectId/kpi-by-date').get(async (req, res) => {

        let match = {
            project: Types.ObjectId(req.params.projectId),
            time: {$exists: true}
        };

        if (req.query.startDate || req.query.endDate) {
            const matchTime = {};
            if (req.query.startDate) {
                matchTime.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                matchTime.$lt = new Date(req.query.endDate);
            }
            match.time = matchTime;
        }

        const kpiByDate = await Campaign.aggregate([{
            $match: match
        }, {
            $group: {
                _id: {$dateToString: {format: "%Y-%m-%d", date: "$time"}},
                uniqueIds: {$addToSet: {$ifNull: ["$openId", "$tempId"]}},
                registers: {$sum: {$cond: [{$or:["$mobile", "$registered"]}, 1, 0]}},
                pv: {$sum: {$cond: ["$visited", 1, 0]}},
                stayingTime: {$avg: {$cond: ["$stayingTime", "$stayingTime", null]}},
                shares: {$sum: {$cond: ["$shared", 1, 0]}}
            }
        }, {
            $project: {
                uv: {$size: "$uniqueIds"},
                pv: "$pv",
                registers: "$registers",
                stayingTime: "$stayingTime",
                shares: "$shares"
            }
        }, {
            $sort: {
                _id: 1
            }
        }]);

        const escapeByDate = await Campaign.aggregate([
            {
                $match: Object.assign({visited: {$exists: true}}, match)
            },
            {
                $group: {
                    _id : {
                        date:{$dateToString: {format: "%Y-%m-%d", date: "$time"}},
                        uniqueUser:{$ifNull: ["$openId", "$tempId"]}},
                    count: {$sum : 1}
                }},
            {
                $match: {count:1}
            },
            {
                $group: {_id:"$_id.date", count:{$sum:1}}
            }
        ]).allowDiskUse(true);

        kpiByDate.forEach(kpiPerDate => {
            const date = kpiPerDate._id;
            const escapeThatDate = escapeByDate.filter(escapePerDate => escapePerDate._id === date)[0];
            kpiPerDate.escapeRate = escapeThatDate ? escapeThatDate.count / kpiPerDate.uv : 0;
        });

        res.send(kpiByDate);
    });

    router.route('/project/:projectId/kpi-by-device').get((req, res) => {

        let match = {
            project: Types.ObjectId(req.params.projectId),
            device: {$exists: true}
        };

        if (req.query.startDate || req.query.endDate) {
            const matchTime = {};
            if (req.query.startDate) {
                matchTime.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                matchTime.$lt = new Date(req.query.endDate);
            }
            match.time = matchTime;
        }

        Campaign.aggregate([{
            $match: match
        },{
            $group: {
                _id: "$device",
                uv: {$sum: 1},
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }]).allowDiskUse(true).then((result) => {
            res.send(result);
        });
    });

    router.route('/project/:projectId/kpi-by-region').get((req, res) => {
        
        let match = {
            project: Types.ObjectId(req.params.projectId),
            province: {$exists: true}
        };

        if (req.query.startDate || req.query.endDate) {
            const matchTime = {};
            if (req.query.startDate) {
                matchTime.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                matchTime.$lt = new Date(req.query.endDate);
            }
            match.time = matchTime;
        }

        Campaign.aggregate([{
            $match: match
        },{
            $group: {
                _id: "$province",
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }]).allowDiskUse(true).then((result) => {
            res.send(result);
        });
    });

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
                    throw '';
                record.fromChannel = {_id: channel._id, name: channel.name};
            })
            .catch(() => {
                throw 'Invalid channel id.'
            })

            .then(() => {
                return Project.findOne({_id: record.project});
            })
            .then((project) => {
                if(!project)
                    throw '';
                return record.save();
            })
            .catch(() => {
                throw 'Invalid project id.'
            })

            .then((record) => {
                res.json(record);
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

                if (!query.tempId && !query.openId) {
                    throw 'No tempId or openId is defined';
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
                    throw `Channel not found: ${query.channel || query.spid}`;
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

                    if (query.openId) {
                        lastSeenOpenId = JSON.parse(await redisClient.getAsync(`last_seen_${query.openId}`));
                    }

                    if (query.tempId) {
                        lastSeenTempId = JSON.parse(await redisClient.getAsync(`last_seen_${query.tempId}`));
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
