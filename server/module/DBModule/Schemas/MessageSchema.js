// MessageSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Configs = require('../../../configs/Constants');

const MessageSchema = new Schema({
    sender: {
        type: Schema.Types.Mixed, // Thay đổi từ Schema.Types.ObjectId sang Mixed
        required: true
    },
    senderRole: { // Thêm trường này để dễ dàng phân biệt sender là user hay guest
        type: String,
        required: true
    },
    receiver: {
        type: Schema.Types.Mixed, // Thay đổi từ Schema.Types.ObjectId sang Mixed
        required: false
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    readBy: [{
        type: Schema.Types.ObjectId,
        ref: Configs.DB_SCHEMA.USER
    }],
    chatRoomId: {
        type: String,
        required: false
    }
});

module.exports = MessageSchema;