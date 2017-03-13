var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: String,
    roles: [String],
    username: String,
    password: String,
    email: String,
    token: String
});

userSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('User', userSchema);
