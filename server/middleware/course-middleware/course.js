const { RES_FORM } = require("../../configs/Constants");

async function fCreateCourse(req, res) {
    let courseName = req.body.course_name;
    let courseCode = req.body.course_code;
    let description = req.body.description;
    let courseFee = req.body.course_fee;
    let duration = req.body.duration;
    try {
        let newCourse = global.DBConnection.Course({
            course_name: courseName,
            course_code: courseCode,
            description: description,
            course_fee: courseFee,
            duration: duration,
        })
        await newCourse.save();
        res.status(200);
        res.json(RES_FORM("Success", `Added ${courseCode} -> ${courseName} -> ${description} -> ${courseFee}`));
    } catch (e) {
        if (e.code == 11000) {
            res.status(400);
            res.json(RES_FORM("Error", "Course code or course name existed"));
        } else {
            res.status(400);
            res.json(RES_FORM("Error", "Unknown error. Maybe required field not found. Err message: " + e.toString()));
        }
    }
}

// --- Hàm lấy danh sách tất cả các khóa học ---
async function fGetCourses(req, res) {
    try {
        const courses = await global.DBConnection.Course.find({});
        res.status(200);
        res.json(RES_FORM("Success", "Successfully retrieved all courses.", courses));
    } catch (e) {
        console.error("Error in fGetCourses:", e);
        res.status(500);
        res.json(RES_FORM("Error", "Unknown error retrieving courses. Err message: " + e.toString()));
    }
}

// --- Hàm sửa thông tin một khóa học (dựa vào course_code) ---
async function fEditCourse(req, res) {
    const courseCodeToUpdate = req.params.courseID; // Lấy course_code từ URL params
    const { course_name, description, course_fee, duration, course_code: new_course_code } = req.body; // Lấy dữ liệu mới từ body

    // Kiểm tra xem có dữ liệu để cập nhật không
    if (!course_name && !description && duration === undefined && course_fee === undefined && !new_course_code) {
        res.status(400);
        return res.json(RES_FORM("Error", "No update data provided."));
    }

    try {
        // Tạo đối tượng chứa các trường cần cập nhật
        let updateData = {};
        if (course_name) updateData.course_name = course_name;
        if (description) updateData.description = description;
        if (course_fee !== undefined) updateData.course_fee = course_fee;
        if (duration !== undefined) updateData.duration = duration;
        if (new_course_code) updateData.course_code = new_course_code; // Cho phép cập nhật cả course_code

        const updatedCourse = await global.DBConnection.Course.findOneAndUpdate(
            { _id: courseCodeToUpdate }, // Điều kiện tìm kiếm
            { $set: updateData }, // Dữ liệu cập nhật
            { new: true, runValidators: true } // Tùy chọn: trả về bản ghi đã cập nhật và chạy validators
        );

        if (!updatedCourse) {
            res.status(404); // 404 Not Found
            return res.json(RES_FORM("Error", `Course with code '${courseCodeToUpdate}' not found.`));
        }

        res.status(200);
        res.json(RES_FORM("Success", `Course '${courseCodeToUpdate}' updated successfully.`, updatedCourse));
    } catch (e) {
        if (e.code == 11000) { // Lỗi trùng lặp unique key (nếu course_code mới bị trùng)
            res.status(409);
            res.json(RES_FORM("Error", "New course code or course name already exists."));
        } else if (e.name === 'ValidationError') { // Xử lý lỗi validation từ Mongoose
            res.status(400);
            const messages = Object.values(e.errors).map(val => val.message);
            res.json(RES_FORM("Error", "Validation Error: " + messages.join(', ')));
        } else {
            console.error("Error in fEditCourse:", e);
            res.status(500);
            res.json(RES_FORM("Error", `Unknown error updating course '${courseCodeToUpdate}'. Err message: ` + e.toString()));
        }
    }
}

// --- Hàm xóa một khóa học (dựa vào course_code) ---
async function fDeleteCourse(req, res) {
    const courseCodeToDelete = req.params.courseID;

    try {
        const deletedCourse = await global.DBConnection.Course.findOneAndDelete({ _id: courseCodeToDelete });

        if (!deletedCourse) {
            res.status(404); // 404 Not Found
            return res.json(RES_FORM("Error", `Course with code '${courseCodeToDelete}' not found.`));
        }

        res.status(200);
        // Hoặc 204 No Content nếu không muốn trả về nội dung gì
        // res.status(204).send();
        res.json(RES_FORM("Success", `Course '${courseCodeToDelete}' deleted successfully.`, deletedCourse));
    } catch (e) {
        console.error("Error in fDeleteCourse:", e);
        res.status(500);
        res.json(RES_FORM("Error", `Unknown error deleting course '${courseCodeToDelete}'. Err message: ` + e.toString()));
    }
}

module.exports = {
    fCreateCourse,
    fGetCourses,
    fEditCourse,
    fDeleteCourse
};