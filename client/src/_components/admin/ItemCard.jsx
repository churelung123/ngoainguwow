import React from 'react';
import { Card, Typography, Button, Space } from 'antd'; // Thêm Button, Space nếu muốn có nút action trực tiếp trên card
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const ItemCard = ({ item, type, onViewDetails, onEdit, onDeleteConfirm }) => {
    let cardTitle, itemDetails;
    const itemId = item._id || item.id; // Ưu tiên _id, nếu không có thì dùng id

    if (type === 'class') {
        cardTitle = item.className || item.name || 'Tên lớp học không xác định';

        // Logic hiển thị lịch học (giữ nguyên hoặc tùy chỉnh)
        let scheduleDisplay = 'Chưa cập nhật';
        if (item.schedule && typeof item.schedule === 'object') {
            const { daysOfWeek, startTime, room, totalSessions, startDate } = item.schedule;
            let parts = [];
            if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
                // Chuyển đổi ['Monday', 'Wednesday'] thành 'Thứ 2, Thứ 4' (cần hàm map hoặc logic tương tự)
                const dayLabels = { Monday: 'T2', Tuesday: 'T3', Wednesday: 'T4', Thursday: 'T5', Friday: 'T6', Saturday: 'T7', Sunday: 'CN' };
                parts.push(daysOfWeek.map(day => dayLabels[day] || day).join(', '));
            }
            if (startTime) parts.push(`lúc ${startTime}`);
            if (room) parts.push(`tại ${room}`);
            if (parts.length > 0) scheduleDisplay = parts.join(' - ');

            if (totalSessions) scheduleDisplay += ` (${totalSessions} buổi)`;
            if (startDate) {
                // scheduleDisplay += ` (Bắt đầu: ${new Date(startDate).toLocaleDateString('vi-VN')})`;
            }

        } else if (typeof item.schedule === 'string' && item.schedule.trim() !== '') {
            scheduleDisplay = item.schedule;
        }

        itemDetails = (
            <>
                <Paragraph>
                    <strong>Mã lớp:</strong> {item.classId || 'N/A'}
                </Paragraph>
                <Paragraph>
                    <strong>Giáo viên:</strong> {item.teacher_id || (item.teacher ? item.teacher.name : 'N/A')}
                </Paragraph>
                <Paragraph>
                    <strong>Học phí:</strong> {item.classFee !== undefined ? Number(item.classFee).toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}
                </Paragraph>
                <Paragraph>
                    <strong>Lịch học:</strong> <span style={{ whiteSpace: 'normal' }}>{scheduleDisplay}</span>
                </Paragraph>
                <Paragraph>
                    <strong>Khóa học:</strong> {item.course_code || (item.course ? (item.course.name || item.course.course_name) : 'N/A')}
                </Paragraph>
                {/* Bạn có thể thêm các thông tin khác nếu cần */}
            </>
        );

        // Hành động chính khi click vào card
        const handleCardClick = () => {
            if (typeof onEdit === 'function') {
                onEdit(item); // Gọi hàm onEdit đã truyền từ AdminClassesPage
            } else if (typeof onViewDetails === 'function') {
                onViewDetails(item); // Nếu không có onEdit, có thể gọi onViewDetails
            } else if (itemId) {
                // Fallback: nếu không có onEdit và onViewDetails, nhưng có Link thì điều hướng
                // (Logic Link sẽ xử lý việc này nếu card được bọc trong Link)
                // Hoặc nếu không muốn Link, có thể không làm gì cả hoặc log lỗi
                console.warn("ItemCard: No onEdit or onViewDetails provided for class type, and not wrapped in Link for navigation.");
            }
        };

        // Card sẽ không còn bọc trong Link nữa nếu onEdit là hành động chính
        // Việc điều hướng sẽ do nút "Xem chi tiết" trong modal đảm nhiệm
        return (
            <Card
                onClick={handleCardClick} // Hành động chính khi click
                hoverable={typeof onEdit === 'function' || typeof onViewDetails === 'function'} // Thẻ có thể trỏ vào được nếu có hành động
                style={{
                    borderRadius: '8px',
                    cursor: (typeof onEdit === 'function' || typeof onViewDetails === 'function') ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    height: '100%', // Để các card có chiều cao bằng nhau trong Row/Col
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden' // Đảm bảo nội dung không tràn ra ngoài
                }}
                bodyStyle={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                // Hiệu ứng hover chỉ khi có hành động click
                onMouseEnter={(e) => { if (typeof onEdit === 'function' || typeof onViewDetails === 'function') e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={(e) => { if (typeof onEdit === 'function' || typeof onViewDetails === 'function') e.currentTarget.style.transform = 'scale(1)'; }}
            // actions={ // Nếu muốn có các nút action ở dưới cùng của card
            //     [
            //         typeof onEdit === 'function' ? <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); onEdit(item); }} title="Chỉnh sửa" /> : null,
            //         itemId && !onEdit ? <Link to={`/class/${itemId}`} onClick={(e) => e.stopPropagation()} title="Xem chi tiết"><EyeOutlined key="view" /></Link> : null,
            //         typeof onDeleteConfirm === 'function' ? <DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); onDeleteConfirm(itemId); }} title="Xóa" /> : null,
            //     ].filter(action => action !== null)
            // }
            >
                <div style={{ backgroundColor: '#a4c4a2', /*Màu nền tiêu đề cho lớp học*/ padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                    <Title level={4} style={{ marginBottom: '0', color: 'black' /*Màu chữ tiêu đề*/ }} ellipsis={{ rows: 1, tooltip: cardTitle }}>
                        {cardTitle}
                    </Title>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#ffffff', flexGrow: 1 }}>
                    {itemDetails}
                </div>
            </Card>
        );

    } else if (type === 'course') {
        cardTitle = item.title || item.course_name || 'Tên khóa học không xác định'; // Thêm item.course_name

        itemDetails = (
            <>
                <Paragraph>
                    <strong>Mã KH:</strong> {item.courseCode || item.course_code || 'N/A'}
                </Paragraph>
                <Paragraph>
                    <strong>Học phí:</strong> {item.courseFee !== undefined ? Number(item.courseFee).toLocaleString('vi-VN') + ' VNĐ' : (item.course_fee !== undefined ? Number(item.course_fee).toLocaleString('vi-VN') + ' VNĐ' : 'N/A')}
                </Paragraph>
                <Paragraph>
                    <strong>Thời lượng:</strong> {item.duration || 'N/A'}
                </Paragraph>
                <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'xem thêm' }}>
                    <strong>Mô tả:</strong> {item.description || 'N/A'}
                </Paragraph>
            </>
        );

        const handleCourseCardClick = () => {
            if (typeof onEdit === 'function') {
                onEdit(item);
            } else if (typeof onViewDetails === 'function') {
                onViewDetails(item);
            }
        };

        return (
            <Card
                onClick={handleCourseCardClick}
                hoverable={typeof onEdit === 'function' || typeof onViewDetails === 'function'}
                style={{
                    borderRadius: '8px',
                    cursor: (typeof onEdit === 'function' || typeof onViewDetails === 'function') ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
                bodyStyle={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onMouseEnter={(e) => { if (typeof onEdit === 'function' || typeof onViewDetails === 'function') e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={(e) => { if (typeof onEdit === 'function' || typeof onViewDetails === 'function') e.currentTarget.style.transform = 'scale(1)'; }}
            >
                <div style={{ backgroundColor: '#a4c4a2', /* Màu nền tiêu đề cho khóa học */ padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                    <Title level={4} style={{ marginBottom: '0', color: 'black' /* Màu chữ tiêu đề */ }} ellipsis={{ rows: 1, tooltip: cardTitle }}>
                        {cardTitle}
                    </Title>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#ffffff', flexGrow: 1 }}>
                    {itemDetails}
                </div>
            </Card>
        );

    } else {
        return <Card>Loại item không được hỗ trợ.</Card>;
    }
};

export default ItemCard;