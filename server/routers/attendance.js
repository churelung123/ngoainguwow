const attendanceRouter = require("express").Router();
const Configs = require("./../configs/Constants");

const { validateToken, authorize } = require('../middleware/auth-middleware/auth');
const { getAllAttendanceSessionsForClass, getAttendanceSessionByDate, getStudentAttendanceInClass, createOrUpdateAttendanceSession, getMyAttendanceRecordsForClass } = require('../middleware/attendance-middleware/attendance');

// Lấy tất cả các buổi điểm danh của một lớp
// GET /api/classes/:classId/attendance-sessions
attendanceRouter.get(Configs.API_PATH.GET_CLASS_ATTENDANCE, validateToken, authorize(['teacher', 'admin']), getAllAttendanceSessionsForClass);

// Lấy thông tin điểm danh của một buổi học cụ thể (theo ngày)
// GET /api/classes/:classId/attendance-sessions/by-date?date=YYYY-MM-DD
attendanceRouter.get(Configs.API_PATH.GET_DAY_ATTENDANCE, validateToken, authorize(['teacher', 'admin', 'Student']), getAttendanceSessionByDate);

// Tạo hoặc cập nhật một buổi điểm danh cho một lớp
// POST /api/classes/:classId/attendance-sessions
attendanceRouter.post(Configs.API_PATH.POST_DAY_ATTENDANCE, validateToken, authorize(['teacher', 'admin']), createOrUpdateAttendanceSession);

// (Tùy chọn) Lấy lịch sử điểm danh của một sinh viên cụ thể trong một lớp
// GET /api/classes/:classId/students/:studentId/attendance
attendanceRouter.get(Configs.API_PATH.GET_STUDENT_ATTENDANCE, validateToken, authorize(['teacher', 'admin', 'Student']), getStudentAttendanceInClass);

attendanceRouter.get(Configs.API_PATH.GET_ATTENDANCE_BY_STUDENT, validateToken, authorize(['teacher', 'admin', 'Student']), getMyAttendanceRecordsForClass);

module.exports = attendanceRouter;