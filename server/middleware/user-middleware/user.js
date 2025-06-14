const Configs = require('../../configs/Constants');
const userSchema = require('../../module/DBModule/Schemas/UserSchema');
const hash = require('sha256')

function getProfileById(req, res) {
    if (req.params.profileId == "me") {
        var final = req.senderInstance;
        res.status(200);
        res.json(Configs.RES_FORM("Success",final))
        return;
    } 
    global.DBConnection.User.findOne({"vnu_id": req.params.profileId}).lean().exec((err, instance) => {
        if (err) {
            res.status(400)
            res.json(Configs.RES_FORM("Internal Error", err.toString()))
        }
        if (instance) {
            res.status(200);
            res.json(instance)
        } else {
            res.status(404);
            res.json(Configs.RES_FORM("NotFound", "User not found"))

        }
    })
}

function validateEditProfileArgument(req, res, next) {
    // let user = new global.DBConnection.User(req.body);
    // let err = user.validateSync();
     //ignore role when edit profile
    // delete err.errors['role'];
    // res.json(JSON.stringify(err.errors));
    // console.log(req.password + " 123456789");
    // console.log(req.username + " 123456789");
    // console.log(req.body.password + " 123456789");
    // console.log(req.body.username + " 123456789");
    next();
}

async function editProfileById(req, res) {
    var old_password = req.body.old_password
    var new_password = req.body.new_password
    var senderLoginInfor;
    if (req.body.new_password && req.body.old_password) {
        senderLoginInfor = await global.DBConnection.LoginInfo.findOne({user_ref : req.senderInstance._id})
        if (new_password.length < 8) {
            res.status(400);
            res.json(Configs.RES_FORM("Error", "Password mới chưa đủ độ dài (8 ký tự)"));
            return;
        }
        if (hash(old_password) != senderLoginInfor.password) {
            res.status(400);
            res.json(Configs.RES_FORM("Error", "Password cũ và mới không trùng nhau"));
            return
        }
        senderLoginInfor.password = new_password;
        await senderLoginInfor.save()
    }
    if (req.params.profileId == "me"){
        req.params.profileId = req.senderVNUId;
        try {
            // var final = await global.DBConnection.User.updateOne({_id :req.senderInstance._id},req.body, {new: true, runValidators: true,context: 'query'})
            await req.senderInstance.$set(req.body);
            var final = await req.senderInstance.save();
            res.status(200);
            res.json(Configs.RES_FORM("Success",final));
            return;
        } catch(e) {
            console.log("Co loi xay ra khi update profile");
            res.status(400);
            res.json(Configs.RES_FORM("Error",JSON.stringify(e)));
            return;
        }
    }
    global.DBConnection.User.findOneAndUpdate({"vnu_id": req.params.profileId}, req.body, {new: true, runValidators: true,
        context: 'query'}).exec((err, instance) => {
        if (err) {
            res.status(400);
            res.json(Configs.RES_FORM("Internal Error", err.toString()))
            return;
        }
        if (instance) {
            res.status(200);
            res.json(Configs.RES_FORM("Success", instance))
            return;
        } else {
            res.status(404);
            res.json(Configs.RES_FORM("NotFound", "User not found"))
            return;
        }
    })
}

async function getAllStudentsWithTuition(req, res) {
    try {
        const students = await global.DBConnection.User.find({ role: 'Student' })
            .populate({
                path: 'paymentStatus.classId', // Populate trường classId trong paymentStatus
                model: Configs.DB_SCHEMA.CLASS, // Model để populate là Class
                select: 'className classFee' // Chỉ lấy className và classFee của lớp
            })
            .lean() // Trả về plain JavaScript objects thay vì Mongoose documents
            .exec();

        // Xử lý dữ liệu để trả về định dạng mong muốn cho frontend
        const formattedStudents = students.map(student => {
            // Đảm bảo paymentStatus là một mảng
            const paymentStatuses = Array.isArray(student.paymentStatus) ? student.paymentStatus : [];

            // Để đơn giản, nếu học sinh có nhiều lớp, chúng ta sẽ hiển thị trạng thái của lớp đầu tiên
            // Hoặc bạn có thể sửa đổi frontend để hiển thị nhiều dòng cho mỗi lớp
            const firstPayment = paymentStatuses.length > 0 ? paymentStatuses[0] : null;

            let amountPaid = 0;
            let totalClassFee = 0;
            let paymentStatusText = 'Chưa có thông tin';

            if (firstPayment && firstPayment.classId) {
                amountPaid = firstPayment.amountPaid || 0;
                totalClassFee = firstPayment.classId.classFee || 0; // Lấy classFee từ thông tin lớp đã populate

                if (amountPaid >= totalClassFee && totalClassFee > 0) {
                    paymentStatusText = 'paid';
                } else if (amountPaid > 0 && amountPaid < totalClassFee) {
                    paymentStatusText = 'partially_paid';
                } else {
                    paymentStatusText = 'unpaid';
                }
            } else if (firstPayment && !firstPayment.classId) {
                // Trường hợp classId không được populate (có thể do lỗi hoặc lớp đã bị xóa)
                amountPaid = firstPayment.amountPaid || 0;
                totalClassFee = 0; // Không xác định tổng học phí
                paymentStatusText = amountPaid > 0 ? 'partially_paid' : 'unpaid';
            }


            return {
                _id: student._id,
                vnu_id: student.vnu_id,
                name: student.name,
                email: student.email,
                phone_number: student.phone_number,
                gender: student.gender,
                date_of_birth: student.date_of_birth,
                role: student.role,
                // Trả về một mảng paymentStatus đã được populate để frontend có thể xử lý
                paymentStatus: student.paymentStatus.map(p => ({
                    classId: p.classId ? p.classId._id : null, // Gửi lại _id của lớp
                    className: p.classId ? p.classId.className : 'Lớp không tồn tại',
                    classFee: p.classId ? p.classId.classFee : 0,
                    status: p.status, // Giữ nguyên trạng thái từ DB
                    amountPaid: p.amountPaid
                })),
                // Để tương thích với hiển thị đơn giản hiện tại, trả về trạng thái của lớp đầu tiên
                // Bạn có thể cần điều chỉnh lại `TuitionManagementPage.jsx` để xử lý mảng `paymentStatus`
                currentAmountPaid: amountPaid,
                currentTotalClassFee: totalClassFee,
                currentPaymentStatus: paymentStatusText
            };
        });

        res.status(200).json(Configs.RES_FORM("Success", formattedStudents));
    } catch (error) {
        console.error("Lỗi khi lấy danh sách học sinh với học phí:", error);
        res.status(500).json(Configs.RES_FORM("Error", "Có lỗi xảy ra khi lấy dữ liệu học sinh: " + error.message));
    }
}

async function updateStudentTuition(req, res) {
    const { studentId, classId, amountPaid } = req.body; // classId là bắt buộc để xác định paymentStatus nào
    
    if (!studentId || !classId || typeof amountPaid !== 'number' || amountPaid < 0) {
        return res.status(400).json(Configs.RES_FORM("Error", "Dữ liệu đầu vào không hợp lệ (studentId, classId, amountPaid là bắt buộc và amountPaid phải là số không âm)."));
    }

    try {
        const student = await global.DBConnection.User.findById(studentId); // Find bằng User, sau đó kiểm tra role
        if (!student || student.role !== 'Student') {
            return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy học sinh hoặc người dùng không phải là học sinh."));
        }

        const classDetails = await global.DBConnection.Class.findById(classId);
        if (!classDetails) {
            return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy thông tin lớp học."));
        }

        // Tìm hoặc tạo paymentStatus entry cho lớp học này
        let paymentEntry = student.paymentStatus.find(p => p.classId && p.classId.equals(classId));

        if (paymentEntry) {
            paymentEntry.amountPaid = amountPaid;
        } else {
            // Nếu không tìm thấy paymentStatus cho lớp đó, thêm mới
            paymentEntry = {
                classId: classId,
                amountPaid: amountPaid,
                status: 'unpaid' // Trạng thái mặc định khi thêm mới
            };
            student.paymentStatus.push(paymentEntry);
        }

        // Cập nhật trạng thái dựa trên tổng học phí của lớp
        const totalClassFee = classDetails.classFee || 0;
        if (amountPaid >= totalClassFee && totalClassFee > 0) {
            paymentEntry.status = 'paid';
        } else if (amountPaid > 0 && amountPaid < totalClassFee) {
            paymentEntry.status = 'partially_paid';
        } else {
            paymentEntry.status = 'unpaid';
        }

        await student.save();

        res.status(200).json(Configs.RES_FORM("Success", "Cập nhật học phí thành công."));

    } catch (error) {
        console.error("Lỗi khi cập nhật học phí:", error);
        res.status(500).json(Configs.RES_FORM("Error", "Có lỗi xảy ra khi cập nhật học phí: " + error.message));
    }
}

module.exports = {
    getProfileById,
    validateEditProfileArgument,
    editProfileById,
    getAllStudentsWithTuition,
    updateStudentTuition
};