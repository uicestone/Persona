const WechatAuth = require('wechat-auth');
const redisClient = require('redis').createClient();

/*
 * 获取全局component_verify_ticket的方法
 * 从redis缓存中读取
 */
const getVerifyTicket = function(callback) {
    return redisClient.get('component_verify_ticket', function(err, ticket) {
        if (err) {
            return callback(err);
        } else if (!ticket) {
            return callback(new Error('no component_verify_ticket'));
        } else {
            return callback(null, ticket);
        }
    });
};

/*
 * 获取全局component_access_token的方法
 * 从redis缓存中读取
 */
const getComponentToken = function(callback) {
    return redisClient.get('component_access_token', function(err, token) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, JSON.parse(token));
        }
    });
};

/*
 * 保存component_access_token到redis中
 */
const saveComponentToken = function(token, callback) {
    return redisClient.setex('component_access_token', 7000, JSON.stringify(token), function(err, reply) {
        if (err) {
            callback(err);
        }
        return callback(null);
    });
};

module.exports = (router) => {
    
    router.route('/wechat-auth').post((req, res) => {
        
        console.log(req.method, req.query, req.body);
        // const wechatAuth = new WechatAuth(process.env.COMPONENT_APP_ID, process.env.COMPONENT_APP_SECRET, getVerifyTicket, getComponentToken, saveComponentToken);

        // wechatAuth.getLatestComponentToken((err, token) => {
        //   // TODO
        // });

        // wechatAuth.getPreAuthCode((err, reply) => {
        //     console.log(err, reply);
        // });

        // // auth_code 授权完成后微信返回的授权码
        // wechatAuth.getAuthToken(auth_code, function(err, reply) {
        //   // TODO
        // });

        // // authorizer_appid 授权公众号的appid
        // // authorizer_refresh_token 从微信获取的公众号刷新token，存储在db中
        // wechatAuth.refreshAuthToken(authorizer_appid, authorizer_refresh_token, function(err, reply) {
        //   // TODO
        // });

        // // authorizer_appid 授权公众号的appid
        // wechatAuth.getAuthInfo(authorizer_appid, function(err, reply) {
        //   // TODO
        // });

        // // authorizer_appid 授权公众号的appid
        // // option_name 选项名
        // wechatAuth.getAuthOption(authorizer_appid, option_name, function(err, reply) {
        //   // TODO
        // });

        // // authorizer_appid 授权公众号的appid
        // // option_name 选项名
        // // option_value选项值
        // wechatAuth.setAuthOption(authorizer_appid, option_name, option_value, function(err, reply) {
        //   // TODO
        // });

    });

    return router;
}
