const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerFieldSchema = new Schema({
	key: String,
    label: String,
    reserved: Boolean,
    brand: String
});

module.exports = mongoose.model('CustomerField', customerFieldSchema);
