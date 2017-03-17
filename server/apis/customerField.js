var CustomerField = require('../models/customerField.js');

module.exports = function(router) {
    // CustomerField CURD
    router.route('/customer-field')

        // create an customer field
        .post(function(req, res) {
            
            var customerField = new CustomerField(req.body); // create a new instance of the CustomerField model

            // save the customer field and check for errors
            customerField.save(function(err) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                res.json(customerField);
            });
            
        })

        // get all the customer fields
        .get(function(req, res) {
            if(!CustomerField.totalCount){
                CustomerField.count().exec().then(value => CustomerField.totalCount = value);
            }

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = {};

            if(req.query.keyword) {
                query.name = new RegExp(req.query.keyword);
            }

            if(req.query.type) {
                query.type = req.query.type;
            }

            CustomerField.find(query)
            .limit(limit)
            .skip(skip)
            .exec()
            .then(result => {

                if(skip + result.length > CustomerField.totalCount) {
                    CustomerField.totalCount = skip + result.length;
                }

                res.set('Items-Total', CustomerField.totalCount)
                .set('Items-Start', skip + 1)
                .set('Items-End', Math.min(skip + limit, CustomerField.totalCount))
                .json(result);
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