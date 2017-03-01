var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerSchema = new Schema({
	nuid: Number,
    mobile: String,
    carrier: String,
    mobileAge: Number,
    sex: String,
    age: Number,
    studyCity: String,
    livingCity: String,
    workingCity: String,
    marriage: String,
    sexualOrientation: String,
    creditCards: Number,
    hasChild: Boolean,
    consuming: String,
    createdAt: Date,
    tags: [String]
});

customerSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Customer', customerSchema);
