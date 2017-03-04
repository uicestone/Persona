var Project = require('../models/project.js');
var Campaign = require('../models/campaign.js');

module.exports = function(router) {
    // Project CURD
    router.route('/project')

        // create a project
        .post(function(req, res) {
            
            var project = new Project(req.body);      // create a new instance of the Project model
            project.createdAt = new Date();

            // save the project and check for errors
            project.save(function(err) {
                if (err)
                    res.status(500).send(err);

                res.json(project);
            });
            
        })

        // get all the projects
        .get(function(req, res) {
            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var queryPromises = [];
            var query = Project.find().limit(limit).skip(skip);

            if(!Project.totalCount){
                queryPromises.push(Project.count().exec().then(value => Project.totalCount = value));
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
                    res.status(500).send(err);
                res.json(project);
            });
        })

        .put(function(req, res) {
            Project.where({_id: req.params.projectId}).update(req.body, function(err, raw) {
                if (err) {
                    res.status(500).send(err);
                    
                    return;
                }

                Project.findById(req.params.projectId, function(err, project) {
                    if (err)
                        res.status(500).send(err);
                    
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
                    res.status(500).send(err);

                res.json({ message: 'Successfully deleted' });
            });
        });

    router.route('/project/:projectId/kpi-by-channels').get(function(req, res) {
        Campaign.aggregate([{
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
            $group: {
                _id: "$province",
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }]).then(function(result) {
            res.send(result);
        });
    });

    router.route('/project/:projectId/campaign-record').get(function(req, res) {
        Campaign.find().limit(200).then(function(campaignRecords) {
            res.send(campaignRecords);
        });
    });

    return router;
}
