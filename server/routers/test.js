const testRoute = require('express').Router();
const {
    createTest,
    getTestDetail,
    updateTest,
    deleteTest,
    getAllClassTests,
    publishTest,
    getTestForStudent,
    submitTest,
    getAllTestResults,
    getStudentTestResult,
    updateFormElement,
    getAttempt,
} = require('../middleware/test-middleware/test')
const { validateToken, authorize } = require('../middleware/auth-middleware/auth')
const Config = require('../configs/Constants');


// Quản lý bài kiểm tra (Teacher/Admin)
testRoute.post(Config.API_PATH.CREATE_TEST, validateToken, authorize(['teacher', 'admin']), createTest);
testRoute.get(Config.API_PATH.GET_TEST_DETAIL, validateToken, authorize(['teacher', 'admin']), getTestDetail);
testRoute.put(Config.API_PATH.UPDATE_TEST, validateToken, authorize(['teacher', 'admin']), updateTest);
testRoute.delete(Config.API_PATH.DELETE_TEST, validateToken, authorize(['teacher', 'admin']), deleteTest);
testRoute.get(Config.API_PATH.GET_CLASS_TESTS, validateToken, getAllClassTests);
testRoute.put(Config.API_PATH.PUBLIC_TEST, validateToken, authorize(['teacher', 'admin']), publishTest);
testRoute.put(Config.API_PATH.UPDATE_TEST_FORMELEMENT, validateToken, authorize(['teacher', 'admin']), updateFormElement);
testRoute.get(Config.API_PATH.GET_ATEMPT_STUDENT, validateToken, getAttempt);

// Quản lý câu hỏi (ĐÃ LOẠI BỎ)
// testRoute.post(Config.API_PATH.CREATE_QUESTION, validateToken, authorize(['teacher', 'admin']), createQuestion);
// testRoute.get(Config.API_PATH.GET_QUESTION, validateToken, authorize(['teacher', 'admin']), getQuestion);
// testRoute.put(Config.API_PATH.UPDATE_QUESTION, validateToken, authorize(['teacher', 'admin']), updateQuestion);
// testRoute.delete(Config.API_PATH.DELETE_QUESTION, deleteQuestion);
// testRoute.get(Config.API_PATH.GET_TEST_QUESTIONS, validateToken, authorize(['teacher', 'admin']), getAllTestQuestions);


// Làm bài kiểm tra (Student)
testRoute.get(Config.API_PATH.GET_TEST_BY_STUDENT, validateToken, authorize(['Student']), getTestForStudent);
testRoute.post(Config.API_PATH.SUBMIT_TEST_BT_STUDENT, validateToken, authorize(['Student']), submitTest);


// Lấy kết quả (Teacher/Student)
testRoute.get(Config.API_PATH.GET_STUDENTS_TEST_RESULT, validateToken, authorize(['teacher', 'admin']), getAllTestResults);
testRoute.get(Config.API_PATH.GET_STUDENT_TEST_RESULT, validateToken, authorize(['teacher', 'admin', 'Student']), getStudentTestResult);


module.exports = testRoute;