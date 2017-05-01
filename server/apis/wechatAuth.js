const WechatAuth = require('wechat-auth');
const redisClient = require('redis').createClient();
const wechatCrypto = require('../util/wechatCrypto.js');
const xmlParseString = require('xml2js').parseString;
// const env = require('node-env-file');

// env(`${__dirname}/../../.env`);
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

const saveAuthorizationInfo = function(info) {
    return redisClient.setex(`authorization_info_${info.authorizer_appid}`, 7000, JSON.stringify(info));
}

module.exports = (router) => {
    
    router.route('/wechat-auth')

    .post((req, res) => {
        
        let cryptor = new wechatCrypto(process.env.COMPONENT_TOKEN, process.env.COMPONENT_ENCODING_AES_KEY, process.env.COMPONENT_APP_ID);

        devSign = cryptor.getSignature(req.query.timestamp, req.query.nonce, req.body.xml.Encrypt[0]);

        if (devSign !== req.query.msg_signature) {
            res.status(403).json({message:'Invalid signature.'});
            return;
        }

        const xmlMessage = cryptor.decrypt(req.body.xml.Encrypt[0]).message;
        
        xmlParseString(xmlMessage, {async: false, trim: true}, (err, result) => {
            ticket = result.xml.ComponentVerifyTicket[0];
            redisClient.setex('component_verify_ticket', 7000, ticket);
            console.log(`[${new Date()}] ComponentVerifyTicket已更新：${ticket}`);
        });

        res.send('success').end();

    })

    .get((req, res) => {
        const wechatAuth = new WechatAuth(process.env.COMPONENT_APP_ID, process.env.COMPONENT_APP_SECRET, getVerifyTicket, getComponentToken, saveComponentToken);
        if (req.query.auth_code) {
            wechatAuth.getAuthToken(req.query.auth_code, function(err, result) {

                const authorizationInfo = result.authorization_info;
                const appId = authorizationInfo.authorizer_appid;
                const accessToken = authorizationInfo.authorizer_access_token;
                const refreshToken = authorizationInfo.authorizer_refresh_token;

                // 将auth_code换access_token并记录在redis
                saveAuthorizationInfo(authorizationInfo);

                // 将微信公众号基本信息记录在mongodb
                wechatAuth.getAuthInfo(appId, function(err, result) {

                    const info = result.authorizer_info;

                    const wechatInfo = {
                        appId: appId,
                        name: info.nick_name,
                        alias: info.alias,
                        originalId: info.user_name,
                        logoUrl: info.head_img,
                        isService: info.service_type_info.id === 2,
                        isVerified: info.verify_type_info.id >= 0,
                        qrcodeUrl: info.qrcode_url,
                        entityName: info.principal_name,
                        signature: info.signature
                    };

                    console.log(wechatInfo);
                });

                res.redirect(`${req.query.homeUrl}/#!${req.query.intendedUri}`);
            });
        } else {
            wechatAuth.getPreAuthCode((err, reply) => {
                res.send(`https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${process.env.COMPONENT_APP_ID}&pre_auth_code=${reply.pre_auth_code}&redirect_uri=`);
            });
        }
    });

    return router;
}

        // const wechatAuth = new WechatAuth(process.env.COMPONENT_APP_ID, process.env.COMPONENT_APP_SECRET, getVerifyTicket, getComponentToken, saveComponentToken);

        // // wechatAuth.getLatestComponentToken((err, token) => {
        // //     console.log('token', token);
        // // });

        // wechatAuth.getPreAuthCode((err, reply) => {
        //     console.log('preAuthCode', reply);
        //     console.log(`https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${process.env.COMPONENT_APP_ID}&pre_auth_code=${reply.pre_auth_code}&redirect_uri=http://persona.imnumerique.com/#!wechat-auth`);
        // });

        // const auth_code = 'queryauthcode@@@k_Yw4Yz26dHknqqS6i3Krs3VjMOsoLvmxz2mIjqXkiEAlbbABKd1D-ru8idKw-IfGTGLwOvs6peGmPndnZ7SxA';

        // // auth_code 授权完成后微信返回的授权码
        // wechatAuth.getAuthToken(auth_code, function(err, reply) {
        //     console.log(reply);
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
