const express = require('express');
const Config = require("../configs/Constants");
const questionRoute = express.Router();
const { getQuestionsByTestId, createQuestion, getQuestionById, updateQuestion, deleteQuestion } = require('../middleware/question-middleware/question')
const { validateToken, authorize } = require('../middleware/auth-middleware/auth')


// Lấy danh sách câu hỏi của một bài kiểm tra
// questionRoute.get(Config.API_PATH.GET_TEST_QUESTIONS, validateToken, /* authorize(['teacher', 'admin']), */ getQuestionsByTestId);


// // Tạo mới một câu hỏi
// questionRoute.post(Config.API_PATH.CREATE_QUESTION, validateToken, authorize(['teacher', 'admin']), createQuestion);

// // Lấy thông tin chi tiết của một câu hỏi
// questionRoute.get(Config.API_PATH.GET_QUESTION, validateToken, /* authorize(['teacher', 'admin', 'Student']), */ getQuestionById);


// // Cập nhật thông tin của một câu hỏi
// questionRoute.put(Config.API_PATH.UPDATE_QUESTION, validateToken, authorize(['teacher', 'admin']), updateQuestion);


// // Xóa một câu hỏi
// questionRoute.delete(Config.API_PATH.DELETE_QUESTION, validateToken, authorize(['teacher', 'admin']), deleteQuestion);


module.exports = questionRoute;