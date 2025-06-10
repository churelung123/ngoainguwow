const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const Configs = require('../../../configs/Constants');

const ClassSchema = new Schema({
    classId: { type: String, required: true, unique: true, index: true },
    course_code: { type: ObjectId, ref: Configs.DB_SCHEMA.COURSE, required: true },
    className: { type: String, required: true },
    teacher_id: { type: ObjectId, ref: Configs.DB_SCHEMA.USER },
    assistantTeachers_ids: [{ type: ObjectId, ref: Configs.DB_SCHEMA.USER }],
    students_ids: [{ type: ObjectId, ref: Configs.DB_SCHEMA.STUDENT, default: [] }],
    classFee: {
        type: Number,
    },
    schedule: {
        totalSessions: {
            type: Number,
        }, // Tổng số buổi học (có thể thay đổi)
        daysOfWeek: [{
            type: String,
            // Ví dụ: ['Monday', 'Wednesday'] hoặc ['T2', 'T4']
            // Bạn có thể dùng enum để giới hạn các giá trị hợp lệ:
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }], // Học thứ mấy trong tuần
        startTime: {
            type: String,
            // required: true, // Ví dụ: "08:00" hoặc "14:30"
        }, // Thời gian bắt đầu buổi học
        sessionDuration: {
            type: Number,
            // required: true, // Thời gian học mỗi buổi (ví dụ: 90, tính bằng phút)
        }, // Thời gian học mỗi buổi (tính bằng phút)
        startDate: {
            type: Date,
            required: true
        }, // Ngày bắt đầu lớp
        endDate: {
            type: Date
        }, // Ngày kết thúc lớp học dự kiến
        room: {
            type: String
        }, // Phòng học
        sessionOverrides: [{ // Lưu các buổi bị điều chỉnh
            originalDate: { type: Date }, // Ngày dự kiến ban đầu (nếu là dời buổi)
            newDate: { type: Date },      // Ngày học mới (nếu dời hoặc thêm)
            type: { type: String, enum: ['cancelled', 'rescheduled', 'makeup_added', 'holiday'] }, // Loại thay đổi
            reason: { type: String } // Lý do thay đổi
        }]
    },
    tests: [{ type: ObjectId, ref: Configs.DB_SCHEMA.TESTLESSON }],
}, { timestamps: true });

module.exports = ClassSchema;