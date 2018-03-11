const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    brand: String,
    openId: String,
    tempId: String,
    mobile: String,
    sex: String,
    age: Number,
    province: String,
    city: String,
    tags: [String],
    group: [{_id: Schema.Types.ObjectId, name: String}]
}, {
    strict: false
});

customerSchema.index({brand:1, mobile:1, openId:1, tempId:1}, {sparse:true});

module.exports = mongoose.model('Customer', customerSchema);
