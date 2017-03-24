const CustomerReaching = require('../models/customerReaching.js');
const Customer = require('../models/customer.js');
const AliyunPush = require('ali-push');

module.exports = (router) => {
    // CustomerReaching CURD
    router.route('/customer-reaching')

        // create an customer reaching
        .post((req, res) => {
            
            let customerReaching = new CustomerReaching(req.body); // create a new instance of the CustomerReaching model

            // 为非管理员新增的访客字段设置品牌
            if(req.user.roles.indexOf('admin') === -1) {
                customerReaching.brand = req.user.brand.name;
            }

            customerReaching.updatedAt = new Date();

            // save the customer reaching and check for errors
            Promise.all([
                customerReaching.save(),
                Customer.find({'group._id':customerReaching.group._id})
            ]).then(result => {
                const [customerReaching, customers] = result;

                const aliyunClient = new AliyunPush({
                    AccessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
                    AccessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET
                });

                aliyunClient.SingleSendSms({
                    SignName: '智关',
                    TemplateCode: 'SMS_57690023',
                    RecNum: customers.map(customer => customer.mobile).join(','),
                    ParamString: '{}'
                }, (err, res, body) => {
                    customerReaching.sendAt = new Date();
                    customerReaching.succeeded = customers.length;
                    customerReaching.failed = 0;
                    customerReaching.save();
                    console.log('短信发送完成', body);
                });

                res.json(customerReaching);
            });
            
        })

        // get common and brand specified customer reachings
        .get((req, res) => {

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = CustomerReaching.find();

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

    // on routes that end in /customer-reaching/:customerReachingId
    // ----------------------------------------------------
    router.route('/customer-reaching/:customerReachingId')

        // get the customerReaching with that id
        .get((req, res) => {
            CustomerReaching.findById(req.params.customerReachingId, (err, customerReaching) => {
                if (err)
                    res.status(500).send(err);
                res.json(customerReaching);
            });
        })

        .put((req, res) => {
            CustomerReaching.where({_id: req.params.customerReachingId}).update(req.body, (err, raw) => {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                CustomerReaching.findById(req.params.customerReachingId, (err, customerReaching) => {
                    if (err)
                        res.status(500).send(err);

                    res.json(customerReaching);
                });
            });
        })

        // delete the customer reaching with this id
        .delete((req, res) => {
            CustomerReaching.remove({
                _id: req.params.customerReachingId
            }, (err, customerReaching) => {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
