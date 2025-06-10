const API_PATH = {
    REG_ACC: "/reg",
    LOGIN: "/auth/login",
    PROFILE_BY_ID: "/api/profile/:profileId",
    SET_PROFILE_BY_ID: "/api/profile/edit/:profileId",
    CREATE_CLASS: "/api/classes/create",
    ADD_MEMBER_CLASS: "/api/classes/:classId/members/add",
    DELETE_MEMBER_CLASS: "/api/classes/:classId/members/delete",
    MY_CLASS_MEMBERS_INFORS: "/api/classes/:classId/members/infors",
    GET_SCORES_CLASS: "/api/classes/:classId/members/scores",
    GET_CLASS_BY_ID: "/api/classes/:classId",
    GET_ALL_POSTS: "/api/classes/:classId/feed/posts/get",
    COMMENT_TO_POST: "/api/classes/:classId/feed/:postId/comments/add",
    LIKE_POST: "/api/classes/:classId/feed/:postId/likes/toogle",
    GET_COMMENT_POST: "/api/classes/:classId/feed/:postId/comments/get",
    RECENT_CHAT: "/api/chat/recent",
    RECENT_CONTACT: "/api/chat/recentcontact",
    MESSAGES_BY_VNU_ID: "/api/chat/:otherVNUId",
    ADD_SUBJECT: "/api/subjects/add",
    UPLOAD_DSSV: "/api/upload/dssv",
    UPLOAD_DSSV_CLASS: "/api/classes/:classId/members/import",
    UPLOAD_DSCV: "/api/upload/dscv",
    UPLOAD_DSMH: "/api/upload/dsmh",
    UPLOAD_SV_MH_SCORE: "/api/scores/import",
    UPLOAD_SV_STATUS: "/api/status/import",
    UPLOAD_FILE: "/api/upload/file",
    ADD_SCORE_BY_VNU_ID: "/api/scores/add",
    GET_SCORES_BY_ID: "/api/scores/:userId",
    DOWNLOAD_SCORES_CLASS: "/api/scores/download/:classId/:semesterId",
    GET_SEMESTER_BY_ID: "/api/semesters/:semesterId",
    GET_ALL_SEMESTER_BY_ID: "/api/semesters/all",
    ADD_SEMESTER: "/api/semesters/add",
    UPLOAD_SEMESTER: "/api/semesters/upload",
    PUBLIC_DATA: "/public/data/:filename",
    FORGET_PASSWORD: "/api/auth/forget_password",

    CREATE_COURSE: "/api/course/create",
    UPLOAD_COURSE: "/api/upload/course",
    CREATE_CLASSES: "/api/class/create",
    ADMIN_ADD_COURSE: "/api/admin/addcourse",
    ADMIN_ADD_CLASS: "/api/admin/addclass",
    GET_CLASS_BY_TEACHER_ID: "/api/classes/teacher/:teacherId",
    GET_CLASS_DETAIL: "/api/classes/:classId/details",
    UPLOAD_CLASS: "/api/upload/class",
    GET_CLASS_BY_STUDENT_ID: "/api/classes/Student/:studentId",

    CREATE_SESSION: "/api/classes/:classId/schedule/overrides",
    UPDATE_SESSION: "/api/classes/:classId/schedule/overrides/:overrideId",
    DELETE_SESSION: "/api/classes/:classId/schedule/overrides/:overrideId",

    CREATE_TEST: "/api/classes/:classId/tests",
    GET_TEST_DETAIL: "/api/tests/:testId/form-elements",
    UPDATE_TEST: "/api/tests/:testId",
    UPDATE_TEST_FORMELEMENT: "/api/tests/:testId/formElements",
    DELETE_TEST: "/api/tests/:testId/class/:classId",
    GET_CLASS_TESTS: "/api/classes/:classId/tests",
    PUBLIC_TEST: "/api/tests/:testId/publish",
    GET_ATEMPT_STUDENT: "/api/tests/:testId/student/:studentId/attempts",

    DELETE_QUESTION: "/api/tests/:testId/questions/:questionId",

    GET_TEST_BY_STUDENT: "/api/tests/:testId/Student/:studentId",
    SUBMIT_TEST_BT_STUDENT: "/api/tests/:testId/Student/:studentId/submit",
    GET_STUDENTS_TEST_RESULT: "/api/tests/:testId/results",
    GET_STUDENT_TEST_RESULT: "/api/tests/:testId/student/:studentId/result",
    DELETE_STUDENT_TEST_RESULT: "/api/Student/:studentId/result/:result",
    GET_STUDENT_RESULT_IN_CLASS: "/api/classes/:classId/students/:studentId/results",
    GET_RESULTS_TEST: "/api/tests/:testId/results",
    UPDATE_ANSWER_SCORE: "/api/studentresults/:studentResultId/answers/:formElementId/score",

    CREATE_NOTIFICATION: '/api/classes/:classId/notifications',
    GET_CLASS_NOTIFICATIONS: '/api/classes/:classId/notifications',
    GET_NOTIFICATION_DETAIL: '/api/classes/:classId/notifications/:notificationId',
    MARK_NOTIFICATION_AS_READ: '/api/classes/:classId/notifications/:notificationId/read',

    CREATE_POST: "/api/posts",                         // POST: Tạo bài viết mới
    GET_ALL_POSTS: "/api/posts",                       // GET: Lấy danh sách tất cả bài viết
    GET_POST_BY_ID: "/api/posts/:postId",              // GET: Lấy chi tiết một bài viết bằng ID
    UPDATE_POST_BY_ID: "/api/posts/:postId",           // PUT hoặc PATCH: Cập nhật bài viết bằng ID
    DELETE_POST_BY_ID: "/api/posts/:postId",           // DELETE: Xóa bài viết bằng ID

    CREATE_CLASS_BY_ADMIN: "/api/admin/classes/create",
    GET_CLASSES_BY_ADMIN: "/api/admin/classes/get",
    EDIT_CLASS_BY_ADMIN: "/api/admin/classes/edit/:classID",
    DELETE_CLASSES_BY_ADMIN: "/api/admin/classes/delete/:classID",

    CREATE_COURSE_BY_ADMIN: "/api/admin/courses/create",
    GET_COURSES_BY_ADMIN: "/api/admin/courses/get",
    EDIT_COURSE_BY_ADMIN: "/api/admin/courses/edit/:courseID",
    DELETE_COURSE_BY_ADMIN: "/api/admin/courses/delete/:courseID",

    ADMIN_GET_ALL_USERS: "/api/admin/users",
    CREATE_USER_BY_ADMIN: "/api/admin/users/create",
    DELETE_USER_BY_ADMIN: "/api/admin/users/delete/:id",
    EDIT_USER_BY_ADMIN: "/api/admin/users/edit/:id",

    GET_ALL_STUDENTS: "/api/users/students",
    ADD_STUDENT_TO_CLASS: "/api/classes/:classId/add-Student",
    DELETE_STUDENT_FORM_CLASS: "",

    GET_CLASS_ATTENDANCE: "/api/classes/:classId/attendance-sessions",
    GET_DAY_ATTENDANCE: "/api/classes/:classId/attendance-sessions/by-date?date=YYYY-MM-DD",
    POST_DAY_ATTENDANCE: "/api/classes/:classId/attendance-sessions",
    GET_STUDENT_ATTENDANCE: "/api/classes/:classId/students/:studentId/attendance",
    GET_ATTENDANCE_BY_STUDENT: "/api/classes/:classId/my-attendance-records"
};

const AUTH_STATE = {
    UNAUTHORIZED: 0,
    AUTHORIZED: 1,
    AUTHORIZE_EXPRIED: 2,
    INVALID_AUTHORIZED: 3
}
const SECRET_KEY = "IT'S A SECRET";
const DB_CONFIGS = {
    HOST: "mongodb://localhost",
    PORT: "27017"
}
const DB_SCHEMA = {
    LOGIN_INFO: "LoginInfo",

    USER: "User",
    TEACHER: "Teacher",
    STUDENT: "Student",
    ADMIN: "Admin",

    COURSE: "Course",
    CLASS: "Class",

    TESTLESSON: "TestLesson",
    QUESTION: "Question",
    STUDENTRESULT: "StudentResult",

    NOTIFICATION: 'Notification',

    POST: 'Post',
    ATTENDANCE:  'Attendance',
    MESSAGE: 'Message',
}

const RES_FORM = (status, message, data) => {
    console.log("New Response", { Status: status, Message: message, Data: data })
    return {
        status: status ? status : null,
        message: message ? message : null,
        data: data ? data : null,
    }
}

module.exports = {
    API_PATH,
    SECRET_KEY,
    DB_CONFIGS,
    DB_SCHEMA,
    AUTH_STATE,
    RES_FORM
}