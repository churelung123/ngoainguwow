const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubjectSchema = new Schema({
    subject_name : {
        type: String,
        unique: true,
        required: true
    },
    subject_code: {
        type: String,
        unique: true,
        required: true
    },
    credits_number: {
        type: Number,
        min : 1,
        required: true
    }
})

module.exports = SubjectSchema