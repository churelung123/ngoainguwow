// MyAttendanceView.jsx
import React, { useEffect, useState } from 'react';
import { Table, Typography, Spin, Alert, Tag } from 'antd';
import moment from 'moment'; // Đảm bảo bạn đã cài đặt moment: npm install moment

const { Text } = Typography;

// Hàm trợ giúp để hiển thị Tag màu mè cho trạng thái điểm danh
const getStatusTag = (status) => {
    switch (status) {
        case 'present':
            return <Tag color="success">Có mặt</Tag>;
        case 'absent':
            return <Tag color="error">Vắng</Tag>;
        case 'late':
            return <Tag color="warning">Trễ</Tag>;
        case 'excused_absence':
            return <Tag color="processing">Vắng có phép</Tag>; // Ant Design 'processing' or 'blue'
        case 'not_recorded':
            return <Tag>Chưa điểm danh</Tag>;
        default:
            return <Tag>{status}</Tag>;
    }
};

function MyAttendanceView({ classId, fetchWrapper }) {
    const [myAttendanceData, setMyAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!classId) return;

        const fetchMyRecords = async () => {
            setLoading(true);
            setError(null);
            try {
                // Gọi API đã tạo ở Bước 1
                const response = await fetchWrapper.get(`/api/classes/${classId}/my-attendance-records`);
                const result = await response.json();

                if (result.status === "Success") {
                    setMyAttendanceData(result.data);
                } else {
                    setError(result.message || "Không thể tải dữ liệu điểm danh của bạn.");
                }
            } catch (err) {
                console.error("Lỗi khi tải điểm danh của tôi:", err);
                setError("Lỗi kết nối hoặc máy chủ. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        fetchMyRecords();
    }, [classId, fetchWrapper]);

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            render: (text, record, index) => index + 1,
            width: '10%',
            align: 'center',
        },
        {
            title: 'Ngày học',
            dataIndex: 'sessionDate',
            key: 'sessionDate',
            render: (date) => moment(date).isValid() ? moment(date).format('DD/MM/YYYY') : 'Ngày không hợp lệ',
            sorter: (a, b) => moment(a.sessionDate).unix() - moment(b.sessionDate).unix(),
            defaultSortOrder: 'ascend', // Sắp xếp ngày gần nhất lên đầu hoặc ngược lại tùy bạn
            width: '30%',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
            width: '30%',
            align: 'center',
        },
        {
            title: 'Ghi chú của GV',
            dataIndex: 'note',
            key: 'note',
            render: (note) => note || '-', // Hiển thị '-' nếu không có ghi chú
            width: '30%',
        },
    ];

    if (loading) {
        return <Spin tip="Đang tải điểm danh của bạn..." style={{display: 'block', marginTop: '20px'}}/>;
    }
    if (error) {
        return <Alert message={error} type="error" showIcon />;
    }
    
    return (
        <Table
            columns={columns}
            dataSource={myAttendanceData.map((item, index) => ({ ...item, key: item.sessionDate ? `${item.sessionDate}-${index}` : index }))} // Đảm bảo key là duy nhất
            pagination={{ pageSize: 15, showSizeChanger: false }}
            bordered
            size="middle"
            summary={data => {
                if (data.length === 0) return undefined;
                let presentCount = 0;
                let absentCount = 0;
                let lateCount = 0;
                let excusedCount = 0;
                data.forEach(({ status }) => {
                    if (status === 'present') presentCount++;
                    else if (status === 'absent') absentCount++;
                    else if (status === 'late') lateCount++;
                    else if (status === 'excused_absence') excusedCount++;
                });
                return (
                  <Table.Summary.Row style={{backgroundColor: '#f0f2f5', fontWeight: 'bold'}}>
                    <Table.Summary.Cell index={0} colSpan={2} align="right">Tổng kết:</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                        <Text>Có mặt: {presentCount} </Text>| 
                        <Text> Vắng: {absentCount} </Text>| 
                        <Text> Trễ: {lateCount} </Text>| 
                        <Text> Có phép: {excusedCount}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
            }}
        />
    );
}

export default MyAttendanceView;