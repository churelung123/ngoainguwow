const mongoose = require('mongoose');
const moment = require('moment-timezone'); // Để xử lý ngày tháng và múi giờ nhất quán

// Helper function để chuẩn hóa ngày về đầu ngày (UTC hoặc múi giờ của bạn)
const normalizeDate = (dateString) => {
    // Giả sử múi giờ của server/database là Asia/Ho_Chi_Minh
    // Hoặc bạn có thể lưu tất cả dưới dạng UTC
    return moment.tz(dateString, "Asia/Ho_Chi_Minh").startOf('day').toDate();
};

async function createOrUpdateAttendanceSession(req, res){
    const { classId } = req.params;
    const { sessionDate, attendanceList } = req.body;
    const userId = req.senderInstance._id;

    if (!sessionDate || !attendanceList) {
        return res.status(400).json({ status: "Error", message: "Thiếu sessionDate hoặc attendanceList." });
    }

    const normalizedSessionDate = normalizeDate(sessionDate);

    try {
        // Kiểm tra xem lớp học có tồn tại không
        const classExists = await global.DBConnection.Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ status: "Error", message: "Không tìm thấy lớp học." });
        }

        // Kiểm tra xem tất cả student_id trong attendanceList có hợp lệ và thuộc lớp học không (tùy chọn nâng cao)
        // for (const item of attendanceList) {
        //     if (!classExists.students_ids.includes(item.student_id)) {
        //         return res.status(400).json({ status: "Error", message: `Sinh viên với ID ${item.student_id} không thuộc lớp này.` });
        //     }
        // }


        let attendanceSession = await global.DBConnection.Attendance.findOne({
            class_id: classId,
            sessionDate: normalizedSessionDate
        });

        if (attendanceSession) {
            // Cập nhật bản ghi hiện có
            attendanceSession.attendanceList = attendanceList; // Ghi đè toàn bộ danh sách
            attendanceSession.lastModifiedBy = userId;
            // Nếu muốn merge thay vì ghi đè hoàn toàn, logic sẽ phức tạp hơn chút:
            // attendanceList.forEach(newRecord{
            //    const existingRecord = attendanceSession.attendanceList.find(arar.student_id.equals(newRecord.student_id));
            //    if (existingRecord) existingRecord.status = newRecord.status; else attendanceSession.attendanceList.push(newRecord);
            // });

        } else {
            // Tạo bản ghi mới
            attendanceSession = new global.DBConnection.Attendance({
                class_id: classId,
                sessionDate: normalizedSessionDate,
                attendanceList: attendanceList,
                recordedBy: userId,
                lastModifiedBy: userId // Khi tạo mới, người tạo cũng là người sửa cuối
            });
        }

        const savedSession = await attendanceSession.save();
        res.status(200).json({ status: "Success", message: "Lưu điểm danh thành công.", data: savedSession });

    } catch (error) {
        console.error("Lỗi khi lưu điểm danh:", error);
        if (error.code === 11000) { // Lỗi duplicate key (do unique index)
             return res.status(409).json({ status: "Error", message: "Buổi điểm danh cho ngày này đã tồn tại (lỗi trùng lặp).", details: error.keyValue });
        }
        res.status(500).json({ status: "Error", message: "Lỗi máy chủ nội bộ khi lưu điểm danh.", details: error.message });
    }
};

async function getAllAttendanceSessionsForClass(req, res){
    const { classId } = req.params;
    console.log(classId)
    try {
        const sessions = await global.DBConnection.Attendance.find({ class_id: classId })
            .populate('attendanceList.student_id', 'name vnu_id') // Lấy tên và vnu_id của sinh viên
            .sort({ sessionDate: -1 }); // Sắp xếp theo ngày giảm dần (mới nhất trước)

        if (!sessions) {
            return res.status(404).json({ status: "Error", message: "Không tìm thấy dữ liệu điểm danh cho lớp này." });
        }
        res.status(200).json({ status: "Success", message: "Tải dữ liệu điểm danh thành công.", data: sessions });
    } catch (error) {
        console.error("Lỗi khi tải tất cả buổi điểm danh:", error);
        res.status(500).json({ status: "Error", message: "Lỗi máy chủ nội bộ.", details: error.message });
    }
};

async function getAttendanceSessionByDate(req, res){
    const { classId } = req.params;
    const { date } = req.query; // Lấy từ query param, ví dụ: ?date=2024-05-20

    if (!date) {
        return res.status(400).json({ status: "Error", message: "Thiếu tham số ngày (date)." });
    }
    const normalizedSessionDate = normalizeDate(date);

    try {
        const session = await global.DBConnection.Attendance.findOne({
            class_id: classId,
            sessionDate: normalizedSessionDate
        }).populate('attendanceList.student_id', 'name vnu_id'); // Lấy tên và vnu_id

        if (!session) {
            // Trả về danh sách sinh viên của lớp với trạng thái mặc định nếu chưa có bản ghi
            // Hoặc chỉ trả về 404 nếu muốn frontend tự xử lý
            const targetClass = await global.DBConnection.Class.findById(classId).populate('students_ids', 'name vnu_id _id');
            if (!targetClass) return res.status(404).json({ status: "Error", message: "Không tìm thấy lớp học." });

            // Tạo dữ liệu điểm danh trống cho frontend nếu chưa có
            const emptyAttendanceList = targetClass.students_ids.map(Student({
                student_id: Student, // Student giờ đã được populate
                status: 'absent', // Hoặc một trạng thái "chưa điểm danh"
                note: ''
            }));

            return res.status(200).json({
                status: "Success",
                message: "Chưa có dữ liệu điểm danh cho ngày này. Trả về danh sách sinh viên mặc định.",
                data: {
                    class_id: classId,
                    sessionDate: normalizedSessionDate,
                    attendanceList: emptyAttendanceList,
                    isNew: true // Cờ báo cho frontend biết đây là dữ liệu mới, chưa lưu
                }
            });
        }
        res.status(200).json({ status: "Success", message: "Tải dữ liệu điểm danh thành công.", data: session });
    } catch (error) {
        console.error("Lỗi khi tải buổi điểm danh theo ngày:", error);
        res.status(500).json({ status: "Error", message: "Lỗi máy chủ nội bộ.", details: error.message });
    }
};

// Controller cho getStudentAttendanceInClass (tùy chọn)
async function getStudentAttendanceInClass(req, res){
    const { classId, studentId: paramStudentId } = req.params;
    // Nếu sinh viên tự xem, studentId có thể được lấy từ req.user._id
    const studentId = req.user.role === 'Student' ? req.user._id.toString() : paramStudentId;

    if (req.user.role === 'Student' && req.user._id.toString() !== studentId) {
        return res.status(403).json({ status: "Error", message: "Bạn không có quyền xem thông tin điểm danh của sinh viên này." });
    }

    try {
        const studentRecords = await global.DBConnection.Attendance.find({
            class_id: classId,
            'attendanceList.student_id': studentId
        })
        .select('sessionDate attendanceList.$') // Chỉ lấy phần tử khớp trong mảng attendanceList
        .sort({ sessionDate: 1 });

        if (!studentRecords || studentRecords.length === 0) {
            return res.status(404).json({ status: "Error", message: "Không tìm thấy dữ liệu điểm danh cho sinh viên này trong lớp." });
        }

        // Định dạng lại dữ liệu cho dễ sử dụng ở frontend
        const formattedRecords = studentRecords.map(record({
            sessionDate: record.sessionDate,
            status: record.attendanceList[0].status, // Vì select('attendanceList.$') chỉ trả về 1 phần tử
            note: record.attendanceList[0].note
        }));

        res.status(200).json({ status: "Success", data: formattedRecords });
    } catch (error) {
        console.error("Lỗi khi tải điểm danh của sinh viên:", error);
        res.status(500).json({ status: "Error", message: "Lỗi máy chủ nội bộ.", details: error.message });
    }
};

async function  getMyAttendanceRecordsForClass(req, res){
    const { classId } = req.params;
    const studentId = req.senderInstance._id; // Lấy ID của học sinh đang đăng nhập từ middleware xác thực

    try {
        // Tìm tất cả các buổi điểm danh của lớp học này
        const classAttendanceSessions = await global.DBConnection.Attendance.find({ class_id: classId })
            .select('sessionDate attendanceList recordedBy') // Chỉ lấy các trường cần thiết
            .sort({ sessionDate: 1 }); // Sắp xếp theo ngày tăng dần

        if (!classAttendanceSessions || classAttendanceSessions.length === 0) {
            return res.status(200).json({
                status: "Success",
                message: "Lớp học này chưa có dữ liệu điểm danh.",
                data: [] // Trả về mảng rỗng
            });
        }

        // Lọc ra bản ghi điểm danh của chính học sinh này từ mỗi buổi học
        const myRecords = classAttendanceSessions.map(session => {
            const myAttendanceEntry = session.attendanceList.find(
                entry => entry.student_id.equals(studentId) // So sánh ObjectId
            );
            return {
                sessionDate: session.sessionDate,
                // recordedBy: session.recordedBy, // Có thể thêm nếu muốn biết ai điểm danh
                status: myAttendanceEntry ? myAttendanceEntry.status : 'not_recorded', // 'not_recorded' nếu không tìm thấy
                note: myAttendanceEntry ? (myAttendanceEntry.note || '') : ''
            };
        });

        res.status(200).json({ status: "Success", data: myRecords });

    } catch (error) {
        console.error("Lỗi khi lấy điểm danh của học sinh:", error);
        res.status(500).json({ status: "Error", message: "Lỗi máy chủ khi truy vấn dữ liệu điểm danh." });
    }
};

module.exports = {
    createOrUpdateAttendanceSession,
    getAllAttendanceSessionsForClass,
    getAttendanceSessionByDate,
    getStudentAttendanceInClass,
    getMyAttendanceRecordsForClass,
}