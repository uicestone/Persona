var Project = require('../models/project.js');

module.exports = function(router) {
    // Project CURD
    router.route('/project')

        // create a project
        .post(function(req, res) {
            
            var project = new Project(req.body);      // create a new instance of the Project model

            // save the project and check for errors
            project.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Project created!' });
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
                    {code: new RegExp(req.query.keyword)}
                ]});
            }

            ['code', 'name'].forEach(property => {
                if(req.query[property]) {
                    query.find({[property]: new RegExp(req.query[property])});
                }
            });

            ['percentage', 'pb', 'peTtm', 'peLyr', 'psr', 'marketCapital', 'floatMarketCapital'].forEach(property => {
                
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
                    res.send(err);
                res.json(project);
            });
        })

        .put(function(req, res) {
            Project.where({_id: req.params.projectId}).update(req.body, function(err, raw) {
                if (err) {
                    res.send(err);
                    
                    return;
                }

                Project.findById(req.params.projectId, function(err, project) {
                    if (err)
                        res.send(err);
                    
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
                    res.send(err);

                res.json({ message: 'Successfully deleted' });
            });
        });

    return router;
}
