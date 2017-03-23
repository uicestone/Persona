const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
    name: String,
    rank: Number,
    topic: String
});

channelSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Channel', channelSchema);
