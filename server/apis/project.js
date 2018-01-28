const Project = require('../models/project.js');

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
            else {
                query.sort({endDate:-1});
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

    return router;
}
