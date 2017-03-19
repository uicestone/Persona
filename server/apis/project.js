var Project = require('../models/project.js');
var Campaign = require('../models/campaign.js');
var Channel = require('../models/channel.js');
var Types = require('mongoose').Types;

module.exports = function(router) {
    // Project CURD
    router.route('/project')

        // create a project
        .post(function(req, res) {
            
            var project = new Project(req.body);      // create a new instance of the Project model
            project.brand = req.body.manager.brand;
            project.createdAt = new Date();

            // save the project and check for errors
            project.save(function(err) {
                if (err)
                    return res.status(500).send(err);

                res.json(project);
            });
            
        })

        // get all the projects for current user
        .get(function(req, res) {
            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var queryPromises = [];
            var query = Project.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            query.limit(limit).skip(skip);

            if(!Project.totalCount){
                queryPromises.push(Project.count().exec().then(value => Project.totalCount = value));
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

            ['name', 'url', 'appid'].forEach(property => {
                if(req.query[property]) {
                    query.find({[property]: new RegExp(req.query[property])});
                }
            });

            ['startDate', 'endDate'].forEach(property => {
                
                if(req.query[property]) {

                    var range = req.query[property].split(/[~_]/);

                    var condition = {[property]:{}};

                    if(range[0] && !isNaN(range[0])) {
                        condition[property].$gte = Number(range[0]);
                    }

                    if(range[1] && !isNaN(range[1])) {
                        condition[property].$lte = Number(range[1]);
                    }

                    query.find(condition);

                }

            })

            if(req.query.orderBy) {
                query.sort({
                    [req.query.orderBy]: (req.query.order === 'desc' || req.query.order === 'false' || Number(req.query.order) <= 0 ? 'desc' : 'asc')
                });
            }

            Promise.all(queryPromises)

            .then(() => {
                return query.exec();
            })

            .then(result => {

                if(skip + result.length > Project.totalCount) {
                    Project.totalCount = skip + result.length;
                }

                res.set('Items-Total', Project.totalCount)
                .set('Items-Start', skip + 1)
                .set('Items-End', Math.min(skip + limit, Project.totalCount))
                .json(result);
            });

        });

    // on routes that end in /project/:projectId
    // ----------------------------------------------------
    router.route('/project/:projectId')

        // get the project with that id
        .get(function(req, res) {
            Project.findById(req.params.projectId, function(err, project) {
                if (err)
                    return res.status(500).send(err);

                res.json(project);
            });
        })

        .put(function(req, res) {
            Project.where({_id: req.params.projectId}).update(req.body, function(err, raw) {
                if (err)
                    return res.status(500).send(err);

                Project.findById(req.params.projectId, function(err, project) {
                    if (err)
                        return res.status(500).send(err);
                    
                    res.json(project);
                });
            });
        })

        // delete the project with this id
        .delete(function(req, res) {
            Project.remove({
                _id: req.params.projectId
            }, function(err, project) {
                if (err)
                    return res.status(500).send(err);

                res.json({ message: 'Successfully deleted' });
            });
        });

    router.route('/project/:projectId/kpi-by-channels').get(function(req, res) {
        Campaign.aggregate([{
            $match: {project: Types.ObjectId(req.params.projectId)}
        },{
            $group: {
                _id: "$fromChannel",
                uv: {$sum: 1},
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}},
                timeStay: {$avg: "$stayedFor"},
                shares: {$sum: {$cond: {if: "$shared", then: 1, else: 0}}}
            }
        }]).then(function(result) {
            res.send(result);
        });
    });

    router.route('/project/:projectId/kpi-by-date').get(function(req, res) {
        Campaign.aggregate([{
            $match: {project: Types.ObjectId(req.params.projectId)}
        },{
            $group: {
                _id: {$dateToString: {format: "%Y-%m-%d", date: "$accessedAt"}},
                uv: {$sum: 1},
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }, {
            $sort: {_id: 1}
        }]).then(function(result) {
            res.send(result);
        });
    });

    router.route('/project/:projectId/kpi-by-device').get(function(req, res) {
        Campaign.aggregate([{
            $match: {project: Types.ObjectId(req.params.projectId)}
        },{
            $group: {
                _id: "$device",
                uv: {$sum: 1},
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }]).then(function(result) {
            res.send(result);
        });
    });

    router.route('/project/:projectId/kpi-by-region').get(function(req, res) {
        Campaign.aggregate([{
            $match: {project: Types.ObjectId(req.params.projectId)}
        },{
            $group: {
                _id: "$province",
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }]).then(function(result) {
            res.send(result);
        });
    });

    router.route('/project/:projectId/campaign-record')

        .get(function(req, res) {
            Campaign.find({project: req.params.projectId}).limit(200).then(function(campaignRecords) {
                res.send(campaignRecords);
            });
        })

        .post(function(req, res) {

            var record = new Campaign(req.body);      // create a new instance of the CampaignRecord model
            var channelId = req.query.channel;

            if(Object.keys(req.body).length === 0) {
                return res.status(400).send({message: 'Empty input.'});
            }

            record.createdAt = record.createdAt ? new Date(record.createdAt) : new Date();
            record.project = req.params.projectId;

            Channel.findOne({_id:channelId})
            .then(function(channel) {
                if(!channel)
                    throw '';
                record.fromChannel = {_id: channel._id, name: channel.name};
            })
            .catch(function() {
                throw 'Invalid channel id.'
            })

            .then(function() {
                return Project.findOne({_id: record.project});
            })
            .then(function(project) {
                if(!project)
                    throw '';
                return record.save();
            })
            .catch(function() {
                throw 'Invalid project id.'
            })

            .then(function(record) {
                res.json(record);
            })
            .catch(function(err) {
                return res.status(400).send({message: err});
            });

        });

    return router;
}
