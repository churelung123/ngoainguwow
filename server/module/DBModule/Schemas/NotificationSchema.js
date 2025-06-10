const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Configs = require('../../../configs/Constants');
const ObjectId = Schema.ObjectId;

const NotificationSchema = new Schema({
    classId: {
        type: ObjectId,
        ref: Configs.DB_SCHEMA.CLASS,
        required: true
    },
    senderId: {
        type: ObjectId,
        ref: Configs.DB_SCHEMA.USER,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isReadBy: [{
        type: ObjectId,
        ref: Configs.DB_SCHEMA.USER,
        default: [] // Mặc định là không ai đọc
    }]
});

module.exports = NotificationSchema;