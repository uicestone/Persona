const Channel = require('../models/channel.js');

module.exports = (router) => {
    // Channel CURD
    router.route('/channel')

        // create an channel
        .post((req, res) => {
            
            let channel = new Channel(req.body); // create a new instance of the Channel model

            // save the channel and check for errors
            channel.save().then(channel => {
                res.json(channel);
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
                    $or: [
                        {name: new RegExp(req.query.keyword)},
                        {spid: req.query.keyword}
                    ]
                });
            }

            if(req.query.topic) {
                const queryTopics = req.query.topic.split(',');
                query.find({
                    topic: {$in: queryTopics}
                });
            }

            if(req.query.orderBy) {
                if (['distributionAbility', 'rank', 'score', 'fans', 'updatedAt'].indexOf(req.query.orderBy) > -1) {
                    query.sort({
                        [req.query.orderBy]: (req.query.order === 'asc' || req.query.order === 'true' || Number(req.query.order) > 0 ? 'asc' : 'desc')
                    });
                }
                else {
                    query.sort({
                        [req.query.orderBy]: (req.query.order === 'desc' || req.query.order === 'false' || Number(req.query.order) < 0 ? 'desc' : 'asc')
                    });
                }
            }
            else {
                query.sort({rank:-1});
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
            Channel.findById(req.params.channelId).then(channel => {
                res.json(channel);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {
            Channel.findByIdAndUpdate(req.params.channelId, req.body, {new: true}).then(channel => {
                res.json(channel);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the channel with this id
        .delete((req, res) => {
            Channel.findByIdAndRemove(req.params.channelId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    return router;
}
