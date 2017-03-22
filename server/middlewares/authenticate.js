var User = require('../models/user');

module.exports = function(req, res, next) {

    if(req.originalUrl === '/api/auth/login') {
        next();
        return;
    }

    var token = req.get('authorization') || req.query.token;

    if(!token) {
        res.status(401).json({message:'无效登录，请重新登录'});
        return;
    }

    User.findOne({token: token}).then(function(user) {
        if(!user) {
            res.status(401).json({message:'无效登录，请重新登录'});
            return;
        }

        req.user = user;
        next();
    });

}