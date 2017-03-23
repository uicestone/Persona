const Brand = require('../models/brand.js');

module.exports = (router) => {
    // Brand CURD
    router.route('/brand')

        // create an brand
        .post((req, res) => {
            
            let brand = new Brand(req.body); // create a new instance of the Brand model

            // save the brand and check for errors
            brand.save((err) => {
                if (err)
                    res.status(500).send(err);

                res.json(brand);
            });
            
        })

        // get all the brands
        .get((req, res) =>{

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = Brand.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.keyword) {
                query.find({
                    name: new RegExp(req.query.keyword)
                });
            }

            if(req.query.type) {
                query.find({
                    type: req.query.type
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

    // on routes that end in /brand/:brandId
    // ----------------------------------------------------
    router.route('/brand/:brandId')

        // get the brand with that id
        .get((req, res) =>{
            Brand.findById(req.params.brandId, (err, brand) => {
                if (err)
                    return res.status(500).send(err);
                res.json(brand);
            });
        })

        .put((req, res) =>{
            Brand.where({_id: req.params.brandId}).update(req.body, (err, raw) => {
                if (err)
                    return res.status(500).send(err);

                Brand.findById(req.params.brandId, (err, brand) => {
                    if (err)
                        res.status(500).send(err);

                    res.json(brand);
                });
            });
        })

        // delete the brand with this id
        .delete((req, res) =>{
            Brand.remove({
                _id: req.params.brandId
            }, (err, brand) => {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
