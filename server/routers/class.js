const classRouter = require("express").Router();
const Configs = require("./../configs/Constants");
const { validateToken, validateLoginArgument, login, } = require("../middleware/auth-middleware/auth");
const {   fCreateClass,
  findClassByClassId,
  fFindClassByClassId,
  validateClassTeacher,
  validateClassMember,
  fGetMemberBasicInfors,
  fAddMembersToClass,
  fDeleteMemberInClass,
  handleUploadMembers,
  fGetClassesByTeacher,
  fGetClassDetails,
  fGetStudentClasses,
  addSessionOverride,
  deleteSessionOverride,
  updateSessionOverride} = require("../middleware/class-middleware/class");
const { handleUploadFile } = require("../middleware/upload-middleware/upload");
const { validate } = require("uuid");

// classRouter.get('/auth/test', validateToken);
// authRouter.post('/auth/reg', register);
classRouter.post(Configs.API_PATH.CREATE_CLASS, validateToken, fCreateClass);
classRouter.post(Configs.API_PATH.ADD_MEMBER_CLASS, validateToken,findClassByClassId, validateClassTeacher, fAddMembersToClass);
classRouter.post(Configs.API_PATH.UPLOAD_DSSV_CLASS, validateToken, findClassByClassId, validateClassTeacher, handleUploadFile, handleUploadMembers, fAddMembersToClass);
classRouter.delete(Configs.API_PATH.DELETE_MEMBER_CLASS, validateToken, findClassByClassId, validateClassTeacher, fDeleteMemberInClass);
// classRouter.get(Configs.API_PATH.MY_CLASS, validateToken, fGetCurClasses)
classRouter.get(Configs.API_PATH.MY_CLASS_MEMBERS_INFORS, validateToken, findClassByClassId, validateClassMember, fGetMemberBasicInfors)
classRouter.get(Configs.API_PATH.GET_CLASS_BY_ID, validateToken, findClassByClassId, fFindClassByClassId);

classRouter.get(Configs.API_PATH.GET_CLASS_BY_TEACHER_ID, validateToken, fGetClassesByTeacher);
classRouter.get(Configs.API_PATH.GET_CLASS_DETAIL, validateToken, fGetClassDetails);
classRouter.get(Configs.API_PATH.GET_CLASS_BY_STUDENT_ID, validateToken, fGetStudentClasses);

classRouter.post(Configs.API_PATH.CREATE_SESSION, validateToken, addSessionOverride);
classRouter.delete(Configs.API_PATH.DELETE_SESSION, validateToken, deleteSessionOverride);
classRouter.put(Configs.API_PATH.UPDATE_SESSION, validateToken, updateSessionOverride)

module.exports = classRouter