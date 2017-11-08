const redisClient = require('redis').createClient();
const wechatCrypto = require('wechat-crypto');
const xmlParseString = require('xml2js').parseString;
const Brand = require('../models/brand.js');
const Customer = require('../models/customer.js');
const CustomerGroup = require('../models/customerGroup.js');
const Wechat = require('../models/wechat.js');
const WechatMessage = require('../models/wechatMessage.js');
const WechatApi = require('../models/wechatApi.js');
const WechatAuth = require('../models/wechatAuth.js');
const camelcaseKeys = require('camelcase-keys');
const url = require('url');

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
            if (result.xml.ComponentVerifyTicket) {
                ticket = result.xml.ComponentVerifyTicket[0];
                redisClient.setex('component_verify_ticket', 7000, ticket);
                console.log(`[${new Date()}] ComponentVerifyTicket已更新：${ticket}`);
            }
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

                    Brand.findOne({name: req.user.brand.name}).exec()
                    .then(brand => {
                        if (!brand) {
                            brand = new Brand({name: req.user.brand.name});
                            return brand.save();
                        }
                        else {
                            return brand;
                        }
                    })
                    .then(brand => {
                        Wechat.findOneAndUpdate(
                            {appId: wechatInfo.appId},
                            wechatInfo,
                            {upsert: true, new: true}
                        ).exec()
                        .then(wechat => {
                            const wechatIndex = brand.wechats.map(wechat => wechat.appId).indexOf(wechat.appId);
                            if (wechatIndex === -1) {
                                brand.wechats.push(wechat);
                            }
                            else {
                                brand.wechats[wechatIndex] = wechat;
                            }
                            brand.save();
                        });
                    });
                });

                res.redirect(`${req.query.homeUrl}/#!${req.query.intendedUri}`);
            });
        }
        else {
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

    router.route('/wechat-oauth')

    .get((req, res) => {        
        const wechatAuth = WechatAuth();
        wechatAuth.getOAuthAccessToken(req.query.appid, req.query.code, function(err, reply) {

            if (err) {
                console.error(`AppID ${req.query.appid}: wechat oauth error`, err);
                return;
            }

            const redirectUrl = new url.URL(req.query.state);
            redirectUrl.searchParams.set('openid', reply.openid);
            res.redirect(redirectUrl.toString());
            wechatAuth.getUserInfo(reply.openid, reply.access_token, 'zh_CN', (err, user) => {
                // update user info
                const customer = {
                    name: user.nickname,
                    openId: user.openid,
                    sex: user.sex > 0 ? (user.sex === 1 ? '男' : '女') : '未知',
                    city: user.city,
                    province: user.province,
                    country: user.country,
                    avatarUrl: user.headimgurl,
                    brand: req.user.brand.name,
                    wechat: {appId: req.params.appId}
                };

                Customer.findOneAndUpdate(
                    {openId: user.openid},
                    customer,
                    {upsert: true}
                ).exec();
            });
        });
    });

    router.route('/wechat-oauth/url')

    .get((req, res) => {

        ['redirect_url', 'token', 'appid'].forEach(param => {
            if (!req.query[param]) {
                res.status(401).send(`缺少${param}`);
                throw `wechat-oauth/url missing ${param}`;
            }
        });

        const wechatAuth = WechatAuth();
        const redirectUrl = `${process.env.API_BASE}wechat-oauth?appid=${req.query.appid}&token=${req.query.token}`;
        const url = wechatAuth.getOAuthURL(req.query.appid, redirectUrl, req.query.redirect_url, 'snsapi_userinfo');
        res.redirect(url);
    });

    router.route('/wechat/:appId/jsapi-config')

    .get((req, res) => {
        WechatApi(req.params.appId).then(wechatApi => {
            wechatApi.getJsConfig({
                debug: req.query.debug,
                jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'chooseWXPay', 'hideMenuItems', 'showMenuItems'],
                url: req.headers.referer
            }, (err, result) => {
                res.json(result);
            });
        })
    });

    router.route('/wechat/:appId')

    .post((req, res) => {

        if (req.query.nonce) {

            let cryptor = new wechatCrypto(process.env.COMPONENT_TOKEN, process.env.COMPONENT_ENCODING_AES_KEY, process.env.COMPONENT_APP_ID);

            devSign = cryptor.getSignature(req.query.timestamp, req.query.nonce, req.body.xml.Encrypt[0]);

            if (devSign !== req.query.msg_signature) {
                res.status(403).json({message:'Invalid signature.'});
                return;
            }

            const xmlMessage = cryptor.decrypt(req.body.xml.Encrypt[0]).message;
            
            xmlParseString(xmlMessage, {async: false, trim: true, explicitArray: false}, (err, result) => {

                let message = camelcaseKeys(result.xml);

                message.appId = req.params.appId;

                const timestamp = (new Date().getTime() / 1000).toFixed();
                const nonce = parseInt((Math.random() * 100000000000), 10);

                if (message.toUserName === 'gh_3c884a361561') {
                    if (message.msgType === 'event') {
                        const encryptedText = cryptor.encrypt(`<xml>
                            <ToUserName><![CDATA[${message.fromUserName}]]></ToUserName>
                            <FromUserName><![CDATA[gh_3c884a361561]]></FromUserName>
                            <CreateTime>${timestamp}</CreateTime>
                            <MsgType><![CDATA[text]]></MsgType>
                            <Content><![CDATA[${message.event}from_callback]]></Content>
                        </xml>`);

                        const replyXml = `<xml>
                            <Encrypt><![CDATA[${encryptedText}]]></Encrypt>
                            <MsgSignature><![CDATA[${cryptor.getSignature(timestamp, nonce, encryptedText)}]]></MsgSignature>
                            <TimeStamp>${timestamp}</TimeStamp>
                            <Nonce>${nonce}</Nonce>
                        </xml>`;

                        res.send(replyXml).end();
                    }
                    if (message.msgType === 'text') {
                        
                        if (message.content === 'TESTCOMPONENT_MSG_TYPE_TEXT') {

                            const encryptedText = cryptor.encrypt(`<xml>
                                <ToUserName><![CDATA[${message.fromUserName}]]></ToUserName>
                                <FromUserName><![CDATA[gh_3c884a361561]]></FromUserName>
                                <CreateTime>${(new Date().getTime() / 1000).toFixed()}</CreateTime>
                                <MsgType><![CDATA[text]]></MsgType>
                                <Content><![CDATA[TESTCOMPONENT_MSG_TYPE_TEXT_callback]]></Content>
                            </xml>`);

                            const replyXml = `<xml>
                                <Encrypt><![CDATA[${encryptedText}]]></Encrypt>
                                <MsgSignature><![CDATA[${cryptor.getSignature(timestamp, nonce, encryptedText)}]]></MsgSignature>
                                <TimeStamp>${timestamp}</TimeStamp>
                                <Nonce>${nonce}</Nonce>
                            </xml>`;

                            res.send(replyXml).end();

                            return;
                        }

                        const match = message.content.match(/^QUERY_AUTH_CODE\:(.*?)$/);
                        
                        if (match) {
                            const wechatAuth = WechatAuth();
                            const queryAuthCode = match[1];
                            wechatAuth.getAuthToken(queryAuthCode, function(err, result) {
                                const authorizationInfo = result.authorization_info;
                                const appId = authorizationInfo.authorizer_appid;
                                const accessToken = authorizationInfo.authorizer_access_token;
                                const refreshToken = authorizationInfo.authorizer_refresh_token;
                                const encryptedText = cryptor.encrypt(`<xml>
                                    <ToUserName><![CDATA[${message.fromUserName}]]></ToUserName>
                                    <FromUserName><![CDATA[gh_3c884a361561]]></FromUserName>
                                    <CreateTime>${(new Date().getTime() / 1000).toFixed()}</CreateTime>
                                    <MsgType><![CDATA[text]]></MsgType>
                                    <Content><![CDATA[]]></Content>
                                </xml>`);

                                const replyXml = `<xml>
                                    <Encrypt><![CDATA[${encryptedText}]]></Encrypt>
                                    <MsgSignature><![CDATA[${cryptor.getSignature(timestamp, nonce, encryptedText)}]]></MsgSignature>
                                    <TimeStamp>${timestamp}</TimeStamp>
                                    <Nonce>${nonce}</Nonce>
                                </xml>`;

                                res.send(replyXml).end();

                                setTimeout(() => {
                                    WechatApi(appId, accessToken).then(wechatApi => {
                                        wechatApi.sendText(message.fromUserName, `${queryAuthCode}_from_api`);
                                    });
                                }, 1000);
                            });
                        }
                    }
                    return;
                }

                message.toOpenId = message.toUserName;
                message.fromOpenId = message.fromUserName;
                message.type = message.msgType;
                message.id = message.msgId;
                message.createdAt = new Date(message.createTime * 1000);

                if (message.picUrl) {
                    message.url = message.picUrl;
                }

                if (message.locationX && message.locationY) {
                    message.latitute = message.locationX;
                    message.longitude = message.locationY;
                }

                let wechatMessage = new WechatMessage(message);

                wechatMessage.save();

                console.log(`[${new Date()}] 收到微信消息`, wechatMessage);
            });

            res.send('success').end();
        }
        else {
            WechatApi(req.params.appId).then(wechatApi => {
                
                if (req.body.sync) {

                    let syncFinalPromises = [];

                    wechatApi.getFollowers((err, result) => {
                        let openIds = result.data.openid;
                        let getUsersPromises = [];

                        getUsersPromises.push(Wechat.findOne({appId: req.params.appId}));
                        getUsersPromises.push(new Promise((resolve, reject) => {
                            wechatApi.getTags((err, result) => {
                                let tagMap = {};
                                result.tags.filter(tag => !tag.name.match(/@Persona$/)).forEach(tag => {
                                    tagMap[tag.id] = tag.name;
                                });
                                resolve(tagMap);
                            });
                        }));

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
                            const wechat = result.shift();
                            const tagMap = result.shift();
                            const users = result.reduce((prev, current) => {
                                return prev.concat(current);
                            }, []);

                            users.forEach(user => {

                                const customer = {
                                    name: user.nickname,
                                    openId: user.openid,
                                    sex: user.sex > 0 ? (user.sex === 1 ? '男' : '女') : '未知',
                                    city: user.city,
                                    province: user.province,
                                    country: user.country,
                                    avatarUrl: user.headimgurl,
                                    tags: user.tagid_list.map(id => tagMap[id]),
                                    brand: req.user.brand.name,
                                    wechat: {appId: req.params.appId, _id: wechat._id, name: wechat.name, subscribed: user.subscribe === 1, subscribedAt: new Date(user.subscribe_time * 1000)}
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
                                    resolve(camelcaseKeys(result, {deep: true}));
                                });
                            }));
                        }

                        Promise.all(getMaterialsPromises).then(result => {
                            const newsMaterials = result.reduce((prev, current) => {
                                return prev.concat(current.item);
                            }, []);

                            const promise = Wechat.findOneAndUpdate({appId: req.params.appId}, {newsMaterials: newsMaterials}).exec();
                            syncFinalPromises.push(promise);
                        })
                        .catch(err => {
                            console.error(err);
                        });
                    });

                    Promise.all(syncFinalPromises).then(() => {
                        res.json({message: '同步已完成'});
                    });
                }

            }).catch(err => {
                console.error(err);
            });
        }
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

    router.route('/wechat/:appId/qrscene/:sceneId/kpi-by-date')

    .get(async (req, res) => {

        const wechat = await Wechat.findOne({appId: req.params.appId});
        const qrScene = wechat.qrScenes.filter(scene => scene.id === Number(req.params.sceneId))[0];

        const kpiByDate = await WechatMessage.aggregate([
            {
                $match: {appId: wechat.appId}
            },
            {
                $group: {
                    _id : {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}},
                    subscribe: {$sum: {$cond:[{$and:[{$eq:["$event",'subscribe']}, {$eq:["$eventKey",`qrscene_${qrScene.id}`]}]}, 1, 0]}},
                    scan: {$sum: {$cond:[{$and:[{$eq:["$event",'SCAN']}, {$eq:["$eventKey", req.params.sceneId]}]}, 1, 0]}}
                }
            },
            {
                $sort: {_id: 1}
            }
        ]);

        res.json(kpiByDate);

    });

    router.route('/wechat/:appId/user-group/:groupId')

    .post((req, res) => {

        let customersPromise = Customer.find({'group._id':req.params.groupId}).exec();
        let groupPromise = CustomerGroup.findById(req.params.groupId).exec();
        let wechatApiPromise = WechatApi(req.params.appId);

        Promise.all([groupPromise, customersPromise, wechatApiPromise]).then((result) => {
            const [group, customers, wechatApi] = result;
            const openIds = customers.map(customer => customer.get('openId'));

            if (!group) {
                throw `Group not found: ${req.params.groupId}`;
            }
            
            wechatApi.getTags(function (err, result) {
                const existingTag = result.tags.filter(tag => tag.name === group.name)[0];
                if (existingTag) {
                    wechatApi.deleteTag(existingTag.id, (err, result) => {
                        createTagAndInsertUsers(wechatApi, group, openIds);
                    });
                }
                else {
                    createTagAndInsertUsers(wechatApi, group, openIds);
                }
            });
        })
        .catch(err => {
            console.error(err);
        });

        function createTagAndInsertUsers (wechatApi, group, openIds) {
            wechatApi.createTag(group.name, (err, result) => {
                const tag = result.tag;
                group.wechat.tagId = tag.id;
                group.save();
                wechatApi.batchTagging(openIds, tag.id, (err, result) => {
                    res.json({message: '用户组同步完成'});
                });
            });
        }

    });

    router.route('/wechat/:appId/mass-send')

    .post((req, res) => {
        const tagId = req.body.tagId;
        const mediaId = req.body.mediaId;
        const text = req.body.text;

        WechatApi(req.params.appId).then(wechatApi => {
            if (text) {
                wechatApi.massSendTextByTag(text, tagId, (err, result) => {
                    res.json(result);
                });
            }
            else {
                wechatApi.massSendNewsByTag(mediaId, tagId, (err, result) => {
                    res.json(result);
                });
            }
        });
    });

    return router;
}
