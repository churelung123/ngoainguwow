const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const hash = require("sha256");
const Configs = require('../../../configs/Constants');

function toLower(v) {
    return v.toLowerCase();
}

const UserSchema = new Schema({
    name: { type: String },
    role: {
        type: String,
        enum: {
            values: ['Student', 'teacher', 'admin'],
            message: 'Role {VALUE} is not supported'
        },
        require: true
    },
    gender: {
        type: String,
        enum: {
            values: ['male', 'female'],
            message: 'Gender {VALUE} is not supported'
        },
        require: true
    },
    phone_number: { type: String, required: false, default: "Chưa có số điện thoại" },
    parent_number: { type: String, required: false, default: "Chưa có số điện thoại phụ huynh" },
    location: { type: String, default: "Rach Gia" },
    date_of_birth: { type: Number, default: Date.now() },
    email: { type: String, set: toLower },
    vnu_id: { type: String, index: { unique: true }, dropDups: true },
    username: { type: String, default: null },
    password: { type: String, default: null, set: hash },
}, { discriminatorKey: 'role' });

const TeacherSchema = new Schema({
    teachingClasses: [{ type: String, ref: Configs.DB_SCHEMA.CLASS, foreignField: 'classId', localField: 'teachingClasses' }],
    assistantTeachingClasses: [{ type: String, ref: Configs.DB_SCHEMA.CLASS, foreignField: 'classId', localField: 'assistantTeachingClasses' }]
});

const StudentSchema = new Schema({
    paymentStatus: [{
        classId: { type: Schema.Types.ObjectId, ref: Configs.DB_SCHEMA.CLASS, required: true },
        status: {
            type: String,
            enum: {
                values: ['unpaid', 'partially_paid', 'paid'],
                message: 'Payment status {VALUE} is not supported'
            },
            default: 'unpaid'
        },
        amountPaid: { type: Number, default: 0 }, // Thêm trường này
        lastUpdated: { type: Date, default: Date.now }
    }]
});

const AdminSchema = new Schema({});

module.exports = {UserSchema, AdminSchema, TeacherSchema, StudentSchema};