var CustomerGroup = require('../models/customerGroup.js');
var Customer = require('../models/customer.js');

module.exports = function(router) {

    var arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup']
    var advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];

    // CustomerGroup CURD
    router.route('/customer-group')

        // create a customer group
        .post(function(req, res) {
            
            var customerGroup = new CustomerGroup(req.body);      // create a new instance of the CustomerGroup model

            // 为非管理员新增的访客分组设置品牌
            if(req.user.roles.indexOf('admin') === -1) {
                customerGroup.brand = req.user.brand.name;
            }
            
            // save the customer group and check for errors
            customerGroup.save(function(err) {
                if (err)
                    res.status(500).send(err);

                res.json(customerGroup);

                var query = {};

                var arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup']
                var advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];
                
                // 精准搜索字段
                var preciseKeys = Object.keys(customerGroup.query).filter(function(key) {
                    return arrayQueryParams.indexOf(key) === -1;
                });

                preciseKeys.forEach(function(key) {
                    query[key] = customerGroup.query[key];
                });

                // 包含标签
                if(customerGroup.query.withTags) {
                    !query.tags && (query.tags = {});
                    query.tags['$all'] = Array.isArray(customerGroup.query.withTags) ? customerGroup.query.withTags : [customerGroup.query.withTags];
                }

                // 排除标签
                if(customerGroup.query.withoutTags) {
                    !query.tags && (query.tags = {});
                    query.tags['$nin'] = Array.isArray(customerGroup.query.withoutTags) ? customerGroup.query.withoutTags : [customerGroup.query.withoutTags];
                }

                // 在访客组
                if(customerGroup.query.inGroup) {
                    !query.group && (query['group._id'] = {});
                    query['group._id']['$all'] = Array.isArray(customerGroup.query.inGroup) ? customerGroup.query.inGroup : [customerGroup.query.inGroup];
                }

                // 不在访客组
                if(customerGroup.query.notInGroup) {
                    !query.group && (query['group._id'] = {});
                    query['group._id']['$nin'] = Array.isArray(customerGroup.query.notInGroup) ? customerGroup.query.notInGroup : [customerGroup.query.notInGroup];
                }

                // 维度过滤
                advancedQueryParams.forEach(function(attribute) {
                    if(customerGroup.query[attribute]) {
                        query[attribute] = {$lte: customerGroup.query[attribute] / 100, $gt: (customerGroup.query[attribute] - 10) / 100}
                    }
                });

                if(req.user.roles.indexOf('admin') === -1) {
                    query.brand = req.user.brand.name;
                }
                
                Customer.update(query, {
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

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.keyword) {
                query = {
                    name: new RegExp(req.query.keyword)
                };
            }

            if(req.user.roles.indexOf('admin') === -1) {
                query.brand = req.user.brand.name;
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
