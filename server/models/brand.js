var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var brandSchema = new Schema({
    name: String
});

brandSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Brand', brandSchema);
