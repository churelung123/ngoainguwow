import React, { useState, useEffect } from 'react';
import { Typography, Input, Button, Space, Avatar, Row, Col, message } from 'antd';
import { NotificationOutlined, DotChartOutlined } from '@ant-design/icons';
import moment from 'moment';

const { TextArea } = Input;
const { Title } = Typography;

function NotificationArea({ classId, notifications, userData, fetchNotifications, fetchWrapper }) {
    const [newNotificationContent, setNewNotificationContent] = useState('');
    const [isCreatingNotification, setIsCreatingNotification] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Tính số thông báo chưa đọc khi notifications hoặc userData thay đổi
        if (userData?.role === 'Student' && notifications) {
            const count = notifications.filter(item => !item.isReadBy.includes(userData._id)).length;
            setUnreadCount(count);
        } else {
            setUnreadCount(0); // Nếu không phải Student hoặc không có thông báo, set về 0
        }
    }, [notifications, userData]);

    const handleCreateNotification = async () => {
        if (!newNotificationContent.trim()) {
            message.warning('Vui lòng nhập nội dung thông báo.');
            return;
        }

        setIsCreatingNotification(true);
        try {
            const response = await fetchWrapper.post(
                `/api/classes/${classId}/notifications`,
                'application/json',
                {
                    content: newNotificationContent,
                    classId: classId,
                }
            );
            const data = await response.json();
            if (data.status === 'Success') {
                message.success('Tạo thông báo thành công.');
                setNewNotificationContent('');
                fetchNotifications(); // Làm mới danh sách thông báo
            } else {
                message.error('Có lỗi xảy ra khi tạo thông báo.');
            }
        } catch (error) {
            console.error('Lỗi khi tạo thông báo:', error);
            message.error('Có lỗi xảy ra khi tạo thông báo.');
        } finally {
            setIsCreatingNotification(false);
        }
    };

    const handleNotificationRead = async (notificationId) => {
        try {
            await fetchWrapper.put(`/api/classes/${classId}/notifications/${notificationId}/read`);
            // Cập nhật cục bộ trạng thái đọc (tùy chọn, để tối ưu hiệu suất)
            const updatedNotifications = notifications.map(notification =>
                notification._id === notificationId ? { ...notification, isReadBy: [...notification.isReadBy, userData._id] } : notification
            );
            // setNotifications(updatedNotifications);
            fetchNotifications();
        } catch (error) {
            console.error('Lỗi khi đánh dấu thông báo là đã đọc:', error);
        }
    };

    return (
        <div style={{ maxWidth: '500px', width: '100%' }}>
            <Title level={4} style={{ display: 'flex', alignItems: 'center' }}>
                Thông báo lớp học
                {unreadCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', color: '#1890ff' }}>
                        <NotificationOutlined style={{ marginRight: '4px' }} />
                        <span>({unreadCount})</span>
                    </div>
                )}
            </Title>
            {userData?.role === 'teacher' || userData?.role === 'admin' ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <TextArea
                        rows={2}
                        placeholder="Nhập nội dung thông báo..."
                        value={newNotificationContent}
                        onChange={(e) => setNewNotificationContent(e.target.value)}
                    />
                    <Button
                        type="primary"
                        onClick={handleCreateNotification}
                        loading={isCreatingNotification}
                        style={{ borderRadius: '8px', marginBottom: '5px' }}
                    >
                        Gửi thông báo
                    </Button>
                </Space>
            ) : null}
            <div style={{ maxHeight: '150px', overflowY: 'auto', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.map(item => (
                        <div
                            key={item._id}
                            style={{
                                backgroundColor: userData?.role === 'Student' && !item.isReadBy.includes(userData._id)
                                    ? '#f0f2ff'
                                    : 'white',
                                borderRadius: '8px',
                                padding: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative', // Để định vị dấu chấm đỏ
                                cursor: 'pointer' // Thay đổi con trỏ chuột để chỉ ra có thể click
                            }}
                            onClick={() => handleNotificationRead(item._id)} // Xử lý click
                        >
                            {userData?.role === 'Student' && !item.isReadBy.includes(userData._id) && (
                                <DotChartOutlined style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    color: 'red', // Hoặc màu sắc bạn muốn
                                    fontSize: '16px' // Điều chỉnh kích thước icon
                                }} />
                            )}
                            <Row align="middle" style={{ marginBottom: '8px' }}>
                                <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar icon={<NotificationOutlined />} style={{ marginRight: '8px', fontSize: '18px' }} />
                                    <strong>{item.senderId?.name}</strong>
                                </Col>
                                <Col>
                                    <small style={{ color: '#8c8c8c', fontSize: '12px' }}>
                                        {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                    </small>
                                </Col>
                            </Row>
                            <div style={{ marginBottom: '8px', fontSize: '14px' }}>{item.content}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default NotificationArea;