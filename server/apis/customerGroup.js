var CustomerGroup = require('../models/customerGroup.js');
var Customer = require('../models/customer.js');

module.exports = function(router) {
    // CustomerGroup CURD
    router.route('/customer-group')

        // create a customer group
        .post(function(req, res) {
            
            var customerGroup = new CustomerGroup(req.body);      // create a new instance of the CustomerGroup model

            // save the customer group and check for errors
            customerGroup.save(function(err) {
                if (err)
                    res.status(500).send(err);

                res.json(customerGroup);

                Customer.update({
                    tags: {
                        $all: customerGroup.query.withTags,
                        $nin: customerGroup.query.withoutTags,
                    }
                }, {
                    $addToSet: {
                        group: {
                            _id: customerGroup._id,
                            name: customerGroup.name
                        }
                    }
                }, {multi: true}).then(function(result) {
                    console.log(result.nModified + ' customers added to group: ' + customerGroup.name);
                });
            });
            
        })

        // get all the customer groups
        .get(function(req, res) {
            
            if(!CustomerGroup.totalCount){
                CustomerGroup.count().exec().then(value => CustomerGroup.totalCount = value);
            }

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = {};

            if(req.query.keyword) {
                query = {
                    name: new RegExp(req.query.keyword)
                };
            }

            CustomerGroup.find(query)
            .limit(limit)
            .skip(skip)
            .exec()
            .then(result => {

                if(skip + result.length > CustomerGroup.totalCount) {
                    CustomerGroup.totalCount = skip + result.length;
                }

                res.set('Items-Total', CustomerGroup.totalCount)
                .set('Items-Start', skip + 1)
                .set('Items-End', Math.min(skip + limit, CustomerGroup.totalCount))
                .json(result);
            });
        });

    // on routes that end in /customer-group/:customerGroupId
    // ----------------------------------------------------
    router.route('/customer-group/:customerGroupId')

        // get the customer group with that id
        .get(function(req, res) {
            CustomerGroup.findById(req.params.customerGroupId, function(err, customerGroup) {
                if (err)
                    res.status(500).send(err);
                res.json(customerGroup);
            });
        })

        .put(function(req, res) {
            CustomerGroup.where({_id: req.params.customerGroupId}).update(req.body, function(err, raw) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                CustomerGroup.findById(req.params.customerGroupId, function(err, customerGroup) {
                    if (err)
                        res.status(500).send(err);
                    
                    res.json(customerGroup);
                });
            });
        })

        // delete the customer group with this id
        .delete(function(req, res) {
            CustomerGroup.remove({
                _id: req.params.customerGroupId
            }, function(err) {
                if (err)
                    res.status(500).send(err);

                res.end();

                Customer.update({
                    'group._id': req.params.customerGroupId
                }, {
                    $pull: {
                        group: {
                            _id: req.params.customerGroupId
                        }
                    }
                }, {multi: true}).then(function(result) {
                    console.log(result.nModified + ' customers removed from group: ' + req.params.customerGroupId);
                });

            });
        });

    return router;
}
