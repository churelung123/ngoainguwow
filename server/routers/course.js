const courseRouter = require("express").Router();
const Configs = require("./../configs/Constants");
const { validateToken, validateLoginArgument, login } = require("../middleware/auth-middleware/auth");
const { fCreateCourse, fDeleteCourse, fGetCourses, fEditCourse } = require("../middleware/course-middleware/course");

courseRouter.post(Configs.API_PATH.CREATE_COURSE, fCreateCourse);
module.exports = courseRouter;