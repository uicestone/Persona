var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerSchema = new Schema({
    mobile: String
});

customerSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Customer', customerSchema);
