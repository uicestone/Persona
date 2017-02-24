var Brand = require('../models/brand.js');

module.exports = function(router) {
    // Brand CURD
    router.route('/brand')

        // create an brand
        .post(function(req, res) {
            
            var brand = new Brand(req.body); // create a new instance of the Brand model

            // save the brand and check for errors
            brand.save(function(err) {
                if (err)
                    res.status(500).send(err);

                res.json(brand);
            });
            
        })

        // get all the brands
        .get(function(req, res) {
            if(!Brand.totalCount){
                Brand.count().exec().then(value => Brand.totalCount = value);
            }

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = {};

            if(req.query.keyword) {
                query.name = new RegExp(req.query.keyword);
            }

            if(req.query.type) {
                query.type = req.query.type;
            }

            Brand.find(query)
            .limit(limit)
            .skip(skip)
            .exec()
            .then(result => {

                if(skip + result.length > Brand.totalCount) {
                    Brand.totalCount = skip + result.length;
                }

                res.set('Items-Total', Brand.totalCount)
                .set('Items-Start', skip + 1)
                .set('Items-End', Math.min(skip + limit, Brand.totalCount))
                .json(result);
            });
        });

    // on routes that end in /brand/:brandId
    // ----------------------------------------------------
    router.route('/brand/:brandId')

        // get the brand with that id
        .get(function(req, res) {
            Brand.findById(req.params.brandId, function(err, brand) {
                if (err)
                    res.status(500).send(err);
                res.json(brand);
            });
        })

        .put(function(req, res) {
            Brand.where({_id: req.params.brandId}).update(req.body, function(err, raw) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                Brand.findById(req.params.brandId, function(err, brand) {
                    if (err)
                        res.status(500).send(err);

                    res.json(brand);
                });
            });
        })

        // delete the brand with this id
        .delete(function(req, res) {
            Brand.remove({
                _id: req.params.brandId
            }, function(err, brand) {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
