const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wechatMessageSchema = new Schema({
    appId: String,
    toOpenId: String,
    fromOpenId: String,
    type: String,
    event: String,
    eventKey: String, // 扫码事件，菜单点击事件
    ticket: String, // 扫码事件
    content: String,
    id: String,
    mediaId: String, // 语音，图片，视频消息
    format: String, // 语音消息
    recognition: String, // 语音消息
    url: String, // 图片消息
    latitute: Number,
    longitude: Number,
    scale: Number, // 位置消息的缩放
    label: String, // 位置消息的地理标签
    precision: Number, // 上报地理位置事件的精度
    thumbMediaId: String,
    createdAt: Date
});

wechatMessageSchema.index({appId:1, event:1, eventKey:1});

module.exports = mongoose.model('WechatMessage', wechatMessageSchema);
