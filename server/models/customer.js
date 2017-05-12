const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
	nuid: Number,
    mobile: String,
    carrier: String,
    mobileAge: Number,
    sex: String,
    age: Number,
    province: String,
    studyCity: String,
    workingCity: String,
    marriage: String,
    sexualOrientation: String,
    creditCards: Number,
    hasChild: Boolean,
    annualSalary: String,
    lastConsumedAt: Date,
    tags: [String],
    group: [{_id: Schema.Types.ObjectId, name: String}],
    brand: String
}, {
    strict: false
});

customerSchema.index({brand:1, mobile:1}, {sparse:true});

module.exports = mongoose.model('Customer', customerSchema);
