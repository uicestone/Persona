var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var channelSchema = new Schema({
    name: String,
    rank: Number,
    topic: String
});

channelSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Channel', channelSchema);
