var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerGroupSchema = new Schema({
	name: String,
    fields: [{label: String, key: String}],
    query: Object
});

customerGroupSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('CustomerGroup', customerGroupSchema);
