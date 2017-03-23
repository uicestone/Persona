const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerGroupSchema = new Schema({
	name: String,
    fields: [{label: String, key: String}],
    query: Object
});

customerGroupSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('CustomerGroup', customerGroupSchema);
