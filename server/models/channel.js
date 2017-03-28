const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
    spid: String,
    uuid: String,
    name: String,
    platform: String,
    wechatId: String,
    topic: String,
    fans: Number,
    rank: Number,
    score: Number,
    wasIn500: Boolean,
    updatedAt: Date
});

channelSchema.index({spid:1}, {unique:true});

module.exports = mongoose.model('Channel', channelSchema);
