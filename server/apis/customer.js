var Customer = require('../models/customer.js');

module.exports = function(router) {
    // Customer CURD
    router.route('/customer')

        // create a customer
        .post(function(req, res) {
            
            var customer = new Customer(req.body);      // create a new instance of the Customer model

            // save the customer and check for errors
            customer.save(function(err) {
                if (err)
                    res.send(err);

                res.json(customer);
            });
            
        })

        // get all the customers
        .get(function(req, res) {
            if(!Customer.totalCount){
                Customer.count().exec().then(value => Customer.totalCount = value);
            }

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = {};

            if(req.query.keyword) {
                query = {
                    name: new RegExp(req.query.keyword)
                };
            }

            Customer.find(query)
            .limit(limit)
            .skip(skip)
            .exec()
            .then(result => {

                console.log(result)

                if(skip + result.length > Customer.totalCount) {
                    Customer.totalCount = skip + result.length;
                }

                res.set('Items-Total', Customer.totalCount)
                .set('Items-Start', skip + 1)
                .set('Items-End', Math.min(skip + limit, Customer.totalCount))
                .json(result);
            });
        });

    // on routes that end in /customer/:customerId
    // ----------------------------------------------------
    router.route('/customer/:customerId')

        // get the customer with that id
        .get(function(req, res) {
            Customer.findById(req.params.customerId, function(err, customer) {
                if (err)
                    res.send(err);
                res.json(customer);
            });
        })

        .put(function(req, res) {
            Customer.where({_id: req.params.customerId}).update(req.body, function(err, raw) {
                if (err) {
                    res.send(err);
                    return;
                }

                Customer.findById(req.params.customerId, function(err, customer) {
                    if (err)
                        res.send(err);
                    
                    res.json(customer);
                });
            });
        })

        // delete the customer with this id
        .delete(function(req, res) {
            Customer.remove({
                _id: req.params.customerId
            }, function(err, customer) {
                if (err)
                    res.send(err);

                res.end();
            });
        });

    return router;
}
