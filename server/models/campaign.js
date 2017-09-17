const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campaignSchema = new Schema({
    project: Schema.Types.ObjectId,
    fromChannel: {_id: Schema.Types.ObjectId, name: String},
    time: Date,
    device: String,
    ip: String,
    mobile: String,
    email: String,
    sex: String,
    province: String,
    city: String,
    stayingTime: Number,
    shared: String,
    price: Number
}, {
    strict: false
});

campaignSchema.index({project:1, fromChannel:1, time:-1});

module.exports = mongoose.model('Campaign', campaignSchema);
