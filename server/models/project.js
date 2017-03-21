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
    	new Schema({
            type: String,
            value: Number,
            timings: [{
                startDate: Date,
                endDate: Date,
                name: String,
                percentage: Number
            }]})
    ],
    channels: [
        new Schema({
            _id: Schema.Types.ObjectId,
            name: String,
            startDate: Date,
            endDate: Date
        })
    ],
    createdAt: Date
});

projectSchema.index({name:1}, {unique:true});

projectSchema.virtual('status')
.get(function() {
    var now = new Date();
    if (this.startDate > now) {
        return '未开始';
    }
    else if (this.endDate < now) {
        return '已结束';
    }
    else if(this.startDate < now && this.endDate > now) {
        return '进行中';
    }
    else {
        return null;
    }
});

projectSchema.set('toJSON', { getters: true, virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
