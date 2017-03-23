const Channel = require('../models/channel.js');

module.exports = (router) => {
    // Channel CURD
    router.route('/channel')

        // create an channel
        .post((req, res) => {
            
            let channel = new Channel(req.body); // create a new instance of the Channel model

            // save the channel and check for errors
            channel.save((err) => {
                if (err)
                    res.status(500).send(err);

                res.json(channel);
            });
            
        })

        // get all the channels
        .get((req, res) => {

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = Channel.find();

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

    // on routes that end in /channel/:channelId
    // ----------------------------------------------------
    router.route('/channel/:channelId')

        // get the channel with that id
        .get((req, res) => {
            Channel.findById(req.params.channelId, (err, channel) => {
                if (err)
                    res.status(500).send(err);
                res.json(channel);
            });
        })

        .put((req, res) => {
            Channel.where({_id: req.params.channelId}).update(req.body, (err, raw) => {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                Channel.findById(req.params.channelId, (err, channel) => {
                    if (err)
                        res.status(500).send(err);

                    res.json(channel);
                });
            });
        })

        // delete the channel with this id
        .delete((req, res) => {
            Channel.remove({
                _id: req.params.channelId
            }, (err, channel) => {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
