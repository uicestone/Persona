var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerReachingSchema = new Schema({
	brand: String,
	type: String,
	content: String,
	group: {_id: Schema.Types.ObjectId, name: String},
	updatedAt: Date,
	sendAt: Date
});

customerReachingSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('customerReaching', customerReachingSchema);
