const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
// Đảm bảo đường dẫn này chính xác đến tệp Constants của bạn
const Configs = require('../../../configs/Constants'); // HOẶC Ví dụ: '../../configs/Constants'

const StudentAttendanceStatusSchema = new Schema({
    student_id: {
        type: ObjectId,
        ref: Configs.DB_SCHEMA.USER, // Tham chiếu đến User schema
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused_absence'],
        required: true,
        default: 'absent' // Mặc định là vắng mặt
    },
    note: { type: String, default: '' } // Ghi chú thêm (ví dụ: lý do vắng,...)
}, { _id: false }); // Không cần _id riêng cho sub-document này

const AttendanceSchema = new Schema({
    class_id: {
        type: ObjectId,
        ref: Configs.DB_SCHEMA.CLASS, // Tham chiếu đến Class schema
        required: true,
        index: true // Đánh index để truy vấn nhanh hơn theo class_id
    },
    sessionDate: {
        type: Date, // Lưu trữ dưới dạng Date object của MongoDB
        required: true,
        index: true // Đánh index để truy vấn nhanh hơn theo ngày
    },
    // classSessionNumber: { type: Number }, // Buổi học thứ mấy (tùy chọn, có thể tính từ startDate và lịch)
    attendanceList: [StudentAttendanceStatusSchema], // Mảng các bản ghi điểm danh của sinh viên cho buổi này
    recordedBy: {
        type: ObjectId,
        ref: Configs.DB_SCHEMA.USER // ID của giáo viên/admin đã thực hiện điểm danh
    },
    lastModifiedBy: { // Người chỉnh sửa cuối cùng, nếu có
        type: ObjectId,
        ref: Configs.DB_SCHEMA.USER
    }
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

// Đảm bảo rằng mỗi buổi học (sessionDate) của một lớp (class_id) là duy nhất
AttendanceSchema.index({ class_id: 1, sessionDate: 1 }, { unique: true });

module.exports = AttendanceSchema;