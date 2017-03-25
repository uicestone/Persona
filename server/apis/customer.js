const Customer = require('../models/customer.js');
const CustomerField = require('../models/customerField.js');
const xlsx = require('node-xlsx').default;

module.exports = (router) => {
    // Customer CURD
    router.route('/customer')

        // create a customer
        .post((req, res) => {
            
            let customer = new Customer(req.body);      // create a new instance of the Customer model

            // save the customer and check for errors
            customer.save((err) => {
                if (err)
                    res.status(500).send(err);

                res.json(customer);
            });
            
        })

        // get all the customers
        .get((req, res) => {
            
            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = Customer.find();

            const arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup']
            const advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];
            const utilQueryParams = ['token', 'export', 'fields', 'limit', 'page', 'skip'];
            
            // 精准搜索字段
            const preciseKeys = Object.keys(req.query).filter((key) => {
                return arrayQueryParams.indexOf(key) === -1
                    && advancedQueryParams.indexOf(key) === -1
                    && utilQueryParams.indexOf(key) === -1;
            });

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            preciseKeys.forEach((key) => {
                var value;

                try {
                    value = JSON.parse(req.query[key]);
                }
                catch(e) {
                    value = req.query[key];
                }

                query.find({
                    [key]: value
                });
            });

            // 包含标签
            if(req.query.withTags) {
                query.find({
                    tags: {
                        $all: Array.isArray(req.query.withTags) ? req.query.withTags : [req.query.withTags]
                    }
                });
            }

            // 排除标签
            if(req.query.withoutTags) {
                query.find({
                    tags: {
                        $nin: Array.isArray(req.query.withoutTags) ? req.query.withoutTags : [req.query.withoutTags]
                    }
                });
            }

            // 在访客组
            if(req.query.inGroup) {
                query.find({
                    'group._id': {
                        $all: Array.isArray(req.query.inGroup) ? req.query.inGroup : [req.query.inGroup]
                    }
                });
            }

            // 不在访客组
            if(req.query.notInGroup) {
                query.find({
                    'group._id': {
                        $nin: Array.isArray(req.query.notInGroup) ? req.query.notInGroup : [req.query.notInGroup]
                    }
                });
            }

            // 维度过滤
            advancedQueryParams.forEach((attribute) => {
                if(req.query[attribute]) {
                    query.find({
                        [attribute]: {$lte: req.query[attribute] / 100, $gt: (req.query[attribute] - 10) / 100}
                    });
                }
            });

            // 非平台管理员只能看到本品牌的访客
            if(req.user.roles.indexOf('admin') === -1) {
                query.find({
                    brand: req.user.brand.name
                });
            }

            if(req.query.export === 'xlsx') {

                Promise.all([
                    query.find(),
                    CustomerField.find({key: req.query.fields.split(',')})
                ]).then((result) => {
                    let [customers, fields] = result;
                    let data = [];

                    let head = fields.map(field => field.label);
                    head.unshift('NUID');
                    head.push('标签');

                    data.push(head);

                    customers.forEach(customer => {
                        let line = fields.map(field => customer[field.key]);
                        line.unshift(customer._id);
                        line.push(customer.tags.join(' '));
                        data.push(line);
                    });

                    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                        .set('Content-Disposition', 'attachment; filename=Customers.xlsx')
                        .send(xlsx.build([{name: "Customers", data: data}]));
                });

            }

            else {
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
            }
            
        });

    // on routes that end in /customer/:customerId
    // ----------------------------------------------------
    router.route('/customer/:customerId')

        // get the customer with that id
        .get((req, res) => {
            Customer.findById(req.params.customerId, (err, customer) => {
                if (err)
                    res.status(500).send(err);
                res.json(customer);
            });
        })

        .put((req, res) => {
            Customer.where({_id: req.params.customerId}).update(req.body, (err, raw) => {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                Customer.findById(req.params.customerId, (err, customer) => {
                    if (err)
                        res.status(500).send(err);
                    
                    res.json(customer);
                });
            });
        })

        // delete the customer with this id
        .delete((req, res) => {
            Customer.remove({
                _id: req.params.customerId
            }, (err, customer) => {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
