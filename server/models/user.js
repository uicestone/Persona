var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: String,
    company: String,
    brand: {name: String, _id: Schema.Types.ObjectId},
    roles: [String],
    username: String,
    password: String,
    email: String,
    token: String
});

userSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('User', userSchema);
