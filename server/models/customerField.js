var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerFieldSchema = new Schema({
	key: String,
    label: String,
    reserved: Boolean
});

module.exports = mongoose.model('CustomerField', customerFieldSchema);
