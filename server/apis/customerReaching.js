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

                let mobiles = customers.filter(customer => customer.mobile).map(customer => customer.mobile);

                while (mobiles) {
                    const chunk = mobiles.splice(0, 100);

                    aliyunClient.SingleSendSms({
                        SignName: '智关',
                        TemplateCode: req.body.templateCode,
                        RecNum: chunk.join(','),
                        ParamString: '{}'
                    }, (err, res, body) => {

                        if (err) {
                            console.error(err);
                            return;
                        }

                        customerReaching.sendAt = new Date();
                        customerReaching.succeeded = customers.length;
                        customerReaching.failed = 0;
                        customerReaching.save();
                        console.log('短信发送请求已提交', body);
                    });                    
                }

                res.json(customerReaching);
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
            CustomerReaching.findById(req.params.customerReachingId).then(customerReaching => {
                res.json(customerReaching);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {
            CustomerReaching.findByIdAndUpdate(req.params.customerReachingId, req.body, {new: true}).then(customerReaching => {
                res.json(customerReaching);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the customer reaching with this id
        .delete((req, res) => {
            CustomerReaching.findByIdAndRemove(req.params.customerReachingId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    return router;
}
