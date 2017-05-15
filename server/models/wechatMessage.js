const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wechatMessageSchema = new Schema({
    appId: String,
    toOpenId: String,
    fromOpenId: String,
    type: String,
    content: String,
    id: String,
    mediaId: String, // 语音，图片，视频消息
    format: String, // 语音消息
    recognition: String, // 语音消息
    url: String, // 图片消息
    latitute: Number,
    longitude: Number,
    scale: Number,
    label: String,
    thumbMediaId: String,
    createdAt: Date
});

wechatMessageSchema.index({appId:1});

module.exports = mongoose.model('WechatMessage', wechatMessageSchema);
