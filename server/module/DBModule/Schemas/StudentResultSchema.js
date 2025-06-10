const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Configs = require('../../../configs/Constants');
const ObjectId = Schema.ObjectId;

const StudentResultSchema = new Schema({
    testId: {
        type: ObjectId,
        ref: Configs.DB_SCHEMA.TESTLESSON,
        required: true
    }, // Bài kiểm tra
    studentId: {
        type: ObjectId,
        ref: Configs.DB_SCHEMA.USER,
        required: true
    }, // Học sinh

    submittedAt: {
        type: Date,
        default: Date.now
    }, // Thời gian nộp bài

    totalScore: { type: Number }, // Tổng điểm học sinh đạt được

    answers: [
        {
            formElementId: {
                type: ObjectId,
                required: true
            },
            selectedOptionIds: [{ type: ObjectId }],           // ID các option mà học sinh đã chọn (multiple/checkbox)
            answerText: { type: String },
            isCorrect: { type: Boolean },
            score: { type: Number },
        }
    ]
});

module.exports = StudentResultSchema;
