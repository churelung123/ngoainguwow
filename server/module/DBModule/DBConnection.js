const mongoose = require('mongoose');
const Configs = require('../../configs/Constants');
const LoginInfoSchema = require('./Schemas/LoginInfoSchema');
const {UserSchema, TeacherSchema, StudentSchema, AdminSchema} = require('./Schemas/UserSchema');
const ClassSchema = require('./Schemas/ClassSchema');
const CourseSchema = require('./Schemas/CourseSchema');
const TestLessonSchema  = require('./Schemas/TestLessonSchema');
const QuestionSchema = require('./Schemas/QuestionSchema');
const StudentResultSchema = require('./Schemas/StudentResultSchema');
const NotificationSchema = require('./Schemas/NotificationSchema');
const PostSchema = require('./Schemas/PostSchema');
const AttendanceSchema = require('./Schemas/AttendanceSchema');
const MessageSchema = require('./Schemas/MessageSchema');

let DBConnection = {
    initiated : false,
    Init : (async () => {
        if (this.initiated) return;
        const db = await mongoose.connect(`mongodb+srv://matmalataikhoan:aU$nZ69Hgv@clustertest.m2fkz.mongodb.net/`);
        this.LoginInfo = db.model(Configs.DB_SCHEMA.LOGIN_INFO, LoginInfoSchema);
        
        this.User = db.model(Configs.DB_SCHEMA.USER, UserSchema);
        this.Teacher = this.User.discriminator(Configs.DB_SCHEMA.TEACHER, TeacherSchema);
        this.Student = this.User.discriminator(Configs.DB_SCHEMA.STUDENT, StudentSchema);
        this.Admin = this.User.discriminator(Configs.DB_SCHEMA.ADMIN, AdminSchema);

        this.Class = db.model(Configs.DB_SCHEMA.CLASS, ClassSchema);
        this.Course = db.model(Configs.DB_SCHEMA.COURSE, CourseSchema);

        this.TestLesson = db.model(Configs.DB_SCHEMA.TESTLESSON, TestLessonSchema);
        this.Question = db.model(Configs.DB_SCHEMA.QUESTION, QuestionSchema);
        this.StudentResult = db.model(Configs.DB_SCHEMA.STUDENTRESULT, StudentResultSchema);

        this.Notification = db.model(Configs.DB_SCHEMA.NOTIFICATION, NotificationSchema);
        this.Attendance = db.model(Configs.DB_SCHEMA.ATTENDANCE, AttendanceSchema);

        this.Post = db.model(Configs.DB_SCHEMA.POST, PostSchema);
        this.Message = db.model(Configs.DB_SCHEMA.MESSAGE, MessageSchema);

        global.DBConnection = this;
        this.initiated = true;

    }).bind(this),
    LoginInfo: undefined,

    User: undefined,
    Teacher: undefined,
    Student: undefined,
    Admin: undefined,

    Test: undefined,
    Class : undefined,
    Course: undefined,

    TestLesson: undefined,
    Question: undefined,
    StudentResult: undefined,

    Notification: undefined,
    Attendance: undefined,

    Post: undefined,
    Message: undefined,
}

module.exports = DBConnection;