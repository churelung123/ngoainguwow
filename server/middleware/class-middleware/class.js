const Configs = require('./../../configs/Constants');
const moment = require('moment-timezone');
const {
  v4: uuidv4
} = require('uuid');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

async function fCreateClass(req, res) {
  const { classId, course_code, className, classFee, teacher_id, assistantTeachers_ids = [], students_ids = [], schedule = {}, sessionOverrides = {} } = req.body;

  try {
    const course = await global.DBConnection.Course.findOne({ course_code: course_code });
    const validCourse = course ? course._id : null;

    // Kiểm tra teacher_id
    const teacher = await global.DBConnection.User.findOne({ vnu_id: teacher_id, role: 'teacher' });
    const validTeacherId = teacher ? teacher._id : null;

    // Kiểm tra assistantTeachers_ids
    const assistantTeachersIdArray = assistantTeachers_ids ? assistantTeachers_ids.split(',') : [];
    const validAssistantTeachers = await global.DBConnection.User.find({ vnu_id: { $in: assistantTeachersIdArray }, role: 'teacher' }).distinct('_id');

    // Kiểm tra students_ids
    const studentIdArray = students_ids ? students_ids.split(',') : [];
    const validStudents = await global.DBConnection.User.find({ vnu_id: { $in: studentIdArray }, role: 'Student' }).distinct('_id');

    const newClass = new global.DBConnection.Class({
      classId: classId,
      course_code: validCourse,
      className: className,
      classFee: classFee,
      teacher_id: validTeacherId,
      assistantTeachers_ids: validAssistantTeachers,
      students_ids: validStudents,
      schedule: schedule,
      sessionOverrides: sessionOverrides
    });

    console.log("newClass.assistantTeachers_ids: ", newClass.assistantTeachers_ids);
    await newClass.save();
    res.status(201).json(Configs.RES_FORM("Success", "Class created successfully", newClass));
  } catch (e) {
    res.status(400).json(Configs.RES_FORM("Error", "Failed to create class: " + e.message));
  }
}

async function findClassByClassId(req, res, next) {
  let { classId } = req.params;
  try {
    let classInstance = await global.DBConnection.Class.findOne({ _id: classId })
      .populate({ path: 'course_code', select: 'courseName courseCode' })
      .populate({ path: 'teacher_id', select: 'name vnu_id' })
      .populate({ path: 'assistantTeachers_ids', select: 'name vnu_id' })
      .populate({ path: 'students_ids', select: 'name vnu_id' });
    if (!classInstance) {
      res.status(404).json(Configs.RES_FORM("Error", "Class not found"));
      return;
    }
    req.classInstance = classInstance;
    next();
  } catch (e) {
    res.status(400).json(Configs.RES_FORM("Error", "Invalid class ID"));
  }
}

async function fGetClassesByTeacher(req, res) {
  try {
    const { teacherId } = req.params;
    const userRole = req.senderInstance.role; // Assuming user role is available in req.senderInstance

    let query = {};

    if (userRole === 'teacher') {
      query = {
        $or: [
          { teacher_id: teacherId },
          { assistantTeachers_ids: teacherId }
        ]
      };
    } else {
      return res.status(403).json(Configs.RES_FORM("Error", "Không có quyền truy cập."));
    }

    const classes = await global.DBConnection.Class.find(query)
      .populate('course_code', 'course_name course_code')
      .populate('students_ids', '_id')
      .populate('teacher_id', 'name _id role') // Populate teacher details for admins
      .populate('assistantTeachers_ids', 'name _id role'); // Populate assistant teacher details for admins

    let classesWithInfo = classes.map(lop => {
      const isTeaching = lop.teacher_id && lop.teacher_id._id.toString() === req.senderInstance._id.toString();
      const isAssistant = lop.assistantTeachers_ids && lop.assistantTeachers_ids.some(at => at._id.toString() === req.senderInstance._id.toString());
      const userRoleInClass = isTeaching ? 'Giảng viên chính' : (isAssistant ? 'Trợ giảng' : null);

      return {
        ...lop.toObject(),
        studentCount: lop.students_ids.length,
        userRoleInClass: userRoleInClass,
      };
    });

    res.status(200).json(Configs.RES_FORM("Success", classesWithInfo));
  } catch (error) {
    res.status(500).json(Configs.RES_FORM("Error", "Lỗi khi lấy danh sách lớp học: " + error.message));
  }
}

async function fFindClassByClassId(req, res) {
  res.status(200).json(Configs.RES_FORM("Success", req.classInstance));
}

async function validateClassTeacher(req, res, next) {
  const classInstance = await req.classInstance.populate('teacher_id', 'vnu_id');
  if (classInstance.teacher_id && classInstance.teacher_id.vnu_id === req.senderVNUId) {
    next();
  } else {
    res.status(403).json(Configs.RES_FORM("Error", "You are not the teacher of this class."));
  }
}

async function validateClassMember(req, res, next) {
  console.log("dữ liệu cần xem", req.classInstance);
  const classInstance = await req.classInstance.populate('students_ids', '_id');
  const isMember = classInstance.students_ids.some(Student => Student._id.equals(req.senderInstance._id));
  const isTeacher = classInstance.teacher_id && classInstance.teacher.equals(req.senderInstance._id);
  const isAssisTeacher = classInstance.assistantTeachers_ids && classInstance.assistantTeachers_ids.some(assistantTeacher => assistantTeacher._id.equals(req.senderInstance._id));

  if (isMember || isTeacher || isAssisTeacher) {
    next();
  } else {
    res.status(403).json(Configs.RES_FORM("Error", "You are not a member of this class."));
  }
}

async function fGetClassDetails(req, res) {
  try {
    const { classId } = req.params;

    // Lấy chi tiết lớp học và populate các trường liên quan
    let classDetails = await global.DBConnection.Class.findOne({ _id: classId })
      .populate('course_code', 'course_name course_code')
      .populate('teacher_id', 'name email vnu_id phone_number')
      .populate('assistantTeachers_ids', 'name email vnu_id phone_number')
      // Populate students_ids và toàn bộ trường paymentStatus
      .populate('students_ids', 'name email vnu_id phone_number gender date_of_birth paymentStatus')
      .populate('tests', '_id type testDate duration title isPublish')

    if (!classDetails) {
      return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy chi tiết lớp học"));
    }

    // Chuyển đổi classDetails thành đối tượng JavaScript để có thể chỉnh sửa
    const result = classDetails.toObject();

    // Lọc paymentStatus cho từng sinh viên
    if (result.students_ids && result.students_ids.length > 0) {
      result.students_ids = result.students_ids.map(student => {
        // Tạo một bản sao của sinh viên để tránh thay đổi trực tiếp đối tượng Mongoose
        const studentObj = { ...student };
        // Lọc mảng paymentStatus của sinh viên
        if (studentObj.paymentStatus && Array.isArray(studentObj.paymentStatus)) {
          studentObj.paymentStatus = studentObj.paymentStatus.filter(status => 
            status.classId && status.classId.toString() === classId.toString()
          );
        }
        return studentObj;
      });
    }

    // Gắn lại trường tests (đã được populate sẵn)
    result.tests = classDetails.tests;

    res.status(200).json(Configs.RES_FORM("Success", result));
  } catch (error) {
    res.status(500).json(Configs.RES_FORM("Error", "Lỗi khi lấy chi tiết lớp học: " + error.message));
  }
}

async function fGetStudentClasses(req, res) {
  try {
    const { studentId } = req.params;

    const classes = await global.DBConnection.Class.find({ students_ids: { $in: [studentId] } })
      .populate('course_code', 'course_name course_code')
      .populate('teacher_id', '_id name')
      .populate('students_ids', '_id');

    const classesWithInfo = classes.map(lop => {
      return {
        ...lop.toObject(),
        studentCount: lop.students_ids.length,
      };
    });

    res.status(200).json(Configs.RES_FORM("Success", classesWithInfo));
  } catch (error) {
    res.status(500).json(Configs.RES_FORM("Error", "Lỗi khi lấy danh sách lớp học của sinh viên: " + error.message));
  }
}

async function fGetMemberBasicInfors(req, res) {
  const classInstance = await req.classInstance.populate('students_ids', 'name vnu_id email');
  const limit = parseInt(req.query.limit, 10) || classInstance.students_ids.length;
  const classMembers = classInstance.students_ids.slice(0, limit);
  res.status(200).json(Configs.RES_FORM("Success", classMembers));
}

async function fAddMembersToClass(req, res) {
  try {
    const { memberIds } = req.body;
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json(Configs.RES_FORM("Error", "Member IDs must be a non-empty array."));
    }
    const updatedClass = await global.DBConnection.Class.findByIdAndUpdate(
      req.classInstance._id,
      { $addToSet: { students_ids: { $each: memberIds } } },
      { new: true }
    ).populate('students_ids', 'name vnu_id email');
    if (updatedClass) {
      res.status(200).json(Configs.RES_FORM("Success", { members: updatedClass.students_ids, addedCount: memberIds.length }));
    } else {
      res.status(404).json(Configs.RES_FORM("Error", "Class not found."));
    }
  } catch (e) {
    res.status(400).json(Configs.RES_FORM("Error", "Invalid member IDs: " + e.message));
  }
}

async function fGetCurClasses(req, res) {
  var sender = req.senderInstance;
  if (sender.role == "teacher") {
    var classes = await global.DBConnection.Class.find({
      teacher_vnu_id: sender.vnu_id // Tìm kiếm bằng teacher_vnu_id
    }).populate('course_code', 'courseName courseCode');
    res.status(200);
    res.json(Configs.RES_FORM("Success", classes));

  } else if (sender.role == "Student") {
    var classes = await global.DBConnection.Class.find({
      students_vnu_ids: sender.vnu_id
    }).populate('course_code', 'courseName courseCode');
    res.status(200);
    res.json(Configs.RES_FORM("Success", classes));
  }
}
async function fDeleteMemberInClass(req, res) {
  const { memberId } = req.params;
  try {
    const updatedClass = await global.DBConnection.Class.findByIdAndUpdate(
      req.classInstance._id,
      { $pull: { students_ids: memberId } },
      { new: true }
    ).populate('students_ids', 'name vnu_id email');
    if (updatedClass) {
      res.status(200).json(Configs.RES_FORM("Success", { members: updatedClass.students_ids, deletedCount: 1 }));
    } else {
      res.status(404).json(Configs.RES_FORM("Error", "Class not found."));
    }
  } catch (e) {
    res.status(400).json(Configs.RES_FORM("Error", "Invalid member ID: " + e.message));
  }
}

async function handleUploadMembers(req, res, next) {
  const jsonArray = await csv().fromFile(req.fileUploadPath);
  const members = jsonArray.map(item => item.email);
  req.body.members = JSON.stringify(members);
  next();
}

async function fGetClassesByAdmin(req, res) {
  try {
    // 1. Xác thực vai trò Admin
    if (!req.senderInstance || req.senderInstance.role !== 'admin') {
      return res.status(403).json(Configs.RES_FORM("Error", "Không có quyền truy cập. Chức năng này chỉ dành cho Quản trị viên."));
    }

    // 2. Lấy các tham số cho phân trang và tìm kiếm (ví dụ)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Mặc định 10 lớp mỗi trang
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search || ''; // Từ khóa tìm kiếm
    const courseFilter = req.query.courseId || null; // Lọc theo ID khóa học

    // 3. Xây dựng query động
    let queryConditions = {};

    if (searchQuery) {
      queryConditions.$or = [
        { className: { $regex: searchQuery, $options: 'i' } }, // Tìm theo tên lớp
        { classId: { $regex: searchQuery, $options: 'i' } }   // Tìm theo mã lớp (nếu classId là trường string)
        // Bạn có thể thêm tìm kiếm theo tên giáo viên nếu populate và thực hiện match phức tạp hơn,
        // hoặc tìm kiếm sau khi đã lấy dữ liệu (ít hiệu quả hơn cho DB lớn)
      ];
    }

    if (courseFilter) {
      if (mongoose.Types.ObjectId.isValid(courseFilter)) {
        queryConditions.course_code = new ObjectId(courseFilter);
      } else {
        // Nếu courseFilter không phải ObjectId hợp lệ, có thể bỏ qua hoặc báo lỗi
        console.warn("courseId filter không hợp lệ:", courseFilter);
      }
    }

    // 4. Lấy tổng số lượng bản ghi (để tính tổng số trang)
    const totalClasses = await global.DBConnection.Class.countDocuments(queryConditions);

    // 5. Lấy danh sách lớp học với phân trang và populate
    const classes = await global.DBConnection.Class.find(queryConditions)
      .populate('course_code', 'course_name course_code course_fee') // Thêm các trường cần thiết từ course
      .populate('teacher_id', 'name vnu_id email') // Thông tin giáo viên
      .populate('assistantTeachers_ids', 'name vnu_id email') // Thông tin trợ giảng
      .populate('students_ids', '_id') // Chỉ cần _id để đếm
      .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất (hoặc tiêu chí khác)
      .skip(skip)
      .limit(limit);

    // 6. Chuẩn bị dữ liệu trả về
    const classesWithInfo = classes.map(lop => ({
      _id: lop._id,
      classId: lop.classId, // Mã lớp (nếu có trường riêng)
      className: lop.className,
      classFee: lop.classFee,
      course: lop.course_code ? { // Thông tin khóa học chi tiết hơn
        _id: lop.course_code._id,
        name: lop.course_code.course_name,
        code: lop.course_code.course_code,
        fee: lop.course_code.course_fee
      } : null,
      teacher: lop.teacher_id ? { // Thông tin giáo viên
        _id: lop.teacher_id._id,
        name: lop.teacher_id.name,
        vnu_id: lop.teacher_id.vnu_id,
        email: lop.teacher_id.email
      } : null,
      assistantTeachers: lop.assistantTeachers_ids.map(at => ({ // Danh sách trợ giảng
        _id: at._id,
        name: at.name,
        vnu_id: at.vnu_id,
        email: at.email
      })),
      studentCount: lop.students_ids.length,
      schedule: lop.schedule, // Thông tin lịch học
      sessionOverrides: lop.sessionOverrides,
      createdAt: lop.createdAt, // Ngày tạo
      updatedAt: lop.updatedAt  // Ngày cập nhật
    }));

    res.status(200).json(Configs.RES_FORM("Success", {
      classes: classesWithInfo,
      currentPage: page,
      totalPages: Math.ceil(totalClasses / limit),
      totalClasses: totalClasses,
      limit: limit
    }));

  } catch (error) {
    console.error("Error in fGetClassesByAdmin:", error);
    res.status(500).json(Configs.RES_FORM("Error", "Lỗi máy chủ khi lấy danh sách lớp học: " + error.message));
  }
}

async function fEditClass(req, res) {
  const classIdToEdit = req.params.classID; // Lấy ID của lớp cần sửa từ URL params, ví dụ: /api/classes/edit/:classIdToEdit
  const updateData = req.body;        // Dữ liệu cập nhật từ client

  // Kiểm tra xem classIdToEdit có phải là ObjectId hợp lệ không
  if (!ObjectId.isValid(classIdToEdit)) {
    return res.status(400).json(Configs.RES_FORM("Error", "ID lớp học không hợp lệ."));
  }

  try {
    // Tìm lớp học theo _id
    let classToUpdate = await global.DBConnection.Class.findById(classIdToEdit);

    if (!classToUpdate) {
      return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy lớp học để cập nhật."));
    }

    // === Cập nhật các trường ===
    // Các trường cơ bản
    if (updateData.className !== undefined) {
      classToUpdate.className = updateData.className;
    }
    if (updateData.classId !== undefined) { // Nếu bạn cho phép sửa cả classId (mã lớp riêng)
      // Cần kiểm tra unique cho classId mới nếu nó thay đổi và là unique field
      if (updateData.classId !== classToUpdate.classId) {
        const existingClassWithNewId = await global.DBConnection.Class.findOne({ classId: updateData.classId });
        if (existingClassWithNewId) {
          return res.status(400).json(Configs.RES_FORM("Error", `Mã lớp '${updateData.classId}' đã tồn tại.`));
        }
        classToUpdate.classId = updateData.classId;
      }
    }

    // Cập nhật course_code (phải là ObjectId hợp lệ của một Course)
    if (updateData.course_code !== undefined) {
      if (ObjectId.isValid(updateData.course_code)) {
        // Tùy chọn: Kiểm tra xem course_code này có thực sự tồn tại trong bảng Course không
        const courseExists = await global.DBConnection.Course.findById(updateData.course_code);
        if (!courseExists) {
          return res.status(400).json(Configs.RES_FORM("Error", "Khóa học không hợp lệ hoặc không tồn tại."));
        }
        classToUpdate.course_code = updateData.course_code;
      } else {
        return res.status(400).json(Configs.RES_FORM("Error", "Mã khóa học không hợp lệ."));
      }
    }

    // Cập nhật teacher_id (phải là ObjectId hợp lệ của một User có role 'teacher')
    if (updateData.teacher_id !== undefined) {
      const teacherExists = await global.DBConnection.User.findOne({ _id: updateData.teacher_id, role: 'teacher' }); // Bỏ comment role nếu cần
      if (!teacherExists) {
        return res.status(400).json(Configs.RES_FORM("Error", "Giáo viên không hợp lệ hoặc không tồn tại."));
      }
      classToUpdate.teacher_id = updateData.teacher_id;
    }

    // Cập nhật classFee
    if (updateData.classFee !== undefined) {
      const fee = parseFloat(updateData.classFee);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json(Configs.RES_FORM("Error", "Học phí không hợp lệ."));
      }
      classToUpdate.classFee = fee;
    }

    // Cập nhật schedule
    if (updateData.schedule && typeof updateData.schedule === 'object') {
      const newSchedule = updateData.schedule;
      // Tạo một object schedule mới để tránh ghi đè một phần không mong muốn
      let updatedScheduleFields = { ...classToUpdate.schedule.toObject() }; // Lấy schedule hiện tại

      if (newSchedule.totalSessions !== undefined) {
        updatedScheduleFields.totalSessions = parseInt(newSchedule.totalSessions, 10);
        if (isNaN(updatedScheduleFields.totalSessions)) return res.status(400).json(Configs.RES_FORM("Error", "Tổng số buổi học không hợp lệ."));
      }
      if (newSchedule.daysOfWeek !== undefined && Array.isArray(newSchedule.daysOfWeek)) {
        // Tùy chọn: Validate giá trị trong daysOfWeek dựa trên enum trong schema
        updatedScheduleFields.daysOfWeek = newSchedule.daysOfWeek;
      }
      if (newSchedule.startTime !== undefined) {
        // Tùy chọn: Validate định dạng startTime (ví dụ: "HH:mm")
        updatedScheduleFields.startTime = newSchedule.startTime;
      }
      if (newSchedule.sessionDuration !== undefined) {
        updatedScheduleFields.sessionDuration = parseInt(newSchedule.sessionDuration, 10);
        if (isNaN(updatedScheduleFields.sessionDuration)) return res.status(400).json(Configs.RES_FORM("Error", "Thời lượng buổi học không hợp lệ."));
      }
      if (newSchedule.startDate !== undefined) {
        // Chuyển đổi sang Date object nếu client gửi string
        const startDate = new Date(newSchedule.startDate);
        if (isNaN(startDate.getTime())) return res.status(400).json(Configs.RES_FORM("Error", "Ngày bắt đầu không hợp lệ."));
        updatedScheduleFields.startDate = startDate;
      }
      if (newSchedule.endDate !== undefined) { // Cho phép cập nhật cả endDate nếu client gửi
        const endDate = new Date(newSchedule.endDate);
        if (isNaN(endDate.getTime())) return res.status(400).json(Configs.RES_FORM("Error", "Ngày kết thúc không hợp lệ."));
        updatedScheduleFields.endDate = endDate;
      } else if (newSchedule.endDate === null) { // Cho phép xóa endDate
        updatedScheduleFields.endDate = null;
      }
      if (newSchedule.room !== undefined) {
        updatedScheduleFields.room = newSchedule.room;
      }
      classToUpdate.schedule = updatedScheduleFields;
    }

    // Cập nhật assistantTeachers_ids, students_ids (nếu cần thiết và phức tạp hơn, có thể cần logic $set, $addToSet, $pull)
    // Ví dụ đơn giản là ghi đè (cần đảm bảo client gửi mảng ObjectId hợp lệ):
    if (updateData.assistantTeachers_ids !== undefined && Array.isArray(updateData.assistantTeachers_ids)) {
      classToUpdate.assistantTeachers_ids = updateData.assistantTeachers_ids.filter(id => ObjectId.isValid(id));
    }
    // students_ids thường được quản lý qua các API riêng (add/remove member) nên có thể không cần cập nhật trực tiếp ở đây.

    // Lưu các thay đổi
    const updatedClass = await classToUpdate.save();

    // Populate lại thông tin nếu cần trả về dữ liệu đầy đủ
    const result = await global.DBConnection.Class.findById(updatedClass._id)
      .populate('course_code', 'course_name course_code course_fee')
      .populate('teacher_id', 'name vnu_id email');
    // .populate('assistantTeachers_ids', 'name vnu_id email'); // Populate thêm nếu cần

    res.status(200).json(Configs.RES_FORM("Success", "Cập nhật lớp học thành công.", result));

  } catch (e) {
    console.error("Lỗi khi cập nhật lớp học:", e);
    res.status(500).json(Configs.RES_FORM("Error", "Lỗi máy chủ khi cập nhật lớp học: " + e.message));
  }
}

const normalizeDateForStorage = (dateString) => {
  if (!dateString) return null;
  // Nên lưu trữ ngày ở một định dạng nhất quán, ví dụ: đầu ngày theo UTC
  return moment.utc(dateString).startOf('day').toDate();
};

/**
 * Thêm một sessionOverride mới vào lịch học của lớp.
 * POST /api/classes/:classId/schedule/overrides
 * Body: { originalDate?, newDate?, type, reason? }
 */
async function addSessionOverride(req, res) {
  const { classId } = req.params;
  const { originalDate, newDate, type, reason } = req.body;
  const userId = req.senderInstance._id;

  if (!type) {
    return res.status(400).json({ status: "Error", message: "Loại override (type) là bắt buộc." });
  }
  if (type === 'rescheduled' && (!originalDate || !newDate)) {
    return res.status(400).json({ status: "Error", message: "Cần có ngày gốc và ngày mới cho việc dời lịch." });
  }
  if (type === 'makeup_added' && !newDate) {
    return res.status(400).json({ status: "Error", message: "Cần có ngày mới cho buổi học bù." });
  }
  // Với 'cancelled' hoặc 'holiday', originalDate hoặc newDate (cho holiday không có ngày gốc) nên được cung cấp
  if ((type === 'cancelled' && !originalDate) && (type === 'holiday' && !originalDate && !newDate)) {
    return res.status(400).json({ status: "Error", message: "Cần có ngày cụ thể cho việc hủy/ngày lễ." });
  }


  try {
    const targetClass = await global.DBConnection.Class.findById(classId);
    if (!targetClass) {
      return res.status(404).json({ status: "Error", message: "Không tìm thấy lớp học." });
    }

    const newOverride = {
      originalDate: normalizeDateForStorage(originalDate),
      newDate: normalizeDateForStorage(newDate),
      type,
      reason: reason || '',
      // createdBy: userId // Có thể thêm người tạo nếu muốn
    };

    targetClass.schedule.sessionOverrides.push(newOverride);
    await targetClass.save();

    // Trả về override vừa được tạo (nó sẽ có _id sau khi save)
    const addedOverride = targetClass.schedule.sessionOverrides[targetClass.schedule.sessionOverrides.length - 1];

    res.status(201).json({
      status: "Success",
      message: "Đã thêm điều chỉnh lịch học thành công.",
      data: addedOverride
    });

  } catch (error) {
    console.error("Lỗi khi thêm session override:", error);
    res.status(500).json({ status: "Error", message: "Lỗi máy chủ khi thêm điều chỉnh lịch học." });
  }
};

/**
 * Cập nhật một sessionOverride hiện có.
 * PUT /api/classes/:classId/schedule/overrides/:overrideId
 * Body: { originalDate?, newDate?, type?, reason? }
 */
async function updateSessionOverride(req, res) {
  const { classId, overrideId } = req.params;
  const updates = req.body; // { originalDate, newDate, type, reason }
  const userId = req.senderInstance._id; // Người thực hiện cập nhật

  if (!mongoose.Types.ObjectId.isValid(overrideId)) {
    return res.status(400).json({ status: "Error", message: "ID của override không hợp lệ." });
  }

  try {
    const targetClass = await global.DBConnection.Class.findById(classId);
    if (!targetClass) {
      return res.status(404).json({ status: "Error", message: "Không tìm thấy lớp học." });
    }

    const overrideItem = targetClass.schedule.sessionOverrides.id(overrideId);
    if (!overrideItem) {
      return res.status(404).json({ status: "Error", message: "Không tìm thấy điều chỉnh lịch học cần cập nhật." });
    }

    // Cập nhật các trường được phép
    if (updates.hasOwnProperty('originalDate')) {
      overrideItem.originalDate = normalizeDateForStorage(updates.originalDate);
    }
    if (updates.hasOwnProperty('newDate')) {
      overrideItem.newDate = normalizeDateForStorage(updates.newDate);
    }
    if (updates.type) {
      overrideItem.type = updates.type;
    }
    if (updates.hasOwnProperty('reason')) {
      overrideItem.reason = updates.reason;
    }
    // overrideItem.lastModifiedBy = userId; // Có thể thêm người sửa cuối

    await targetClass.save();
    res.status(200).json({
      status: "Success",
      message: "Đã cập nhật điều chỉnh lịch học thành công.",
      data: overrideItem
    });

  } catch (error) {
    console.error("Lỗi khi cập nhật session override:", error);
    res.status(500).json({ status: "Error", message: "Lỗi máy chủ khi cập nhật điều chỉnh lịch học." });
  }
};

/**
 * Xóa một sessionOverride.
 * DELETE /api/classes/:classId/schedule/overrides/:overrideId
 */
async function deleteSessionOverride(req, res) {
  const { classId, overrideId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(overrideId)) {
    return res.status(400).json({ status: "Error", message: "ID của override không hợp lệ." });
  }

  try {
    const targetClass = await global.DBConnection.Class.findById(classId);
    if (!targetClass) {
      return res.status(404).json({ status: "Error", message: "Không tìm thấy lớp học." });
    }

    const overrideItem = targetClass.schedule.sessionOverrides.id(overrideId);
    if (!overrideItem) {
      return res.status(404).json({ status: "Error", message: "Không tìm thấy điều chỉnh lịch học cần xóa." });
    }

    // Sử dụng .pull() để xóa subdocument khỏi mảng bằng _id của nó
    targetClass.schedule.sessionOverrides.pull(overrideId);
    // Hoặc cách khác nếu đã lấy được subdocument: overrideItem.remove(); (cần kiểm tra lại cách Mongoose hỗ trợ)
    // Với .pull(id), Mongoose sẽ tìm và xóa phần tử có _id đó.

    await targetClass.save();
    res.status(200).json({
      status: "Success",
      message: "Đã xóa điều chỉnh lịch học thành công."
    });

  } catch (error) {
    console.error("Lỗi khi xóa session override:", error);
    res.status(500).json({ status: "Error", message: "Lỗi máy chủ khi xóa điều chỉnh lịch học." });
  }
};

async function fAddMemberToClass(req, res) {
  const { classId } = req.params;
  const { studentId, amountPaid } = req.body; // Bạn đã nhận amountPaid ở đây rồi!

  try {
    const classInstance = await global.DBConnection.Class.findById(classId);
    if (!classInstance) {
      return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy lớp học."));
    }

    // ... (kiểm tra quyền của người gửi yêu cầu)

    // Kiểm tra xem học sinh đã có trong lớp chưa (dựa trên ObjectId)
    const studentExistsInClass = classInstance.students_ids.some(s => s.equals(studentId));
    if (studentExistsInClass) {
      return res.status(409).json(Configs.RES_FORM("Error", "Học sinh đã có trong lớp này."));
    }

    const studentToAdd = await global.DBConnection.Student.findOne({ _id: studentId, role: 'Student' });
    if (!studentToAdd) {
      return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy học sinh với ID cung cấp hoặc học sinh không có vai trò 'Student'."));
    }

    // 1. Thêm ObjectId của học sinh vào mảng students_ids của lớp
    classInstance.students_ids.push(studentToAdd._id);
    await classInstance.save();

    // 2. Cập nhật paymentStatus trong UserSchema của học sinh
    // Vấn đề: Bạn đang ĐẶT LẠI amountPaid về 0 và status về 'unpaid'
    const existingPaymentEntryIndex = studentToAdd.paymentStatus.findIndex(p => p.classId.equals(classInstance._id));

    if (existingPaymentEntryIndex > -1) {
      // Nếu đã có mục paymentStatus cho lớp này, cập nhật
      // CẦN CẬP NHẬT amountPaid = amountPaid MỚI NHẬN ĐƯỢC TỪ FRONTEND
      studentToAdd.paymentStatus[existingPaymentEntryIndex].status = amountPaid >= classInstance.classFee ? 'paid' : (amountPaid > 0 ? 'partially_paid' : 'unpaid'); // Cập nhật status
      studentToAdd.paymentStatus[existingPaymentEntryIndex].amountPaid = amountPaid; // LƯU amountPaid từ request body
      studentToAdd.paymentStatus[existingPaymentEntryIndex].lastUpdated = new Date();
    } else {
      // Nếu chưa có, thêm một mục mới
      studentToAdd.paymentStatus.push({
        classId: classInstance._id, // classId ở đây là ObjectId của Class
        status: amountPaid >= classInstance.classFee ? 'paid' : (amountPaid > 0 ? 'partially_paid' : 'unpaid'), // Cập nhật status
        amountPaid: amountPaid, // LƯU amountPaid từ request body
        lastUpdated: new Date()
      });
    }
    await studentToAdd.save(); // LƯU THAY ĐỔI TRÊN HỌC SINH

    // Populate lại classInstance để trả về thông tin đầy đủ cho frontend
    // THAY ĐỔI CÁCH POPULATE ĐỂ THÊM amountPaid TỪ paymentStatus VÀO MỖI STUDENT
    await classInstance.populate({
      path: 'students_ids',
      select: 'name vnu_id email gender phone_number date_of_birth paymentStatus' // Cần populate paymentStatus
    });

    // Xử lý dữ liệu trả về cho frontend
    const studentsWithPaymentDetails = classInstance.students_ids.map(Student => {
      const paymentStatus = Student.paymentStatus || []; // fallback nếu không có
      const paymentInfo = paymentStatus.find(ps => ps.classId.toString() === classInstance._id.toString());

      return {
        ...Student.toObject(),
        amountPaid: paymentInfo ? paymentInfo.amountPaid : 0,
        paymentStatus: paymentInfo ? paymentInfo.status : 'unpaid'
      };
    });


    res.status(200).json(Configs.RES_FORM("Success", {
      message: "Đã thêm học sinh vào lớp thành công.",
      students_ids: studentsWithPaymentDetails // Trả về danh sách học sinh đã xử lý
    }));

  } catch (e) {
    console.error("Lỗi khi thêm học sinh vào lớp:", e);
    res.status(400).json(Configs.RES_FORM("Error", "ID học sinh không hợp lệ hoặc có lỗi xảy ra: " + e.message));
  }
}

// Hàm xóa học sinh khỏi lớp và cập nhật paymentStatus
async function fDeleteMemberInClass(req, res) {
  const { classId, memberId } = req.params; // memberId là _id của học sinh

  try {
    const classInstance = await global.DBConnection.Class.findById(classId);
    if (!classInstance) {
      return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy lớp học."));
    }

    // ... (kiểm tra quyền của người gửi yêu cầu)

    // 1. Xóa ObjectId của học sinh khỏi mảng students_ids của lớp
    const initialStudentsCount = classInstance.students_ids.length;
    classInstance.students_ids = classInstance.students_ids.filter(
      s => s.toString() !== memberId
    );

    if (classInstance.students_ids.length === initialStudentsCount) {
      return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy học sinh trong lớp hoặc ID không hợp lệ."));
    }

    await classInstance.save();

    // 2. Cập nhật paymentStatus trong UserSchema của học sinh: Xóa mục liên quan đến lớp này
    const Student = await global.DBConnection.Student.findById(memberId);
    if (Student && Student.role === 'Student') {
      Student.paymentStatus = Student.paymentStatus.filter(p => !p.classId.equals(classInstance._id));
      await Student.save();
    }

    // Populate lại classInstance để trả về thông tin đầy đủ cho frontend
    await classInstance.populate({
      path: 'students_ids',
      select: 'name vnu_id email gender phone_number date_of_birth paymentStatus' // Cần populate paymentStatus
    });

    res.status(200).json(Configs.RES_FORM("Success", {
      message: "Đã xóa học sinh khỏi lớp thành công.",
      students_ids: classInstance.students_ids
    }));

  } catch (e) {
    console.error("Lỗi khi xóa học sinh:", e);
    res.status(400).json(Configs.RES_FORM("Error", "ID học sinh không hợp lệ hoặc có lỗi xảy ra: " + e.message));
  }
}

module.exports = {
  fCreateClass,
  findClassByClassId,
  fFindClassByClassId,
  validateClassTeacher,
  validateClassMember,
  fGetMemberBasicInfors,
  fAddMembersToClass,
  fGetCurClasses,
  fDeleteMemberInClass,
  handleUploadMembers,
  fGetClassesByTeacher,
  fGetClassDetails,
  fGetStudentClasses,
  fGetClassesByAdmin,
  fEditClass,
  addSessionOverride,
  deleteSessionOverride,
  updateSessionOverride,
  fAddMemberToClass,
  fDeleteMemberInClass,
};