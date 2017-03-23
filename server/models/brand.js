const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: String
});

brandSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Brand', brandSchema);
