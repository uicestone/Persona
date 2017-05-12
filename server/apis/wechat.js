const redisClient = require('redis').createClient();
const wechatCrypto = require('../util/wechatCrypto.js');
const xmlParseString = require('xml2js').parseString;
const Brand = require('../models/brand.js');
const Customer = require('../models/customer.js');
const Wechat = require('../models/wechat.js');
const WechatApi = require('../models/wechatApi.js');
const WechatAuth = require('../models/wechatAuth.js');

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

        const wechatAuth = WechatAuth();

        if (req.query.auth_code) {

            wechatAuth.getAuthToken(req.query.auth_code, function(err, result) {

                const authorizationInfo = result.authorization_info;
                const appId = authorizationInfo.authorizer_appid;
                const accessToken = authorizationInfo.authorizer_access_token;
                const refreshToken = authorizationInfo.authorizer_refresh_token;

                // 将auth_code换access_token并记录在redis
                WechatAuth.saveAuthorizerAccessToken(authorizationInfo.authorizer_appid, authorizationInfo.authorizer_access_token, authorizationInfo.expires_in);

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
                        signature: info.signature,
                        refreshToken: authorizationInfo.authorizer_refresh_token
                    };

                    if (!req.user || !req.user.brand) {
                        return;
                    }

                    Wechat.findOneAndUpdate(
                        {appId: wechatInfo.appId},
                        wechatInfo,
                        {upsert: true, new: true}
                    ).exec().then(wechat => {
                        console.log(wechat);
                        Brand.findOneAndUpdate(
                            {name: req.user.brand.name},
                            {$addToSet: {wechats: wechat}},
                            {upsert: true, new: true}
                        ).exec();
                    });

                });

                res.redirect(`${req.query.homeUrl}/#!${req.query.intendedUri}`);
            });
        } else {
            wechatAuth.getPreAuthCode((err, reply) => {
                if (err) {
                    console.error(err);
                    res.status(500).send(err);
                    return;
                }
                res.send(`https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${process.env.COMPONENT_APP_ID}&pre_auth_code=${reply.pre_auth_code}&redirect_uri=`);
            });
        }
    });

    router.route('/wechat/:appId')

    .post((req, res) => {
        WechatApi(req.params.appId).then(wechatApi => {
            if (req.body.sync) {

                let syncFinalPromises = [];

                wechatApi.getFollowers((err, result) => {
                    let openIds = result.data.openid;
                    let getUsersPromises = [];
                    while (openIds.length > 0) {
                        openIdsChunk = openIds.splice(0, 100);
                        getUsersPromises.push(new Promise((resolve, reject) => {
                            wechatApi.batchGetUsers(openIdsChunk, function (err, result) {
                                if (err) {
                                    reject(err);
                                }
                                resolve(result.user_info_list);
                            });
                        }));
                    }
                    Promise.all(getUsersPromises).then(result => {
                        const users = result.reduce((prev, current) => {
                            return prev.concat(current);
                        }, []);

                        users.forEach(user => {

                            const customer = {
                                name: user.nickname,
                                openId: user.openid,
                                sex: 0 ? '未知' : (1 ? '男' : '女'),
                                city: user.city,
                                province: user.province,
                                country: user.country,
                                avatarUrl: user.headimgurl,
                                tags: user.tagid_list,
                                brand: req.user.brand.name
                            };

                            const promise = Customer.findOneAndUpdate(
                                {openId: user.openid},
                                customer,
                                {upsert: true}
                            ).exec();

                            syncFinalPromises.push(promise);
                        });
                    });
                });

                wechatApi.getMaterialCount((err, result) => {
                    const newsCount = result.news_count;
                    let getMaterialsPromises = [];
                    for (let offset = 0; offset < newsCount; offset += 20) {
                        getMaterialsPromises.push(new Promise((resolve, reject) => {
                            wechatApi.getMaterials('news', offset, 20, function (err, result) {
                                if (err) {
                                    reject(err);
                                }
                                result.item.forEach(item => {
                                    item.content.news_item.forEach(newsItem => {
                                        delete newsItem.content;
                                    })
                                });
                                resolve(result.item);
                            });
                        }));
                    }
                    Promise.all(getMaterialsPromises).then(result => {
                        const newsMaterials = result.reduce((prev, current) => {
                            return prev.concat(current);
                        }, []);

                        const promise = Wechat.findOneAndUpdate({appId: req.params.appId}, {newsMaterials: newsMaterials}).exec();
                        syncFinalPromises.push(promise);
                    });
                });

                Promise.all(syncFinalPromises).then(() => {
                    res.json({message: '同步已完成'});
                });
            }

        }).catch(err => {
            console.error(err);
        });
    })

    .get((req, res) => {
        Wechat.findOne({appId: req.params.appId}).then(wechat => {
            res.json(wechat);
        });
    });

    router.route('/wechat/:appId/qrscene')

    .get((req, res) => {
        Wechat.findOne({appId: req.params.appId}).then(wechat => {
            res.json(wechat.qrScenes);
        });
    })

    .post((req, res) => {

        let wechatApi;

        WechatApi(req.params.appId).then(api => {
            wechatApi = api;
            return Wechat.findOneAndUpdate({appId: req.params.appId}, {$inc: {'lastQrSceneId.limit': 1}}, {new: true});                      
        }).then(wechat => {
            wechatApi.createLimitQRCode(wechat.lastQrSceneId.limit, (err, result) => {
                let qrScene = result;
                qrScene.id = wechat.lastQrSceneId.limit;
                qrScene.url = wechatApi.showQRCodeURL(qrScene.ticket);
                qrScene.name = req.body.name;
                qrScene.createdAt = new Date();
                wechat.qrScenes.push(qrScene);
                wechat.save();
                res.json(qrScene);
            });
        });

    });

    return router;
}
