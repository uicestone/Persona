const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
    spid: String,
    uuid: String,
    name: String,
    platform: String,
    wechatId: String,
    mcnId: String,
    topic: String,
    tags: [String],
    fans: Number,
    rank: Number,
    distributionAbility: Number,
    score: Number,
    wasIn500: Boolean,
    updatedAt: Date,
    remark: String
});

channelSchema.index({spid:1}, {unique:true, sparse:true});

module.exports = mongoose.model('Channel', channelSchema);
