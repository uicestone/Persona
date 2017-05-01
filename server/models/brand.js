const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: String,
    wechat: [{
        appId: String,
        name: String,
        alias: String,
        originalId: String,
        logoUrl: String,
        isService: Boolean,
        isVerified: Boolean,
        qrcodeUrl: String,
        entityName: String,
        signature: String
    }]
});

brandSchema.index({name:1}, {unique:true});

module.exports = mongoose.model('Brand', brandSchema);
