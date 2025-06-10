const adminRouter = require("express").Router();
const Configs = require("./../configs/Constants");
const { validateToken } = require("../middleware/auth-middleware/auth");
const { register, editUser, deleteUser } = require("../middleware/auth-middleware/register");
const { validateAdmin, fGetAllUserInfo, fGetAllStudents } = require("../middleware/admin-middleware/admin");
const { fCreateClass, fGetClassesByAdmin, fEditClass, fAddMemberToClass } = require("../middleware/class-middleware/class");
const { fCreateCourse, fDeleteCourse, fGetCourses, fEditCourse } = require("../middleware/course-middleware/course");

adminRouter.get(Configs.API_PATH.ADMIN_GET_ALL_USERS, validateToken, validateAdmin, fGetAllUserInfo);
adminRouter.post(Configs.API_PATH.CREATE_USER_BY_ADMIN, validateToken, validateAdmin, register);
adminRouter.delete(Configs.API_PATH.DELETE_USER_BY_ADMIN, validateToken, validateAdmin, deleteUser);
adminRouter.put(Configs.API_PATH.EDIT_USER_BY_ADMIN, validateToken, validateAdmin, editUser);

adminRouter.post(Configs.API_PATH.ADD_STUDENT_TO_CLASS, validateToken, validateAdmin, fAddMemberToClass);
adminRouter.get(Configs.API_PATH.GET_ALL_STUDENTS, validateToken, validateAdmin, fGetAllStudents);

adminRouter.post(Configs.API_PATH.ADMIN_ADD_CLASS, validateToken, validateAdmin, fCreateClass);
adminRouter.get(Configs.API_PATH.GET_CLASSES_BY_ADMIN, validateToken, validateAdmin, fGetClassesByAdmin);
adminRouter.post(Configs.API_PATH.CREATE_CLASS_BY_ADMIN, validateToken, validateAdmin, fCreateClass);
// adminRouter.get(Configs.API_PATH.GET_CLASSES_BY_ADMIN, validateToken, validateAdmin, fGetCourses);
adminRouter.put(Configs.API_PATH.EDIT_CLASS_BY_ADMIN, validateToken, validateAdmin, fEditClass);
// adminRouter.delete(Configs.API_PATH.DELETE_CLASS_BY_ADMIN, validateToken, validateAdmin, fDeleteCourse);

adminRouter.post(Configs.API_PATH.ADMIN_ADD_COURSE, validateToken, validateAdmin, fCreateCourse);
adminRouter.post(Configs.API_PATH.CREATE_COURSE_BY_ADMIN, validateToken, validateAdmin, fCreateCourse);
adminRouter.get(Configs.API_PATH.GET_COURSES_BY_ADMIN, validateToken, validateAdmin, fGetCourses);
adminRouter.put(Configs.API_PATH.EDIT_COURSE_BY_ADMIN, validateToken, validateAdmin, fEditCourse);
adminRouter.delete(Configs.API_PATH.DELETE_COURSE_BY_ADMIN, validateToken, validateAdmin, fDeleteCourse);

module.exports = adminRouter;