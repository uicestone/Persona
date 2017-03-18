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
                    res.status(500).send(err);

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

            var arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup']
            var advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];
            
            // 精准搜索字段
            var preciseKeys = Object.keys(req.query).filter(function(key) {
                return arrayQueryParams.indexOf(key) === -1;
            });

            preciseKeys.forEach(function(key) {
                query[key] = req.query[key];
            });

            // 包含标签
            if(req.query.withTags) {
                !query.tags && (query.tags = {});
                query.tags['$all'] = Array.isArray(req.query.withTags) ? req.query.withTags : [req.query.withTags];
            }

            // 排除标签
            if(req.query.withoutTags) {
                !query.tags && (query.tags = {});
                query.tags['$nin'] = Array.isArray(req.query.withoutTags) ? req.query.withoutTags : [req.query.withoutTags];
            }

            // 在访客组
            if(req.query.inGroup) {
                !query.group && (query['group._id'] = {});
                query['group._id']['$all'] = Array.isArray(req.query.inGroup) ? req.query.inGroup : [req.query.inGroup];
            }

            // 不在访客组
            if(req.query.notInGroup) {
                !query.group && (query['group._id'] = {});
                query['group._id']['$nin'] = Array.isArray(req.query.notInGroup) ? req.query.notInGroup : [req.query.notInGroup];
            }

            // 维度过滤
            advancedQueryParams.forEach(function(attribute) {
                if(req.query[attribute]) {
                    query[attribute] = {$lte: req.query[attribute] / 100, $gt: (req.query[attribute] - 10) / 100}
                }
            });

            // 非平台管理员只能看到本品牌的访客
            if(req.user.roles.indexOf('admin') === -1) {
                query.brand = req.user.brand.name;
            }

            Customer.find(query)
            .limit(limit)
            .skip(skip)
            .exec()
            .then(result => {

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
                    res.status(500).send(err);
                res.json(customer);
            });
        })

        .put(function(req, res) {
            Customer.where({_id: req.params.customerId}).update(req.body, function(err, raw) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                Customer.findById(req.params.customerId, function(err, customer) {
                    if (err)
                        res.status(500).send(err);
                    
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
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
