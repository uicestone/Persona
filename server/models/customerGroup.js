const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerGroupSchema = new Schema({
    brand: String,
	name: String,
    fields: [{label: String, key: String}],
    query: Object,
    wechatTagId: Number
});

customerGroupSchema.index({brand:1, name:1}, {unique:true});

module.exports = mongoose.model('CustomerGroup', customerGroupSchema);
