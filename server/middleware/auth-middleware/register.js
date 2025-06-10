const { v4: uuidv4 } = require('uuid');
const Configs = require('./../../configs/Constants');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const hash = require('sha256'); // Đảm bảo thư viện sha256 đã được cài đặt và import.

async function getNextVNUIdSequence(prefix) {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    const idPrefix = prefix + yearSuffix;

    // Tìm VNU ID lớn nhất hiện có với prefix và năm tương ứng
    const latestUser = await global.DBConnection.User.findOne(
        { vnu_id: { $regex: `^${idPrefix}\\d{4}$` } }, // Tìm VNU ID có dạng GVYYNNNN hoặc HSYYNNNN
        {},
        { sort: { vnu_id: -1 } } // Sắp xếp giảm dần để lấy cái lớn nhất
    );

    let nextSequence = 1;
    if (latestUser && latestUser.vnu_id) {
        const lastSequenceStr = latestUser.vnu_id.slice(-4); // Lấy 4 ký tự cuối (số thứ tự)
        const lastSequence = parseInt(lastSequenceStr);
        if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
        }
    }
    // Định dạng số thứ tự thành 4 chữ số, ví dụ: 0001, 0002
    return idPrefix + String(nextSequence).padStart(4, '0');
}

// Hàm chuyển đổi tiếng Việt có dấu thành không dấu và loại bỏ ký tự đặc biệt
function slugify(text) {
    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '') // Thay khoảng trắng bằng rỗng
        .replace(/[^\w-]+/g, ''); // Loại bỏ ký tự không phải chữ, số, gạch ngang
}

// Hàm tạo mật khẩu ngẫu nhiên an toàn
function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

async function register(req, res) {
    const { name, role, gender, phone_number, email, location, date_of_birth, parent_number } = req.body;

    // Tự động tạo VNU ID
    let newVNUId;
    if (role === 'teacher') {
        newVNUId = await getNextVNUIdSequence('GV');
    } else if (role === 'Student') {
        newVNUId = await getNextVNUIdSequence('HS');
    } else {
        newVNUId = uuidv4(); // Hoặc một logic khác cho admin
    }

    // Tự động tạo Username từ tên
    let baseUsername = slugify(name);
    let newUsername = baseUsername;
    let usernameCounter = 1;
    let dupUsername = await global.DBConnection.User.findOne({ "username": newUsername });
    while (dupUsername) {
        newUsername = `${baseUsername}${usernameCounter}`;
        usernameCounter++;
        dupUsername = await global.DBConnection.User.findOne({ "username": newUsername });
    }

    // Tự động tạo mật khẩu ngẫu nhiên
    const newPassword = generateRandomPassword();
    const hashedPassword = hash(newPassword); // Mật khẩu sẽ được hash ở đây

    // Kiểm tra VNU ID và Username sau khi đã tự động tạo
    // (Mặc dù đã có logic tạo duy nhất, nhưng kiểm tra lại để an toàn)
    let finalDupVNUId = await global.DBConnection.User.findOne({ "vnu_id": newVNUId });
    let finalDupUsername = await global.DBConnection.User.findOne({ "username": newUsername });

    if (finalDupVNUId || finalDupUsername) {
        // Trường hợp này hiếm khi xảy ra nếu logic tạo ID/username tốt,
        // nhưng vẫn giữ để bắt lỗi trùng lặp bất ngờ.
        res.status(409);
        res.json(Configs.RES_FORM("Error", "Failed to generate unique VNU-ID or Username. Please try again or contact support."));
        return;
    }

    try {
        let newUser;
        if (role === 'Student') {
            newUser = new global.DBConnection.Student({
                vnu_id: newVNUId,
                name,
                gender,
                phone_number,
                parent_number,
                email,
                location,
                date_of_birth,
                username: newUsername,
                password: hashedPassword,
                paymentStatus: [] // bạn có thể khởi tạo rỗng hoặc thêm lớp học cụ thể
            });
        } else if (role === 'teacher') {
            newUser = new global.DBConnection.Teacher({
                vnu_id: newVNUId,
                name,
                gender,
                phone_number,
                email,
                location,
                date_of_birth,
                username: newUsername,
                password: hashedPassword
            });
        } else {
            newUser = new global.DBConnection.User({
                vnu_id: newVNUId,
                name,
                gender,
                phone_number,
                role,
                email,
                location,
                date_of_birth,
                username: newUsername,
                password: hashedPassword
            });
        }
        const savedUser = await newUser.save();

        // Tạo token với thông tin vnu_id và ngày tạo
        const newToken = jwt.sign({ vnu_id: savedUser.vnu_id, createdDate: new Date().getTime() }, Configs.SECRET_KEY, { expiresIn: 3600 });

        const loginInfo = new global.DBConnection.LoginInfo({
            user_ref: new ObjectId(savedUser._id),
            username: newUsername, // Lưu username đã tạo tự động
            password: hashedPassword, // Lưu mật khẩu đã băm
            current_token: newToken,
            current_socket_id: null,
        });
        await loginInfo.save();

        // Cập nhật thông tin lớp học cho giáo viên/học sinh nếu có
        if (role === 'teacher') {
            const validTeachingClasses = await global.DBConnection.Class.find({ classId: { $in: req.body.teachingClasses || [] } }).distinct('_id');
            const validAssistantTeachingClasses = await global.DBConnection.Class.find({ classId: { $in: req.body.assistantTeachingClasses || [] } }).distinct('_id');
            await global.DBConnection.User.findByIdAndUpdate(savedUser._id, {
                teachingClasses: validTeachingClasses,
                assistantTeachingClasses: validAssistantTeachingClasses
            });
        } else if (role === 'Student') {
            const validEnrolledClasses = await global.DBConnection.Class.find({ classId: { $in: req.body.enrolledClasses || [] } }).distinct('_id');
            const validCompletedClasses = await global.DBConnection.Class.find({ classId: { $in: req.body.completedClasses || [] } }).distinct('_id');
            await global.DBConnection.User.findByIdAndUpdate(savedUser._id, {
                enrolledClasses: validEnrolledClasses,
                completedClasses: validCompletedClasses,
            });
        }

        // Trả về thông tin người dùng vừa tạo (không bao gồm password)
        res.status(200);
        res.json(Configs.RES_FORM("Success", {
            user: {
                _id: savedUser._id,
                vnu_id: savedUser.vnu_id,
                name: savedUser.name,
                gender: savedUser.gender,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role,
                date_of_birth: newUser.date_of_birth,
                location: newUser.location,
                phone_number: newUser.phone_number,
                parent_number: newUser.parent_number,
                // Thêm các trường khác nếu bạn muốn trả về
            },
            token: loginInfo.current_token,
            // Bạn có thể trả về mật khẩu ngẫu nhiên TẠM THỜI ở đây để người dùng biết
            // nhưng CẨN THẬN vì đây là thông tin nhạy cảm.
            // Trong thực tế, bạn sẽ gửi mật khẩu này qua email hoặc thông báo an toàn.
            generatedPassword: newPassword // Cân nhắc kỹ trước khi trả về mật khẩu trực tiếp
        }));

    } catch (e) {
        console.error("Lỗi khi đăng ký người dùng:", e);
        res.status(400);
        let errorMessage = "Đăng ký người dùng thất bại.";
        if (e.code === 11000) { // Lỗi duplicate key từ MongoDB
            if (e.keyPattern.vnu_id) {
                errorMessage = "VNU ID đã tồn tại. Vui lòng sử dụng VNU ID khác.";
            } else if (e.keyPattern.username) {
                errorMessage = "Tên đăng nhập đã tồn tại. Vui lòng sử dụng tên đăng nhập khác.";
            } else if (e.keyPattern.email) {
                errorMessage = "Email đã tồn tại. Vui lòng sử dụng email khác.";
            }
        } else {
            errorMessage = e.message;
        }
        res.json(Configs.RES_FORM("Error", errorMessage));
        return;
    }
}

async function editUser(req, res) {
    const userId = req.params.id; // Lấy ID của người dùng từ URL params
    const updates = req.body; // Lấy các trường cần cập nhật từ body request

    try {
        // Kiểm tra xem người dùng có tồn tại không
        const user = await global.DBConnection.User.findById(userId);
        if (!user) {
            res.status(404);
            return res.json(Configs.RES_FORM("Error", "Người dùng không tồn tại."));
        }

        // Cập nhật thông tin người dùng
        // Lưu ý: vnu_id và username thường không cho phép sửa đổi sau khi tạo
        // Nếu có trường password trong updates và nó không rỗng, hash nó
        if (updates.password && updates.password.trim() !== '') {
            updates.password = hash(updates.password);
        } else {
            // Nếu password rỗng hoặc không được gửi, xóa khỏi updates để không ghi đè password cũ
            delete updates.password;
        }

        // Cập nhật các trường thông thường
        Object.assign(user, updates);

        // Lưu user đã cập nhật
        const updatedUser = await user.save();

        // Cập nhật thông tin trong LoginInfo nếu username hoặc password thay đổi
        // Lưu ý: username không nên thay đổi, nhưng nếu bạn cho phép, cần cập nhật LoginInfo
        if (updates.username || (updates.password && updates.password.trim() !== '')) {
            const loginInfo = await global.DBConnection.LoginInfo.findOne({ user_ref: new ObjectId(userId) });
            if (loginInfo) {
                if (updates.username) loginInfo.username = updates.username;
                if (updates.password && updates.password.trim() !== '') loginInfo.password = updates.password; // Đã hash ở trên
                await loginInfo.save();
            }
        }


        res.status(200);
        res.json(Configs.RES_FORM("Success", "Cập nhật người dùng thành công.", updatedUser)); // Trả về user đã cập nhật
    } catch (e) {
        // Xử lý lỗi trùng lặp (ví dụ: email, vnu_id nếu schema của bạn có unique index cho email)
        if (e.code === 11000) { // Mã lỗi duplicate key từ MongoDB
            let field = Object.keys(e.keyValue)[0];
            let value = e.keyValue[field];
            if (field === 'vnu_id') {
                res.status(409);
                return res.json(Configs.RES_FORM("Error", `VNU ID '${value}' đã tồn tại.`));
            } else if (field === 'email') {
                res.status(409);
                return res.json(Configs.RES_FORM("Error", `Email '${value}' đã tồn tại.`));
            } else if (field === 'username') {
                res.status(409);
                return res.json(Configs.RES_FORM("Error", `Tên đăng nhập '${value}' đã tồn tại.`));
            }
        }
        console.error("Lỗi khi cập nhật người dùng:", e);
        res.status(400);
        res.json(Configs.RES_FORM("Error", e.message || "Lỗi khi cập nhật người dùng."));
    }
}

async function deleteUser(req, res) {
    const userId = req.params.id; // Lấy ID của người dùng từ URL params

    try {
        // Xóa người dùng từ User collection
        const deletedUser = await global.DBConnection.User.findByIdAndDelete(userId);
        if (!deletedUser) {
            res.status(404);
            return res.json(Configs.RES_FORM("Error", "Người dùng không tồn tại."));
        }

        // Xóa thông tin đăng nhập liên quan
        await global.DBConnection.LoginInfo.deleteOne({ user_ref: new ObjectId(userId) });

        res.status(200);
        res.json(Configs.RES_FORM("Success", "Xóa người dùng thành công."));
    } catch (e) {
        console.error("Lỗi khi xóa người dùng:", e);
        res.status(400);
        res.json(Configs.RES_FORM("Error", e.message || "Lỗi khi xóa người dùng."));
    }
}


module.exports = { register, editUser, deleteUser };