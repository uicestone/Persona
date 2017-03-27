const CustomerField = require('../models/customerField.js');

module.exports = (router) => {
    // CustomerField CURD
    router.route('/customer-field')

        // create an customer field
        .post((req, res) => {
            
            let customerField = new CustomerField(req.body); // create a new instance of the CustomerField model

            // 为非管理员新增的访客字段设置品牌
            if(req.user.roles.indexOf('admin') === -1) {
                customerField.brand = req.user.brand.name;
            }

            // save the customer field and check for errors
            customerField.save().then(customerField => {
                res.json(customerField);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
            
        })

        // get common and brand specified customer fields
        .get((req, res) => {

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = CustomerField.find();

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

    // on routes that end in /customer-field/:customerFieldId
    // ----------------------------------------------------
    router.route('/customer-field/:customerFieldId')

        // get the customerField with that id
        .get((req, res) => {
            CustomerField.findById(req.params.customerFieldId).then(customerField => {
                res.json(customerField);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {
            CustomerField.findByIdAndUpdate(req.params.customerFieldId, req.body, {new: true}).then(customerField => {
                res.json(customerField);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the customer field with this id
        .delete((req, res) => {
            CustomerField.findByIdAndRemove(req.params.customerFieldId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    return router;
}
