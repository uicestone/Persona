var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerFieldSchema = new Schema({
	key: String,
    label: String,
    reserved: Boolean,
    brand: String
});

module.exports = mongoose.model('CustomerField', customerFieldSchema);
