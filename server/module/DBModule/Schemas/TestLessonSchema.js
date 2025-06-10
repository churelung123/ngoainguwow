const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Configs = require('../../../configs/Constants');
const ObjectId = Schema.ObjectId;

const TestLessonSchema = new Schema({
    title: { type: String },

    description: { type: String },

    createdBy: { type: ObjectId, ref: Configs.DB_SCHEMA.USER },

    type: {
        type: String,
        enum: ['Giữa kỳ', 'Cuối kỳ', 'Thường xuyên', 'Khác'], // Các loại bài kiểm tra
        required: true
    },
    testDate: {
        type: Date,
        default: null
    },
    duration: {
        type: Number, // Thời gian làm bài tính bằng phút
        required: true
    },
    isPublish: {
        type: Boolean,
        defaul: false
    },

    maxAttempts: {
        type: Number,
        default: 1,
        min: 1
    },

    formElements: [
        {
            type: {
                type: String,
                enum: [
                    'section_title',
                    'description',
                    'multiple_choice',
                    'checkbox',
                    'short_answer',
                    'paragraph'
                ],
                required: true
            },
            order: { type: Number },
            title: { type: String },            // dùng cho section_title
            description: { type: String },      // dùng cho description hoặc section_title
            questionText: { type: String },   // dùng cho câu hỏi
            options: [{
                _id: {
                    type: ObjectId,
                    auto: true,
                },
                text: {
                    type: String,
                },
                imageUrl: String,
                isCorrect: {
                    type: Boolean,
                    default: false,
                },
            }],      // multiple_choice, checkbox
            required: { type: Boolean },
            score: { type: Number },
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = TestLessonSchema;