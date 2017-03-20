var CustomerField = require('../models/customerField.js');

module.exports = function(router) {
    // CustomerField CURD
    router.route('/customer-field')

        // create an customer field
        .post(function(req, res) {
            
            var customerField = new CustomerField(req.body); // create a new instance of the CustomerField model

            // 为非管理员新增的访客字段设置品牌
            if(req.user.roles.indexOf('admin') === -1) {
                customerField.brand = req.user.brand.name;
            }

            // save the customer field and check for errors
            customerField.save(function(err) {
                if (err)
                    return res.status(500).send(err);
                res.json(customerField);
            });
            
        })

        // get common and brand specified customer fields
        .get(function(req, res) {

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = CustomerField.find();

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

    // on routes that end in /customer-field/:customerFieldId
    // ----------------------------------------------------
    router.route('/customer-field/:customerFieldId')

        // get the customerField with that id
        .get(function(req, res) {
            CustomerField.findById(req.params.customerFieldId, function(err, customerField) {
                if (err)
                    res.status(500).send(err);
                res.json(customerField);
            });
        })

        .put(function(req, res) {
            CustomerField.where({_id: req.params.customerFieldId}).update(req.body, function(err, raw) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                CustomerField.findById(req.params.customerFieldId, function(err, customerField) {
                    if (err)
                        res.status(500).send(err);

                    res.json(customerField);
                });
            });
        })

        // delete the customer field with this id
        .delete(function(req, res) {
            CustomerField.remove({
                _id: req.params.customerFieldId
            }, function(err, customerField) {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
