var User = require('../models/user');
var crypto = require('crypto');

module.exports = function(router) {
    
    router.route('/auth/login')
        .post(function(req, res) {
            
            if(!req.body.username) {
                res.status(400).json({message: '请输入用户名'});
                return;
            }

            if(!req.body.password) {
                res.status(400).json({message: '请输入密码'});
                return;
            }

            User.findOne({$or:[{email: req.body.username}, {username: req.body.username}]}).then(function(user) {
                
                if(!user) {
                    res.status(401).json({message: '用户不存在'});
                    return;
                }

                if(user.password !== req.body.password) {
                    res.status(403).json({message: '密码错误'});
                    return;
                }

                if(user.token) {
                    res.send(user);
                }
                else {
                    crypto.randomBytes(48, function(err, buffer) {
                        var token = buffer.toString('hex');
                        user.token = token;
                        user.save();
                        res.json(user);
                    });
                }

            });
        });

    router.route('/auth/user')
        .get(function(req, res) {
            res.json(req.user);
        });

    return router;
}
