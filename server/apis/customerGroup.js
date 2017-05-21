const CustomerGroup = require('../models/customerGroup.js');
const Customer = require('../models/customer.js');

module.exports = (router) => {

    const arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup']
    const advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];

    // CustomerGroup CURD
    router.route('/customer-group')

        // create a customer group
        .post((req, res) => {
            
            let customerGroup = new CustomerGroup(req.body);      // create a new instance of the CustomerGroup model

            // 为非管理员新增的访客分组设置品牌
            if(req.user.roles.indexOf('admin') === -1) {
                customerGroup.brand = req.user.brand.name;
            }
            
            // save the customer group and check for errors
            customerGroup.save().then((customerGroup) => {

                res.json(customerGroup);

                let query = Customer.find();

                const arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup']
                const advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];
                const utilQueryParams = ['token', 'export', 'fields', 'limit', 'page', 'skip'];
                
                // 精准搜索字段
                const preciseKeys = Object.keys(customerGroup.query).filter((key) => {
                    return arrayQueryParams.indexOf(key) === -1
                    && advancedQueryParams.indexOf(key) === -1
                    && utilQueryParams.indexOf(key) === -1;
                });

                preciseKeys.forEach((key) => {
                    let value;

                    try {
                        value = JSON.parse(customerGroup.query[key]);
                    }
                    catch(e) {
                        value = customerGroup.query[key];
                    }

                    if (value === '*') {
                        query.find({
                            [key]: {$exists: true}
                        });
                    }
                    else if (value === '-') {
                        query.find({
                            [key]: {$exists: false}
                        });
                    }
                    else if (value.indexOf(',') > -1) {
                        query.find({
                            [key]: {$in: value.split(',')}
                        })
                    }
                    else {
                        query.find({
                            [key]: value
                        });
                    }
                });

                // 包含标签
                if(customerGroup.query.withTags && customerGroup.query.withTags.length) {
                    query.find({
                        tags: {
                            $all: Array.isArray(customerGroup.query.withTags) ? customerGroup.query.withTags : [customerGroup.query.withTags]
                        }
                    });
                }

                // 排除标签
                if(customerGroup.query.withoutTags && customerGroup.query.withoutTags.length) {
                    query.find({
                        tags: {
                            $nin: Array.isArray(customerGroup.query.withoutTags) ? customerGroup.query.withoutTags : [customerGroup.query.withoutTags]
                        }
                    });
                }

                // 在访客组
                if(customerGroup.query.inGroup && customerGroup.query.inGroup.length) {
                    query.find({
                        'group._id': {
                            $in: Array.isArray(customerGroup.query.inGroup) ? customerGroup.query.inGroup : [customerGroup.query.inGroup]
                        }
                    });
                }

                // 不在访客组
                if(customerGroup.query.notInGroup && customerGroup.query.notInGroup.length) {
                    query.find({
                        'group._id': {
                            $nin: Array.isArray(customerGroup.query.notInGroup) ? customerGroup.query.notInGroup : [customerGroup.query.notInGroup]
                        }
                    });
                }

                // 维度过滤
                advancedQueryParams.forEach((attribute) => {
                    if(customerGroup.query[attribute]) {
                        query.find({
                            [attribute]: {$lte: customerGroup.query[attribute] / 100, $gt: (customerGroup.query[attribute] - 10) / 100}
                        });
                    }
                });

                // 非平台管理员只能看到本品牌的访客
                if(req.user.roles.indexOf('admin') === -1) {
                    query.find({
                        brand: req.user.brand.name
                    });
                }

                return query.setOptions({multi: true}).update({
                    $addToSet: {
                        group: {
                            _id: customerGroup._id,
                            name: customerGroup.name
                        }
                    }
                })
            }).then((result) => {
                console.log(result.nModified + ' customers added to group: ' + customerGroup.name);
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

        // get all the customer groups
        .get((req, res) => {
            
            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = CustomerGroup.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.keyword) {
                query.find({
                    name: new RegExp(req.query.keyword)
                });
            }

            if(req.user.roles.indexOf('admin') === -1) {
                query.find({
                    brand: req.user.brand.name
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

    // on routes that end in /customer-group/:customerGroupId
    // ----------------------------------------------------
    router.route('/customer-group/:customerGroupId')

        // get the customer group with that id
        .get((req, res) => {
            CustomerGroup.findById(req.params.customerGroupId).then(customerGroup => {
                res.json(customerGroup);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {
            CustomerGroup.findByIdAndUpdate(req.params.customerGroupId, req.body, {new: true}).then(customerGroup => {
                res.json(customerGroup);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the customer group with this id
        .delete((req, res) => {
            CustomerGroup.findByIdAndRemove(req.params.customerGroupId).then(() => {
                
                res.end();

                return Customer.update({
                    'group._id': req.params.customerGroupId
                }, {
                    $pull: {
                        group: {
                            _id: req.params.customerGroupId
                        }
                    }
                }, {multi: true});

            }).then((result) => {
                console.log(result.nModified + ' customers removed from group: ' + req.params.customerGroupId);
            })
            .catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    return router;
}
