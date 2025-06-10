import { useRecoilState } from 'recoil';
import React ,{useEffect } from 'react';
import { UploadForm } from './UploadForm';
import { Row, Col } from 'antd';

export { DBPortal };

var upload_form_course = [
  { title: 'Tên khóa học', dataIndex: 'courseName', key: 'courseName' },
  { title: 'Mã khóa học', dataIndex: 'courseCode', key: 'courseCode' },
  { title: 'Mô tả', dataIndex: 'description', key: 'description' },
  { title: 'Lỗi', dataIndex: 'error', key: 'error' },
];

var upload_form_classes = [
  {
    title: 'Mã khóa học',
    dataIndex: 'course', // Tham chiếu đến _id của Course
    key: 'course',
  },
  {
    title: 'Tên lớp',
    dataIndex: 'className',
    key: 'className',
  },
  {
    title: 'Giáo viên',
    dataIndex: 'teacher', // Tham chiếu đến _id của User (role teacher)
    key: 'teacher',
  },
  {
    title: 'Trợ giảng',
    dataIndex: 'assistantTeachers', // Mảng các _id của User (role teacher), có thể để trống
    key: 'assistantTeachers',
  },
  {
    title: 'Học sinh',
    dataIndex: 'students', // Mảng các _id của User (role Student), có thể để trống
    key: 'students',
  },
  {
    title: 'Ngày học',
    dataIndex: 'schedule_dayOfWeek',
    key: 'schedule_dayOfWeek',
  },
  {
    title: 'Giờ bắt đầu',
    dataIndex: 'schedule_startTime',
    key: 'schedule_startTime',
  },
  {
    title: 'Giờ kết thúc',
    dataIndex: 'schedule_endTime',
    key: 'schedule_endTime',
  },
  {
    title: 'Phòng học',
    dataIndex: 'schedule_room',
    key: 'schedule_room',
  },
  {
    title: 'Bài kiểm tra',
    dataIndex: 'tests', // Mảng các _id của TestLesson, có thể để trống
    key: 'tests',
  },
  {
    title: 'Lỗi',
    dataIndex: 'error',
    key: 'error',
  },
];

var upload_form_teacher = [
  { title: 'Tên', dataIndex: 'name', key: 'name' },
  { title: 'Vai trò', dataIndex: 'role', key: 'role' },
  { title: 'Giới tính', dataIndex: 'gender', key: 'gender' },
  { title: 'Số điện thoại', dataIndex: 'phone_number', key: 'phone_number' },
  { title: 'Quê quán', dataIndex: 'location', key: 'location' },
  { title: 'Ngày sinh', dataIndex: 'date_of_birth', key: 'date_of_birth' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'VNU-ID', dataIndex: 'vnu_id', key: 'vnu_id' },
  { title: 'Username', dataIndex: 'username', key: 'username' },
  { title: 'Password', dataIndex: 'password', key: 'password' },
  { title: 'Lớp đang dạy', dataIndex: 'teachingClasses', key: 'teachingClasses' }, // Mảng ObjectId, có thể nhập bằng dấu phẩy
  { title: 'Lớp trợ giảng', dataIndex: 'assistantTeachingClasses', key: 'assistantTeachingClasses' }, // Mảng ObjectId, có thể nhập bằng dấu phẩy
  { title: 'Lỗi', dataIndex: 'error', key: 'error' },
];

  var upload_form_student = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role' },
    { title: 'Giới tính', dataIndex: 'gender', key: 'gender' },
    { title: 'Số điện thoại', dataIndex: 'phone_number', key: 'phone_number' },
    { title: 'Số điện thoại phụ huynh', dataIndex: 'parent_number', key: 'parent_number' },
    { title: 'Quê quán', dataIndex: 'location', key: 'location' },
    { title: 'Ngày sinh', dataIndex: 'date_of_birth', key: 'date_of_birth' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'VNU-ID', dataIndex: 'vnu_id', key: 'vnu_id' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Password', dataIndex: 'password', key: 'password' },
    { title: 'Lớp đang học', dataIndex: 'enrolledClasses', key: 'enrolledClasses' }, // Mảng ObjectId, có thể nhập bằng dấu phẩy
    { title: 'Lớp đã học', dataIndex: 'completedClasses', key: 'completedClasses' }, // Mảng ObjectId, có thể nhập bằng dấu phẩy
    { title: 'Điểm số', dataIndex: 'testScores', key: 'testScores' }, // Mảng object { testLesson, score }, có thể nhập dạng JSON
    { title: 'Lỗi', dataIndex: 'error', key: 'error' },
  ];

function DBPortal() {
    return (
        <div className="p-4" style = {{overflow : "auto"}}>
            <h3> Quản lý cơ sở dữ liệu</h3>
            <i> Nơi tải lên dữ liệu Học sinh, Giáo viên </i>
            <br/>
            <br/>

            <Row>
            <Col flex="300px">
                <h4> Danh sách giáo viên </h4>
                <i> Tải danh sách tài khoản và thông tin Giáo viên lên hệ thống. </i>
                <br/><br/> <UploadForm columns={upload_form_teacher} formurl="http://localhost:3000/api/upload/dscv"/> <br/>
            </Col>
            <Col flex="300px">
                <h4> Danh sách học sinh </h4>
                <i> Tải danh sách tài khoản và thông tin học sinh lên hệ thống.</i>
                <br/><br/> <UploadForm columns={upload_form_student} formurl="http://localhost:3000/api/upload/dssv"/> <br/>
                <br/>
            </Col>
            <Col flex="300px">
                <h4> Danh sách khóa học </h4>
                <i> Tải danh sách môn học lên hệ thống.</i>
                <br/><br/><UploadForm columns={upload_form_course} formurl="http://localhost:3000/api/admin/addcourse"/> <br/>
                <br/>
            </Col>
            <Col flex="auto"></Col>
            </Row>
            <Col flex="300px">
                <h4> Danh sách lớp học </h4>
                <i> Tải danh sách lớp học lên hệ thống.</i>
                <br/><br/><UploadForm columns={upload_form_classes} formurl="http://localhost:3000/api/admin/addclass"/>
            </Col>
            <br/>
            <br/>
            <Row>
            <Col flex="auto"></Col>
            </Row>

           
        </div>
    )
}