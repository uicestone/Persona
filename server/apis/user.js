const User = require('../models/user.js');

module.exports = (router) => {
    // User CURD
    router.route('/user')

        // create a user
        .post((req, res) => {
            
            let user = new User(req.body);      // create a new instance of the User model

            // save the user and check for errors
            user.save((err) => {
                if (err)
                    return res.status(500).send(err);
                res.json(user);
            });
            
        })

        // get all the users
        .get((req, res) => {

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = User.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            // user can only list users from the same brand

            if(req.user.roles.indexOf('admin') === -1) {
                query.find({
                    'brand.name': req.user.brand.name
                });
            }

            if(req.query.keyword) {
                query.find({
                    name: new RegExp(req.query.keyword)
                });
            }

            if(req.query.roles) {
                query.find({
                    roles: req.query.roles
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

    // on routes that end in /user/:userId
    // ----------------------------------------------------
    router.route('/user/:userId')

        // get the user with that id
        .get((req, res) => {
            User.findById(req.params.userId, (err, user) => {
                if (err)
                    return res.status(500).send(err);
                res.json(user);
            });
        })

        .put((req, res) => {
            User.where({_id: req.params.userId}).update(req.body, (err, raw) => {
                if (err) {
                    return res.status(500).send(err);
                }

                User.findById(req.params.userId, (err, user) => {
                    if (err)
                        return res.status(500).send(err);
                    
                    res.json(user);
                });
            });
        })

        // delete the user with this id
        .delete((req, res) => {
            User.remove({
                _id: req.params.userId
            }, (err, user) => {
                if (err)
                    return res.status(500).send(err);
                res.end();
            });
        });

    return router;
}
