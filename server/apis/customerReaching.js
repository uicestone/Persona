var CustomerReaching = require('../models/customerReaching.js');

module.exports = function(router) {
    // CustomerReaching CURD
    router.route('/customer-reaching')

        // create an customer reaching
        .post(function(req, res) {
            
            var customerReaching = new CustomerReaching(req.body); // create a new instance of the CustomerReaching model

            // 为非管理员新增的访客字段设置品牌
            if(req.user.roles.indexOf('admin') === -1) {
                customerReaching.brand = req.user.brand.name;
            }

            // save the customer reaching and check for errors
            customerReaching.save(function(err) {
                if (err)
                    return res.status(500).send(err);
                res.json(customerReaching);
            });
            
        })

        // get common and brand specified customer reachings
        .get(function(req, res) {

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = CustomerReaching.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.keyword) {
                query.find({
                    $or:[
                        {key: new RegExp(req.query.keyword)},
                        {label: new RegExp(req.query.keyword)}
                    ]
                });
            }

            if(req.query.type) {
                query.find({
                    type: req.query.type
                });
            }

            if(req.user.roles.indexOf('admin') === -1) {
                query.find({
                    $or: [
                        {reserved: true},
                        {brand: req.user.brand.name}
                    ]
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

    // on routes that end in /customer-reaching/:customerReachingId
    // ----------------------------------------------------
    router.route('/customer-reaching/:customerReachingId')

        // get the customerReaching with that id
        .get(function(req, res) {
            CustomerReaching.findById(req.params.customerReachingId, function(err, customerReaching) {
                if (err)
                    res.status(500).send(err);
                res.json(customerReaching);
            });
        })

        .put(function(req, res) {
            CustomerReaching.where({_id: req.params.customerReachingId}).update(req.body, function(err, raw) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                CustomerReaching.findById(req.params.customerReachingId, function(err, customerReaching) {
                    if (err)
                        res.status(500).send(err);

                    res.json(customerReaching);
                });
            });
        })

        // delete the customer reaching with this id
        .delete(function(req, res) {
            CustomerReaching.remove({
                _id: req.params.customerReachingId
            }, function(err, customerReaching) {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
