const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerReachingSchema = new Schema({
	brand: String,
	type: String,
	content: String,
	group: {_id: Schema.Types.ObjectId, name: String},
	updatedAt: Date,
	sendAt: Date,
	succeeded: Number,
	failed: Number
});

module.exports = mongoose.model('customerReaching', customerReachingSchema);
