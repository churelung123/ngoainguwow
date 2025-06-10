const mongoose = require('mongoose');
 const Schema = mongoose.Schema;
 const Configs = require('../../../configs/Constants');
 const ObjectId = Schema.ObjectId;
 
 const QuestionSchema = new Schema({
  testId: {
   type: ObjectId,
   ref: Configs.DB_SCHEMA.TESTLESSON,
   required: true,
  },
  section: {
   type: String,
   enum: ['Reading', 'Writing', 'Listening', 'Speaking', 'Grammar', 'Vocabulary'],
   required: true,
  },
  type: {
   type: String,
   enum: ['Trắc nghiệm', 'Tự luận', 'Điền khuyết', 'Ghép nối', 'Khác'],
   required: true,
  },
  content: {
   type: String,
   required: true,
  },
  image: {
   type: String,
  },
  audio: {
   type: String,
  },
  video: {
   type: String,
  },
  options: [{
   text: {
    type: String,
    required: true,
   },
   isCorrect: {
    type: Boolean,
    default: false,
   },
   image: {
    type: String,
   },
  }],
  correctAnswer: {
   type: [String],
  },
  correctOrder: {
   type: [String],
  },
  matrix: {
   type: [[String]],
  },
  partialScores: [{
   option: {
    type: String,
   },
   score: {
    type: Number,
   },
  }],
  negativeMarking: {
   type: Number,
   default: 0,
  },
  maxScore: {
   type: Number,
   required: true,
   default: 1,
  },
  group: {
   type: String,
  },
  createdAt: {
   type: Date,
   default: Date.now,
  },
  updatedAt: {
   type: Date,
   default: Date.now,
  },
 });
 
 module.exports = QuestionSchema;