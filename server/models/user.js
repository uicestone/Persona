const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    company: String,
    brand: {name: String, _id: Schema.Types.ObjectId},
    roles: [String],
    username: String,
    email: String,
    password: {type: String, select: false},
    token: {type: String, select: false}
});

userSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('User', userSchema);
