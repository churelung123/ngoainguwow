import React, { useEffect, useState } from 'react';
import { Table, Spin, Alert, Typography } from 'antd';
import moment from 'moment';

function StudentResultsView({ classId, studentId, fetchWrapper }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentResults = async () => {
            setLoading(true);
            setError(null);
            try {
                // API endpoint để lấy kết quả của một học sinh trong một lớp học
                // Giả sử backend có một endpoint như /api/classes/:classId/students/:studentId/results
                const response = await fetchWrapper.get(`/api/classes/${classId}/students/${studentId}/results`);
                const data = await response.json();
                
                if (data.status === "Success" && data.message) {
                    setResults(data.message);
                } else {
                    setError(data.message || "Không thể tải kết quả học tập.");
                }
            } catch (err) {
                console.error("Lỗi khi tải kết quả học tập:", err);
                setError("Có lỗi xảy ra khi tải dữ liệu kết quả học tập.");
            } finally {
                setLoading(false);
            }
        };

        if (classId && studentId) {
            fetchStudentResults();
        }
    }, [classId, studentId, fetchWrapper]);

    const columns = [
        {
            title: 'Tiêu đề bài kiểm tra',
            dataIndex: ['testId', 'title'], // Truy cập đến thuộc tính 'title' của đối tượng 'testId' đã được populate
            key: 'testTitle',
        },
        {
            title: 'Loại bài kiểm tra',
            dataIndex: ['testId', 'type'], // Truy cập đến thuộc tính 'type' của đối tượng 'testId'
            key: 'testType',
        },
        {
            title: 'Ngày làm bài',
            dataIndex: 'submittedAt',
            key: 'submittedAt',
            render: (text) => text ? moment(text).format('DD-MM-YYYY HH:mm') : 'N/A',
        },
        {
            title: 'Tổng điểm',
            dataIndex: 'totalScore',
            key: 'totalScore',
            render: (text) => (text !== undefined && text !== null) ? text : 'N/A',
        },
        // Bạn có thể thêm cột khác như điểm tối đa nếu dữ liệu có sẵn
    ];

    if (loading) {
        return <Spin size="large" style={{ display: 'block', marginTop: '50px' }}>Đang tải kết quả học tập...</Spin>;
    }

    if (error) {
        return <Alert message="Lỗi" description={error} type="error" showIcon />;
    }

    if (results.length === 0) {
        return <Typography.Paragraph>Bạn hiện chưa có kết quả bài kiểm tra nào trong lớp này.</Typography.Paragraph>;
    }

    return (
        <Table
            dataSource={results.map(result => ({ ...result, key: result._id }))}
            columns={columns}
            rowClassName={(record, index) => (index % 2 === 0 ? 'even-row' : 'odd-row')}
            pagination={{ pageSize: 10 }} // Thêm phân trang
            style={{ paddingTop: '10px' }}
        />
    );
}

export default StudentResultsView;