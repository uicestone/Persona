const Project = require('../models/project.js');
const Campaign = require('../models/campaign.js');
const Types = require('mongoose').Types;

module.exports = (router, wss) => {

    router.route('/project/:projectId/kpi').get(async (req, res) => {
        
        const match = {
            project: Types.ObjectId(req.params.projectId)
        };

        const project = await Project.findById(req.params.projectId);

        match.time = {
            $gte: new Date(req.query.startDate || project.startDate),
            $lt: new Date(req.query.endDate || project.endDate)
        };

        const kpi = (await Campaign.aggregate([{
            $match: match
        }, {
            $group: {
                _id: true,
                uniqueIds: {$addToSet: {$ifNull: ["$openId", "$tempId"]}},
                registers: {$sum: {$cond: ["$registered", 1, 0]}},
                pv: {$sum: {$cond: ["$visited", 1, 0]}},
                stayingTime: {$avg: {$cond: ["$stayingTime", "$stayingTime", null]}},
                shares: {$sum: {$cond: ["$shared", 1, 0]}}
            }
        }, {
            $project: {
                uv: {$size: "$uniqueIds"},
                pv: "$pv",
                registers: "$registers",
                stayingTime: "$stayingTime",
                shares: "$shares"
            }
        }]))[0];

        if (kpi) {
            delete kpi._id;
            res.json(kpi);
        }
        else {
            res.json({
                uv: 0,
                pv: 0,
                registers: 0,
                stayingTime: 0,
                shares: 0
            });
        }

    });

    router.route('/project/:projectId/kpi-by-channels').get(async (req, res) => {

        const match = {
            project: Types.ObjectId(req.params.projectId)
        };

        const project = await Project.findById(req.params.projectId);

        match.time = {
            $gte: new Date(req.query.startDate || project.startDate),
            $lt: new Date(req.query.endDate || project.endDate)
        };

        const uvByChannel = await Campaign.aggregate([{
            $match: match
        }, {
            $group: {
                _id: "$fromChannel",
                uniqueIds: {$addToSet: {$ifNull: ["$openId", "$tempId"]}}
            }
        }, {
            $project: {
                count: {$size: "$uniqueIds"}
            }
        }]);

        const pvByChannel = await Campaign.aggregate([{
            $match: Object.assign({visited: {$exists: true}}, match)
        }, {
            $group: {
                _id: {fromChannel: "$fromChannel", name: "$visited"},
                count: {$sum: 1}
            }
        }, {
            $group: {
                _id: "$_id.fromChannel",
                pages: {$push: {name: "$_id.name", views: "$count"}},
                count: {$sum: "$count"}
            }
        }]);

        const stayingTimeByChannel = await Campaign.aggregate([{
            $match: Object.assign({stayingTime: {$exists: true}}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                time: {$avg: "$stayingTime"}
            }
        }]);

        const escapeByChannel = await Campaign.aggregate([
            {
                $match: Object.assign({visited: {$exists: true}}, match)
            },
            {
                $group: {
                    _id : {date:{$dateToString: {format: "%Y-%m-%d", date: "$time"}}, fromChannel:"$fromChannel", uniqueUser:{$ifNull: ["$openId", "$tempId"]}},
                    count: {$sum : 1},
               }
            },
            {
                $match: {count:1}
            },
            {
                $group: {
                    _id:"$_id.fromChannel",
                    count:{$sum:1}
                }
            }
        ]);

        const sharesByChannel = await Campaign.aggregate([{
            $match: Object.assign({shared: {$exists: true}}, match)
        }, {
            $group: {
                _id: {fromChannel: "$fromChannel", name: "$shared"},
                count: {$sum: 1}
            }
        }, {
            $group: {
                _id: "$_id.fromChannel",
                pages: {$push: {name: "$_id.name", shares: "$count"}},
                count: {$sum: "$count"}
            }
        }]);

        const registersByChannel = await Campaign.aggregate([{
            $match: Object.assign({registered: {$exists: true}}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                count: {$sum: 1}
            }
        }]);

        const ordersByChannel = await Campaign.aggregate([{
            $match: Object.assign({ordered: {$exists: true}}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                count: {$sum: 1},
                price: {$sum: "$price"}
            }
        }]);

        const paymentsByChannel = await Campaign.aggregate([{
            $match: Object.assign({paid: {$exists: true}}, match)
        }, {
            $group: {
                _id: "$fromChannel",
                count: {$sum: 1},
                price: {$sum: "$price"}
            }
        }]);

        res.json({
            pv: pvByChannel,
            uv: uvByChannel,
            stay: stayingTimeByChannel,
            escape: escapeByChannel,
            share: sharesByChannel,
            register: registersByChannel,
            order: ordersByChannel,
            pay: paymentsByChannel
        });
    });

    router.route('/project/:projectId/kpi-by-date').get(async (req, res) => {

        const match = {
            project: Types.ObjectId(req.params.projectId),
            time: {$exists: true}
        };

        const project = await Project.findById(req.params.projectId);

        match.time = {
            $gte: new Date(req.query.startDate || project.startDate),
            $lt: new Date(req.query.endDate || project.endDate)
        };

        const kpiByDate = await Campaign.aggregate([{
            $match: match
        }, {
            $group: {
                _id: {$dateToString: {format: "%Y-%m-%d", date: "$time"}},
                uniqueIds: {$addToSet: {$ifNull: ["$openId", "$tempId"]}},
                registers: {$sum: {$cond: ["$registered", 1, 0]}},
                pv: {$sum: {$cond: ["$visited", 1, 0]}},
                stayingTime: {$avg: {$cond: ["$stayingTime", "$stayingTime", null]}},
                shares: {$sum: {$cond: ["$shared", 1, 0]}}
            }
        }, {
            $project: {
                uv: {$size: "$uniqueIds"},
                pv: "$pv",
                registers: "$registers",
                stayingTime: "$stayingTime",
                shares: "$shares"
            }
        }, {
            $sort: {
                _id: 1
            }
        }]);

        const escapeByDate = await Campaign.aggregate([
            {
                $match: Object.assign({visited: {$exists: true}}, match)
            },
            {
                $group: {
                    _id : {
                        date:{$dateToString: {format: "%Y-%m-%d", date: "$time"}},
                        uniqueUser:{$ifNull: ["$openId", "$tempId"]}},
                    count: {$sum : 1}
                }},
            {
                $match: {count:1}
            },
            {
                $group: {_id:"$_id.date", count:{$sum:1}}
            }
        ]);

        kpiByDate.forEach(kpiPerDate => {
            const date = kpiPerDate._id;
            const escapeThatDate = escapeByDate.filter(escapePerDate => escapePerDate._id === date)[0];
            kpiPerDate.escapeRate = escapeThatDate ? escapeThatDate.count / kpiPerDate.uv : 0;
        });

        res.send(kpiByDate);
    });

    router.route('/project/:projectId/kpi-by-device').get(async (req, res) => {

        const match = {
            project: Types.ObjectId(req.params.projectId),
            device: {$exists: true}
        };

        const project = await Project.findById(req.params.projectId);

        match.time = {
            $gte: new Date(req.query.startDate || project.startDate),
            $lt: new Date(req.query.endDate || project.endDate)
        };

        Campaign.aggregate([{
            $match: match
        },{
            $group: {
                _id: "$device",
                uv: {$sum: 1},
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }]).then((result) => {
            res.send(result);
        });
    });

    router.route('/project/:projectId/kpi-by-region').get((req, res) => {
        
        let match = {
            project: Types.ObjectId(req.params.projectId),
            province: {$exists: true}
        };

        if (req.query.startDate || req.query.endDate) {
            const matchTime = {};
            if (req.query.startDate) {
                matchTime.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                matchTime.$lt = new Date(req.query.endDate);
            }
            match.time = matchTime;
        }

        Campaign.aggregate([{
            $match: match
        },{
            $group: {
                _id: "$province",
                converts: {$sum: {$cond: {if: "$converted", then: 1, else: 0}}}
            }
        }]).then((result) => {
            res.send(result);
        });
    });    

    return router;
}