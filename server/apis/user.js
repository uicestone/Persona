var User = require('../models/user.js');

module.exports = function(router) {
    // User CURD
    router.route('/user')

        // create a user
        .post(function(req, res) {
            
            var user = new User(req.body);      // create a new instance of the User model

            // save the user and check for errors
            user.save(function(err) {
                if (err)
                    return res.status(500).send(err);
                res.json(user);
            });
            
        })

        // get all the users
        .get(function(req, res) {

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = User.find();

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
            .then(function(total) {
                return Promise.all([total, query.find().limit(limit).skip(skip).exec()]);
            })
            .then(function(result) {
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
        .get(function(req, res) {
            User.findById(req.params.userId, function(err, user) {
                if (err)
                    return res.status(500).send(err);
                res.json(user);
            });
        })

        .put(function(req, res) {
            User.where({_id: req.params.userId}).update(req.body, function(err, raw) {
                if (err) {
                    return res.status(500).send(err);
                }

                User.findById(req.params.userId, function(err, user) {
                    if (err)
                        return res.status(500).send(err);
                    
                    res.json(user);
                });
            });
        })

        // delete the user with this id
        .delete(function(req, res) {
            User.remove({
                _id: req.params.userId
            }, function(err, user) {
                if (err)
                    return res.status(500).send(err);
                res.end();
            });
        });

    return router;
}
