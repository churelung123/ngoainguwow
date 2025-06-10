const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
    course_name: {
        type: String,
        unique: true,
        required: true
    },
    course_code: {
        type : String,
        unique: true,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    course_fee: {
        type: Number,
        required: true
    },
    duration: {
        type: String, // Hoặc Number nếu bạn muốn lưu dưới dạng số (ví dụ: số giờ, số tuần)
        required: true // Đặt là false nếu không bắt buộc
    }
})

module.exports = CourseSchema