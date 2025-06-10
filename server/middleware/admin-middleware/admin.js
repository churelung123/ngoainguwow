const Configs = require('./../../configs/Constants')
const jwt = require('jsonwebtoken');
const hash = require('sha256')
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId

/** Tiên quyết: validateToken  có senderInstance*/
function validateAdmin(req, res, next) {
    if (req.senderInstance.role ==  'admin') next();
    else {
        console.log('Error', req.senderInstance.role);
        res.status(400);
        res.json(Configs.RES_FORM("Error", "Bạn không phải là admin"))
    }
}

async function fGetAllUserInfo(req, res) {
    var users = await global.DBConnection.User.find({});
    res.status(200);
    res.json(Configs.RES_FORM("Success", users));
}

async function fGetAllStudents(req, res) {
    try {
        const students = await global.DBConnection.Student.find({ role: 'Student' })
                                        .select('name vnu_id email gender phone_number'); // Chỉ lấy các trường cần thiết

        if (!students || students.length === 0) {
            return res.status(200).json(Configs.RES_FORM("Success", { users: [] })); // Trả về mảng rỗng nếu không có
        }

        res.status(200).json(Configs.RES_FORM("Success", { users: students }));
    } catch (e) {
        console.error("Lỗi khi lấy danh sách học sinh:", e);
        res.status(400).json(Configs.RES_FORM("Error", "Có lỗi xảy ra khi tải danh sách học sinh: " + e.message));
    }
}

module.exports = {validateAdmin, fGetAllUserInfo, fGetAllStudents};