const bluebird = require('bluebird');
const WechatApi = require('open-wechat-api');
const redis = require('redis');
const Wechat = require('../models/wechat.js');
const WechatAuth = require('../models/wechatAuth.js');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient();

module.exports = (appId) => {

    let wechat;

    return Wechat.findOne({appId: appId}).exec()

    .then(w => {

        if (!w) {
            throw 'Wechat App ID not found';
        }

        wechat = w;
        return redisClient.getAsync(`authorizer_access_token_${wechat.appId}`);
    })
    .then(accessToken => {

        if (accessToken) {
            return accessToken;
        }
        else {
            const wechatAuth = WechatAuth();
            return new Promise((resolve, reject) => {
                wechatAuth.refreshAuthToken(wechat.appId, wechat.refreshToken, function(err, result) {
                    WechatAuth.saveAuthorizerAccessToken(wechat.appId, result.authorizer_access_token, result.expires_in);
                    resolve(result.authorizer_access_token);
                });
            });
        }

    }).then(accessToken => {
        return new WechatApi(wechat.appId, {authorizer_access_token: accessToken});
    }).catch(err => {
        console.error(err);
    });
};
