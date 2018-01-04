const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
    spid: String,
    name: String,
    platform: String,
    mcnId: String,
    topic: String,
    region: String,
    tags: [String],
    fans: Number,
    rank: Number,
    distributionAbility: Number,
    updatedAt: Date,
    remark: String,
    identified: Boolean,
    logoUrl: String
});

channelSchema.index({spid:1}, {unique:true, sparse:true});

module.exports = mongoose.model('Channel', channelSchema);
