const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wechatSchema = new Schema({
    appId: String,
    name: String,
    alias: String,
    originalId: String,
    logoUrl: String,
    isService: Boolean,
    isVerified: Boolean,
    qrcodeUrl: String,
    entityName: String,
    signature: String,
    refreshToken: String,
    lastQrSceneId: {temp: Number, limit: Number},
    newsMaterials: []
});

wechatSchema.index({appId:1}, {unique:true});

module.exports = mongoose.model('Wechat', wechatSchema);
