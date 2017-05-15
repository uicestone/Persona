const User = require('../models/user');

module.exports = function(req, res, next) {

    const strictAuth = !['/api/auth/login', '/api/wechat'].some(path => req.originalUrl.match(new RegExp('^' + path)));

    const token = req.get('authorization') || req.query.token;

    if(!token && strictAuth) {
        res.status(401).json({message:'无效登录，请重新登录'});
        return;
    }

    User.findOne({token}).then((user) => {
        if(!user && strictAuth) {
            res.status(401).json({message:'无效登录，请重新登录'});
            return;
        }

        if (user) {
            req.user = user;
        }

        next();
    });

}