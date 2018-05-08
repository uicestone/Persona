const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Customer = require('./customer.js');
const Project = require('./project.js');
const CustomerField = require('./customerField.js');

const campaignSchema = new Schema({
    project: Schema.Types.ObjectId,
    fromChannel: {_id: Schema.Types.ObjectId, name: String},
    ua: String,
    ip: String,
    referer: String,
    time: Date,
    device: String,
    ip: String,
    mobile: String,
    email: String,
    sex: String,
    province: String,
    city: String,
    stayingTime: Number,
    shared: String,
    price: Number
}, {
    strict: false
});

campaignSchema.index({project:1, fromChannel:1, time:-1});

campaignSchema.methods.syncToUser = async function () {
    const project = await Project.findById(this.project);

    if (!project || !project.brand) {
        throw `No project or brand specified in campaign record ${this._id}.`;
    }

    const criteria = {$and:[{brand:project.brand.name}, {$or: []}]};
    
    if (this.mobile) {
        criteria.$and[1].$or.push({mobile:this.mobile});
    }
    if (this.openId) {
        criteria.$and[1].$or.push({openId:this.openId});
    }
    if (this.tempId) {
        criteria.$and[1].$or.push({tempId:this.tempId});
    }

    if (criteria.$and[1].$or.length === 0) {
        throw `Cannot identify customer from campaign record ${this._id}.`;
    }

    let customer = await Customer.findOne(criteria);

    if (!customer) {
        // create a customer based on this campaign record
        customer = new Customer({brand:project.brand.name});
        
        if (this.mobile) {
            customer.mobile = this.mobile;
        }
        if (this.openId) {
            customer.openId = this.openId;
        }
        if (this.tempId) {
            customer.tempId = this.tempId;
        }
    }

    // merge this campaign record into customer

    const customerCharFields = await CustomerField.find({type:'char'});

    customerCharFields.forEach(customerField => {
        const key = customerField.key;
        if (this[key]) {
            customer[key] = this[key];
        }
    });

    const customerActFields = await CustomerField.find({type:'act'});

    customerActFields.forEach(customerField => {
        const key = customerField.key;
        
        if (this[key]) {
            if (!customer[key]) {
                customer[key] = [];
            }
            customer[key].push(this[key]);
            
            if (['ordered', 'paid'].indexOf(key) > -1 && this.products) {
                const productsKey = key + 'Products';
                if (!customer[productsKey]) {
                    customer[productsKey] = [];
                }
                customer[productsKey].concat(this[productsKey]);
            }

            if (['ordered', 'paid'].indexOf(key) > -1 && this.total) {
                const totalKey = key + 'Total';
                const avgKey = key + 'Average';

                if (!customer[totalKey]) {
                    customer[totalKey] = 0;
                }
                customer[totalKey] += this.total;
                customer[avgKey] = customer[totalKey] / customer[key].length;
            }

            // TODO push this channel to custom relatedChannels
        }
    });

    customer.save();

};

module.exports = mongoose.model('Campaign', campaignSchema);
