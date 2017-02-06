var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var projectSchema = new Schema({
    name: String,
    brand: {
    	_id: Schema.Types.ObjectId,
    	name: String
    }
});

projectSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Project', projectSchema);
