var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var projectSchema = new Schema({
    name: String,
    brand: {
    	_id: Schema.Types.ObjectId,
    	name: String
    },
    startDate: Date,
    endDate: Date,
    comment: String,
    url: String,
    platform: String,
    city: String,
    executive: {
    	_id: Schema.Types.ObjectId,
    	name: String
    },
    manager: {
    	_id: Schema.Types.ObjectId,
    	name: String
    },
    appid: String,
    kpis: [
    	{type: String, value: Number}
    ]
});

projectSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Project', projectSchema);
