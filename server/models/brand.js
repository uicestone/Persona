const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: String,
    wechats: [{
        _id: Schema.ObjectId,
        name: String,
        logoUrl: String,
        isService: Boolean
    }]
});

brandSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Brand', brandSchema);
