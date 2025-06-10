const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Configs = require('../../../configs/Constants'); // Đảm bảo đường dẫn này chính xác

const PostSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề bài viết không được để trống'],
        trim: true
    },
    content: { // Sẽ lưu trữ chuỗi HTML từ React Quill
        type: String,
        required: [true, 'Nội dung bài viết không được để trống']
    },
    imageUrl: {
        type: String,
        trim: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: Configs.DB_SCHEMA.USER,
        required: true
    },
    type: {
        type: String,
        enum: {
            values: ['Course', 'Post'],
            message: 'Loại {VALUE} không được hỗ trợ'
        },
        required: [true, 'Loại bài viết không được để trống'],
        default: 'Post'
    },
    tags: [{
        type: String,
        trim: true
    }],
    liked: [{
        type: Schema.Types.ObjectId,
        ref: Configs.DB_SCHEMA.USER
    }],
    // createdAt và updatedAt sẽ được tự động quản lý bởi timestamps: true
}, { timestamps: true });

module.exports = PostSchema;