var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var campaignSchema = new Schema({
    accessedAt: Date,
    device: String,
    mobile: String,
    email: String,
    sex: String,
    province: String,
    city: String,
    converted: Boolean,
    stayedFor: Number,
    shared: Boolean,
    fromChannel: Number,
    project: Schema.Types.ObjectId
});

campaignSchema.index({fromChannel:1});

module.exports = mongoose.model('Campaign', campaignSchema);
