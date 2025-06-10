import React, { useState } from 'react'; // Thêm useState
import { Modal, Table, Space, Button, Tooltip } from 'antd';
import moment from 'moment';
import { EyeOutlined } from '@ant-design/icons';
import IndividualResultModal from './IndividualResultModal'; // Import component modal mới

function ResultDetailModal({ visible, onClose, results, testTitle, fetchWrapper }) { // Thêm fetchWrapper
    const [isIndividualResultModalVisible, setIsIndividualResultModalVisible] = useState(false);
    const [selectedStudentTestInfo, setSelectedStudentTestInfo] = useState({ testId: null, studentId: null, studentName: null });

    const handleViewIndividualResult = (testId, studentId, studentName) => {
        setSelectedStudentTestInfo({ testId, studentId, studentName });
        setIsIndividualResultModalVisible(true);
    };

    const handleCloseIndividualResultModal = () => {
        setIsIndividualResultModalVisible(false);
        setSelectedStudentTestInfo({ testId: null, studentId: null, studentName: null });
    };

    const columns = [
        {
            title: 'Tên học sinh',
            dataIndex: ['studentId', 'name'],
            key: 'studentName',
            render: (text, record) => record.studentId?.name || 'N/A'
        },
        {
            title: 'VNU ID',
            dataIndex: ['studentId', 'vnu_id'],
            key: 'vnu_id',
            render: (text, record) => record.studentId?.vnu_id || 'N/A'
        },
        {
            title: 'Ngày nộp bài',
            dataIndex: 'submittedAt',
            key: 'submittedAt',
            render: (text) => text ? moment(text).format('HH:mm DD-MM-YYYY') : ''
        },
        {
            title: 'Tổng điểm',
            dataIndex: 'totalScore',
            key: 'totalScore',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết bài làm">
                        <Button
                            type="text"
                            onClick={() => handleViewIndividualResult(record.testId, record.studentId._id, record.studentId.name)}
                            style={{
                                backgroundColor: '#1890ff',
                                borderRadius: '20%',
                                padding: 6,
                                lineHeight: 1,
                            }}
                        >
                            <EyeOutlined style={{ color: 'white' }} />
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Modal
                title={`Kết quả bài kiểm tra: ${testTitle}`}
                visible={visible}
                onCancel={onClose}
                footer={null}
                width={800}
            >
                <Table
                    dataSource={results}
                    columns={columns}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Không có kết quả nào.' }}
                />
            </Modal>

            <IndividualResultModal
                visible={isIndividualResultModalVisible}
                onClose={handleCloseIndividualResultModal}
                testId={selectedStudentTestInfo.testId}
                studentId={selectedStudentTestInfo.studentId}
                studentName={selectedStudentTestInfo.studentName}
                fetchWrapper={fetchWrapper}
            />
        </>
    );
}

export default ResultDetailModal;