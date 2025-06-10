// ClassDetailInfo.jsx
import React from 'react';
import { Typography, Descriptions, Row, Col } from 'antd';
import moment from 'moment';
import NotificationArea from './NotificationArea';

const { Title, Paragraph } = Typography;

const translateDayOfWeek = (day) => {
    const dayMap = {
        'Monday': 'Thứ Hai',
        'Tuesday': 'Thứ Ba',
        'Wednesday': 'Thứ Tư',
        'Thursday': 'Thứ Năm',
        'Friday': 'Thứ Sáu',
        'Saturday': 'Thứ Bảy',
        'Sunday': 'Chủ Nhật'
    };
    return dayMap[day] || day;
};

function ClassDetailInfo({ classDetails, classId, notifications, userData, fetchNotifications, fetchWrapper }) {

    const schedule = classDetails?.schedule;
    const scheduleColumnConfig = {
        xs: 1, // 1 cột trên màn hình rất nhỏ
        sm: 2, // 2 cột trên màn hình nhỏ
        md: 2, // 2 cột trên màn hình vừa
        lg: 3, // 3 cột trên màn hình lớn
        xl: 3  // 3 cột trên màn hình rất lớn
    };

    const calculateRemainingFee = () => {
        if(userData.role !== 'Student' || !classDetails || !classDetails.students_ids) {
            return '';
        }

        const currentStudent = classDetails.students_ids.find(
            (student) => student._id === userData._id
        ); 
        if (currentStudent && currentStudent.paymentStatus) {
            const classPayment = currentStudent.paymentStatus.find(
                (payment) => payment.classId === classId
            );

            if (classPayment) {
                const totalClassFee = classDetails.classFee || 0;
                const amountPaid = classPayment.amountPaid || 0;
                const remainingFee = totalClassFee - amountPaid;
                return remainingFee.toLocaleString('vi-VN') + ' VNĐ';
            }
        }
        return classDetails.classFee.toLocaleString('vi-VN') + ' VNĐ';;
    };
    
    return (
        <div>
            <Title level={2} style={{fontWeight: 'bold'}}>{classDetails?.className}</Title>
            {/* Thông tin chung của lớp */}
            <Row justify="space-between" align="top" gutter={24}>
                <Col span={14}>
                    <div>
                        <p>
                            Khóa học: {classDetails.course_code?.course_name} - Mã khóa học:{' '}
                            {classDetails.course_code?.course_code}
                        </p>

                        <Title level={3}>Giáo viên chính</Title>
                        <Paragraph>{classDetails?.teacher_id?.name} - {classDetails?.teacher_id?.vnu_id} <br /> Số điện thoại: {classDetails?.teacher_id?.phone_number} </Paragraph>

                        <Title level={3}>Trợ giảng</Title>
                        {classDetails?.assistantTeachers_ids?.length > 0 ? (
                            <Paragraph style={{ whiteSpace: 'pre-line' }}>
                                {classDetails.assistantTeachers_ids.map(item => `${item.name} - ${item.vnu_id}\nSố điện thoại: ${item.phone_number}`).join(', ')}
                            </Paragraph>
                        ) : (
                            <Paragraph>Không có trợ giảng</Paragraph>
                        )}
                    </div>
                </Col>

                <Col span={10}>
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}>
                        <NotificationArea
                            classId={classId}
                            notifications={notifications}
                            userData={userData}
                            fetchNotifications={fetchNotifications}
                            fetchWrapper={fetchWrapper}
                        />
                    </div>
                </Col>
            </Row>


            {/* Thông tin lịch học - Sắp xếp theo chiều ngang */}
            {schedule && (
                <>
                    <Title level={3} style={{ marginTop: '20px' }}>Lịch học</Title>
                    <Descriptions bordered layout="horizontal" column={scheduleColumnConfig} size="small">
                        {schedule.startDate && (
                            <Descriptions.Item label="Ngày bắt đầu">
                                {moment(schedule.startDate).format('DD/MM/YYYY')}
                            </Descriptions.Item>
                        )}
                        {schedule.endDate && (
                            <Descriptions.Item label="Ngày kết thúc (dự kiến)">
                                {moment(schedule.endDate).format('DD/MM/YYYY')}
                            </Descriptions.Item>
                        )}
                        {schedule.daysOfWeek && schedule.daysOfWeek.length > 0 && (
                            <Descriptions.Item label="Thứ học">
                                {schedule.daysOfWeek.map(translateDayOfWeek).join(', ')}
                            </Descriptions.Item>
                        )}
                        {schedule.startTime && (
                            <Descriptions.Item label="Giờ học">
                                {schedule.startTime}
                            </Descriptions.Item>
                        )}
                        {schedule.sessionDuration !== undefined && schedule.sessionDuration !== null && (
                            <Descriptions.Item label="Thời lượng">
                                {schedule.sessionDuration} phút/buổi
                            </Descriptions.Item>
                        )}
                        {schedule.totalSessions !== undefined && schedule.totalSessions !== null && (
                            <Descriptions.Item label="Tổng số buổi">
                                {schedule.totalSessions}
                            </Descriptions.Item>
                        )}
                        {schedule.room && (
                            <Descriptions.Item label="Phòng học">
                                {schedule.room}
                            </Descriptions.Item>
                        )}
                        {classDetails.classFee && (
                            <Descriptions.Item label="Học phí">
                                {classDetails.classFee !== undefined ? Number(classDetails.classFee).toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}
                            </Descriptions.Item>
                        )}
                        {classDetails.classFee && (
                            <Descriptions.Item label="Học phí còn lại">
                                {calculateRemainingFee()}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </>
            )}
        </div>
    );
}

export default ClassDetailInfo;