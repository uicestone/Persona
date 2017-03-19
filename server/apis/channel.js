var Channel = require('../models/channel.js');

module.exports = function(router) {
    // Channel CURD
    router.route('/channel')

        // create an channel
        .post(function(req, res) {
            
            var channel = new Channel(req.body); // create a new instance of the Channel model

            // save the channel and check for errors
            channel.save(function(err) {
                if (err)
                    res.status(500).send(err);

                res.json(channel);
            });
            
        })

        // get all the channels
        .get(function(req, res) {
            if(!Channel.totalCount){
                Channel.count().exec().then(value => Channel.totalCount = value);
            }

            var limit = +req.query.limit || 20;
            var skip = +req.query.skip || 0;

            var query = {};

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.keyword) {
                query.name = new RegExp(req.query.keyword);
            }

            if(req.query.type) {
                query.type = req.query.type;
            }

            Channel.find(query)
            .limit(limit)
            .skip(skip)
            .exec()
            .then(result => {

                if(skip + result.length > Channel.totalCount) {
                    Channel.totalCount = skip + result.length;
                }

                res.set('Items-Total', Channel.totalCount)
                .set('Items-Start', skip + 1)
                .set('Items-End', Math.min(skip + limit, Channel.totalCount))
                .json(result);
            });
        });

    // on routes that end in /channel/:channelId
    // ----------------------------------------------------
    router.route('/channel/:channelId')

        // get the channel with that id
        .get(function(req, res) {
            Channel.findById(req.params.channelId, function(err, channel) {
                if (err)
                    res.status(500).send(err);
                res.json(channel);
            });
        })

        .put(function(req, res) {
            Channel.where({_id: req.params.channelId}).update(req.body, function(err, raw) {
                if (err) {
                    res.status(500).send(err);
                    return;
                }

                Channel.findById(req.params.channelId, function(err, channel) {
                    if (err)
                        res.status(500).send(err);

                    res.json(channel);
                });
            });
        })

        // delete the channel with this id
        .delete(function(req, res) {
            Channel.remove({
                _id: req.params.channelId
            }, function(err, channel) {
                if (err)
                    res.status(500).send(err);

                res.end();
            });
        });

    return router;
}
