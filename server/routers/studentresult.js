const studentResultRouter = require("express").Router();
const Configs = require("./../configs/Constants");
const { validateToken, authorize } = require('../middleware/auth-middleware/auth')
const { createNewResult, getAllResults, getResult, deleteResult, getStudentResultsInClass, updateShortAnswerScore } = require("../middleware/test-middleware/studentresult");

studentResultRouter.post(Configs.API_PATH.SUBMIT_TEST_BT_STUDENT, validateToken, authorize(['Student']), createNewResult);
studentResultRouter.post(Configs.API_PATH.GET_STUDENT_TEST_RESULT, validateToken, authorize(['Student']), getResult);
studentResultRouter.post(Configs.API_PATH.DELETE_STUDENT_TEST_RESULT, validateToken, deleteResult);
studentResultRouter.get(Configs.API_PATH.GET_STUDENT_RESULT_IN_CLASS, validateToken, getStudentResultsInClass);

studentResultRouter.get(Configs.API_PATH.GET_RESULTS_TEST, validateToken, authorize(['admin, teacher']), getAllResults);
studentResultRouter.put(Configs.API_PATH.UPDATE_ANSWER_SCORE, validateToken, updateShortAnswerScore);
module.exports = studentResultRouter;