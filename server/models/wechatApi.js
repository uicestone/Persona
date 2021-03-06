const bluebird = require('bluebird');
const WechatApi = require('open-wechat-api');
const redis = require('redis');
const Wechat = require('../models/wechat.js');
const WechatAuth = require('../models/wechatAuth.js');
const util = require('open-wechat-api/lib/util.js');
const wrapper = util.wrapper;
const postJSON = util.postJSON;

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient();

WechatApi.prototype.createTag = function (name, callback) {
    // https://api.weixin.qq.com/cgi-bin/groups/create?access_token=ACCESS_TOKEN
    // POST数据格式：json
    // POST数据例子：{"tag":{"name":"test"}}
    const url = this.prefix + 'tags/create?access_token=' + this.token.accessToken;
    const data = {
        "tag": {"name": `${name}@Persona`}
    };
    this.request(url, postJSON(data), wrapper(callback));
};

WechatApi.prototype.deleteTag = function (tagid, callback) {
    // https://api.weixin.qq.com/cgi-bin/tags/delete?access_token=ACCESS_TOKEN
    // POST数据格式：JSON
    // POST数据例子：
    // {
    //   "tag":{
    //        "id" : 134
    //   }
    // }
    const url = this.prefix + 'tags/delete?access_token=' + this.token.accessToken;
    const data = {
        "tag": {"id": tagid}
    };
    this.request(url, postJSON(data), wrapper(callback));
};

WechatApi.prototype.getTags = function (callback) {
    // https://api.weixin.qq.com/cgi-bin/tags/get?access_token=ACCESS_TOKEN
    const url = this.prefix + 'tags/get?access_token=' + this.token.accessToken;
    this.request(url, {dataType: 'json'}, wrapper(callback));
};

WechatApi.prototype.batchTagging = function (openid_list, tagid, callback) {
    // https://api.weixin.qq.com/cgi-bin/tags/members/batchtagging?access_token=ACCESS_TOKEN
    // POST数据格式：JSON
    // POST数据例子：
    // {
    //   "openid_list" : [//粉丝列表
    //     "ocYxcuAEy30bX0NXmGn4ypqx3tI0",
    //     "ocYxcuBt0mRugKZ7tGAHPnUaOW7Y"
    //   ],
    //   "tagid" : 134
    // }
    const url = this.prefix + 'tags/members/batchtagging?access_token=' + this.token.accessToken;
    const data = {
        "openid_list": openid_list,
        "tagid": tagid
    };
    this.request(url, postJSON(data), wrapper(callback));
};

WechatApi.prototype.massSendByTag = function (opts, receivers, callback) {
    let url;
    if (Array.isArray(receivers)) {
        opts.touser = receivers;
        url = this.prefix + 'message/mass/send?access_token=' + this.token.accessToken;
    } else {
        if (typeof receivers === 'boolean') {
            opts.filter = {
                "is_to_all": receivers
            };
        } else {
            opts.filter = {
                "tag_id": receivers
            };
        }
        url = this.prefix + 'message/mass/sendall?access_token=' + this.token.accessToken;
    }
    // https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=ACCESS_TOKEN
    this.request(url, postJSON(opts), wrapper(callback));
};

WechatApi.prototype.massSendNewsByTag = function (mediaId, receivers, callback) {
    const opts = {
        "mpnews": {
            "media_id": mediaId
        },
        "msgtype": "mpnews"
    };
    this.massSendByTag(opts, receivers, callback);
};

WechatApi.prototype.massSendTextByTag = function (content, receivers, callback) {
    const opts = {
        "text": {
            "content": content
        },
        "msgtype": "text"
    };
    this.massSendByTag(opts, receivers, callback);
};

module.exports = async (appId, accessToken) => {
    
    if (!accessToken) {
        const wechat = await Wechat.findOne({appId: appId});
        
        if (!wechat) {
            throw 'Wechat App ID not found'; 
        }

        accessToken = await redisClient.getAsync(`authorizer_access_token_${wechat.appId}`);

        if (!accessToken) {
            const wechatAuth = WechatAuth();
            const result = await wechatAuth.refreshAuthTokenAsync(wechat.appId, wechat.refreshToken);
            accessToken = result.authorizer_access_token;
            WechatAuth.saveAuthorizerAccessToken(wechat.appId, result.authorizer_access_token, result.expires_in);
        }
    }

    return new WechatApi(appId, {authorizer_access_token: accessToken});
};
