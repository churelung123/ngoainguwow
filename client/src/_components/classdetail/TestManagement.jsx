// TestManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useHistory } from 'react-router-dom';
import {
    Table,
    Input,
    Button,
    Space,
    Select,
    DatePicker,
    InputNumber,
    message,
    Tooltip,
    Checkbox,
    Modal,
} from 'antd';
import { DeleteOutlined, EditOutlined, SettingOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import ResultDetailModal from './ResultDetailModal';

const { Search } = Input;
const { Option } = Select;

function TestManagement({
    classId,
    userData,
    fetchWrapper,
    setClassDetails,
    searchText,
    handleSearch,
}) {
    const [tests, setTests] = useState();
    const [isAddingTestInline, setIsAddingTestInline] = useState(false);
    const [newTestDataInline, setNewTestDataInline] = useState({
        title: '',
        type: '',
        testDate: null,
        duration: null,
        isPublish: false,
        maxAttempts: 1,
    });
    const [editingTestId, setEditingTestId] = useState(null);
    const [editingTestData, setEditingTestData] = useState({});

    // State mới cho modal kết quả
    const [isResultModalVisible, setIsResultModalVisible] = useState(false);
    const [selectedTestResults, setSelectedTestResults] = useState([]);
    const [currentTestTitle, setCurrentTestTitle] = useState('');

    const history = useHistory();

    const handleFetchTests = async () => {
        try {
            const response = await fetchWrapper.get(`/api/classes/${classId}/tests`);
            const data = await response.json();
            if (data.status === "Success") {
                console.log("thông tin: ", data.message);
                setTests(data.message);
            } else {
                message.error("Tải bài kiểm tra thất bại: " + data.status);
            }
        } catch (error) {
            console.error("Lỗi khi thêm bài kiểm tra:", error);
            message.error("Có lỗi xảy ra khi thêm bài kiểm tra.");
        }
    };

    useEffect(() => {
        handleFetchTests();
      }, [])
    
    // Hàm xử lý tạo bài kiểm tra mới (inline)
    const handleCreateTestInline = () => {
        setIsAddingTestInline(true);
        // Thêm một hàng trống vào dataSourceTests cho phép nhập liệu
        setTests(prevTests => [
            ...prevTests,
            {
                _id: 'new-inline-test', // ID tạm thời cho hàng mới
                title: '',
                type: '',
                testDate: null,
                duration: null,
                isPublish: false,
                maxAttempts: 1, // Thiết lập mặc định cho bài kiểm tra mới
            }
        ]);
        setEditingTestId('new-inline-test'); // Bắt đầu chỉnh sửa hàng mới
        setNewTestDataInline({
            title: '',
            type: '',
            testDate: null,
            duration: null,
            isPublish: false,
            maxAttempts: 1, // Đảm bảo trạng thái ban đầu của newTestDataInline
        });
    };

    // Hàm xử lý lưu bài kiểm tra mới
    const handleSaveNewTestInline = async () => {
        if (!newTestDataInline.title || !newTestDataInline.type || !newTestDataInline.testDate || !newTestDataInline.duration) {
            message.error("Vui lòng điền đầy đủ các trường cần thiết.");
            return;
        }

        const dataToSend = {
            ...newTestDataInline,
            classId: classId,
            testDate: newTestDataInline.testDate.toISOString(), // Chuyển đổi Date object sang ISO string
            createdBy: userData?._id, // Lấy ID của người tạo từ userData
        };

        try {
            const response = await fetchWrapper.post('/api/tests', dataToSend);
            if (response.status === "Success") {
                message.success("Thêm bài kiểm tra thành công!");
                setIsAddingTestInline(false);
                handleFetchTests();
            } else {
                message.error("Thêm bài kiểm tra thất bại: " + response.message);
            }
        } catch (error) {
            console.error("Lỗi khi thêm bài kiểm tra:", error);
            message.error("Có lỗi xảy ra khi thêm bài kiểm tra.");
        }
    };

    // Hàm xử lý hủy thêm bài kiểm tra mới
    const handleCancelNewTestInline = () => {
        setIsAddingTestInline(false);
        setNewTestDataInline({
            title: '',
            type: '',
            testDate: null,
            duration: null,
            isPublish: false,
        });
    };

    // Hàm xử lý xóa bài kiểm tra
    const handleDeleteTest = async (testId) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa bài kiểm tra này không?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const response = await fetchWrapper.delete(`/api/tests/${testId}/class/${classId}`); // Cập nhật đường dẫn API
                    if (response.status === "Success") {
                        message.success("Xóa bài kiểm tra thành công!");
                        // Cập nhật lại danh sách bài kiểm tra
                        handleFetchTests(); // Tải lại danh sách để cập nhật
                    } else {
                        message.error("Xóa bài kiểm tra thất bại: " + response.message);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa bài kiểm tra:", error);
                    message.error("Có lỗi xảy ra khi xóa bài kiểm tra.");
                }
            },
        });
    };

    // Hàm xử lý bắt đầu chỉnh sửa bài kiểm tra
    const handleEditTest = (record) => {
        setEditingTestId(record._id);
        setEditingTestData({
            ...record,
            testDate: record.testDate ? moment(record.testDate) : null, // Chuyển đổi sang Moment object cho DatePicker
        });
    };

    // Hàm xử lý thay đổi dữ liệu khi chỉnh sửa
    const handleEditChange = (key, value) => {
        setEditingTestData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Hàm xử lý lưu chỉnh sửa bài kiểm tra
    const handleSaveEdit = async () => {
        if (!editingTestData.title || !editingTestData.type || !editingTestData.testDate || !editingTestData.duration) {
            message.error("Vui lòng điền đầy đủ các trường cần thiết.");
            return;
        }

        const dataToUpdate = {
            ...editingTestData,
            testDate: editingTestData.testDate ? editingTestData.testDate.toISOString() : null,
        };

        try {
            const response = await fetchWrapper.put(`/api/tests/${editingTestId}`, 'application/json', dataToUpdate);
            const data = await response.json();
            if (data.status === "Success") {
                message.success("Cập nhật bài kiểm tra thành công!");
                setEditingTestId(null);
                handleFetchTests();
            } else {
                message.error("Cập nhật bài kiểm tra thất bại: " + data.message);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật bài kiểm tra:", error);
            message.error("Có lỗi xảy ra khi cập nhật bài kiểm tra.");
        }
    };

    // Hàm xử lý hủy chỉnh sửa
    const handleCancelEdit = () => {
        setEditingTestId(null);
        setEditingTestData({});
    };

    // Hàm xử lý khi click "Xem kết quả"
    const handleViewResults = async (testId, testTitle) => {
        try {
            const response = await fetchWrapper.get(`/api/tests/${testId}/results`);
            const data = await response.json();
            if (data.status === "Success") {
                setSelectedTestResults(data.message);
                setCurrentTestTitle(testTitle);
                setIsResultModalVisible(true);
            } else {
                message.error("Không thể tải kết quả: " + response.message);
            }
        } catch (error) {
            console.error("Lỗi khi tải kết quả bài kiểm tra:", error);
            message.error("Có lỗi xảy ra khi tải kết quả.");
        }
    };

    // Hàm xử lý đóng modal kết quả
    const handleCloseResultModal = () => {
        setIsResultModalVisible(false);
        setSelectedTestResults([]);
        setCurrentTestTitle('');
    };

    // --- LOGIC MỚI: Xử lý click nút "Làm bài" cho học sinh ---
    const handleStudentStartTest = async (testId, studentId, testTitle) => {
        try {
            // Sử dụng API_PATH.GET_ATEMPT_STUDENT từ Constants.js
            const url = `/api/tests/${testId}/student/${studentId}/attempts`;
            const attemptsResponse = await fetchWrapper.get(url); // Sử dụng fetchWrapper
            const attemptsData = await attemptsResponse.json();

            if (attemptsData.status === "Success") {
                const { attemptsRemaining, maxAttempts } = attemptsData.message; // Lấy dữ liệu từ message

                if (maxAttempts > 0 && attemptsRemaining <= 0) {
                    // Nếu đã hết lượt và có giới hạn lượt
                    message.warning(`Bạn đã hết ${maxAttempts} lượt làm bài cho bài kiểm tra "${testTitle}" này.`);
                    // KHÔNG điều hướng, vẫn ở trang hiện tại
                } else {
                    // Nếu còn lượt hoặc không giới hạn lượt, điều hướng đến trang làm bài
                    history.push(`/class/${classId}/test/${testId}/student/${studentId}`);
                }
            } else {
                message.error(attemptsData.message || 'Không thể kiểm tra số lượt làm bài. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra lượt làm bài:', error);
            message.error('Có lỗi xảy ra khi kiểm tra lượt làm bài.');
        }
    };

    const filteredTests =
        tests?.filter(test =>
            test.title?.toLowerCase().includes(searchText.toLowerCase())
        ) || [];

    const handleMaxAttemptsChange = (value) => {
        if (editingTestId) {
            setEditingTestData(prev => ({ ...prev, maxAttempts: value }));
        } else {
            setNewTestDataInline(prev => ({ ...prev, maxAttempts: value }));
        }
    };

    const testColumns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) =>
                record.isNew ? (
                    <Input
                        value={newTestDataInline.title}
                        onChange={(e) => setNewTestDataInline({ ...newTestDataInline, title: e.target.value })}
                        placeholder="Tiêu đề bài kiểm tra"
                    />
                ) : editingTestId === record._id ? (
                    <Input
                        value={editingTestData.title}
                        onChange={(e) => handleEditChange('title', e.target.value)}
                    />
                ) : (
                    text
                ),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (text, record) =>
                record.isNew ? (
                    <Select
                        value={newTestDataInline.type}
                        onChange={(value) => setNewTestDataInline({ ...newTestDataInline, type: value })}
                        placeholder="Chọn loại"
                        style={{ width: '100%' }}
                    >
                        <Option value="Giữa kỳ">Giữa kỳ</Option>
                        <Option value="Cuối kỳ">Cuối kỳ</Option>
                        <Option value="Thường xuyên">Thường xuyên</Option>
                        <Option value="Khác">Khác</Option>
                    </Select>
                ) : editingTestId === record._id ? (
                    <Select
                        value={editingTestData.type}
                        onChange={(value) => handleEditChange('type', value)}
                        style={{ width: '100%' }}
                    >
                        <Option value="Giữa kỳ">Giữa kỳ</Option>
                        <Option value="Cuối kỳ">Cuối kỳ</Option>
                        <Option value="Thường xuyên">Thường xuyên</Option>
                        <Option value="Khác">Khác</Option>
                    </Select>
                ) : (
                    text
                ),
        },
        {
            title: 'Ngày kiểm tra',
            dataIndex: 'testDate',
            key: 'testDate',
            render: (text, record) =>
                record.isNew ? (
                    <DatePicker
                        value={newTestDataInline.testDate}
                        onChange={(date) => setNewTestDataInline({ ...newTestDataInline, testDate: date })}
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                    />
                ) : editingTestId === record._id ? (
                    <DatePicker
                        value={editingTestData.testDate}
                        onChange={(date) => handleEditChange('testDate', date)}
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                    />
                ) : (
                    text ? moment(text).format('DD/MM/YYYY') : ''
                ),
        },
        {
            title: 'Thời lượng (phút)',
            dataIndex: 'duration',
            key: 'duration',
            render: (text, record) =>
                record.isNew ? (
                    <InputNumber
                        value={newTestDataInline.duration}
                        onChange={(value) => setNewTestDataInline({ ...newTestDataInline, duration: value })}
                        min={1}
                        style={{ width: '100%' }}
                    />
                ) : editingTestId === record._id ? (
                    <InputNumber
                        value={editingTestData.duration}
                        onChange={(value) => handleEditChange('duration', value)}
                        min={1}
                        style={{ width: '100%' }}
                    />
                ) : (
                    text
                ),
        },

        {
            title: 'Số lần làm bài',
            dataIndex: 'maxAttempts',
            key: 'maxAttempts',
            render: (text, record) => (
                editingTestId === record._id ? (
                    <InputNumber
                        min={1}
                        value={editingTestData.maxAttempts}
                        onChange={handleMaxAttemptsChange}
                        style={{ width: '100%' }}
                    />
                ) : text
            ),
        },

        {
            title: 'Công khai',
            dataIndex: 'isPublish',
            key: 'isPublish',
            render: (text, record) =>
                record.isNew ? (
                    <Checkbox
                        checked={newTestDataInline.isPublish}
                        onChange={(e) => setNewTestDataInline({ ...newTestDataInline, isPublish: e.target.checked })}
                    />
                ) : editingTestId === record._id ? (
                    <Checkbox
                        checked={editingTestData.isPublish}
                        onChange={(e) => handleEditChange('isPublish', e.target.checked)}
                    />
                ) : (
                    <Checkbox checked={Boolean(record.isPublish)} disabled />
                ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => {
                if (userData?.role === 'Student') {
                    return (
                        <Button
                            disabled={!record.isPublish}
                            type="primary"
                            onClick={() => handleStudentStartTest(record._id, userData._id, record.title)} // Gọi hàm mới
                        >
                            Làm bài
                        </Button>
                    );
                }

                if (record.isNew) {
                    return (
                        <Space>
                            <Button type="primary" size="small" onClick={handleSaveNewTestInline}>
                                Lưu
                            </Button>
                            <Button size="small" onClick={handleCancelNewTestInline}>
                                Hủy
                            </Button>
                        </Space>
                    );
                }

                if (editingTestId === record._id) {
                    return (
                        <Space size="middle">
                            <Tooltip title="Lưu chỉnh sửa">
                                <Button
                                    type="text"
                                    onClick={handleSaveEdit}
                                    style={{
                                        backgroundColor: '#52c41a',
                                        borderRadius: '20%',
                                        padding: 6,
                                        lineHeight: 1,
                                    }}
                                >
                                    <CheckOutlined style={{ color: 'white' }} />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Hủy chỉnh sửa">
                                <Button
                                    type="text"
                                    onClick={handleCancelEdit}
                                    style={{
                                        backgroundColor: '#f5222d',
                                        borderRadius: '20%',
                                        padding: 6,
                                        lineHeight: 1,
                                    }}
                                >
                                    <CloseOutlined style={{ color: 'white' }} />
                                </Button>
                            </Tooltip>
                        </Space>
                    );
                }

                return (
                    <Space size="middle">
                        <Tooltip title="Xóa bài kiểm tra">
                            <Button
                                type="text"
                                onClick={() => handleDeleteTest(record._id)}
                                style={{
                                    backgroundColor: '#ff4d4f',
                                    borderRadius: '20%',
                                    padding: 6,
                                    lineHeight: 1,
                                }}
                            >
                                <DeleteOutlined style={{ color: 'white' }} />
                            </Button>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa bài kiểm tra">
                            <Button
                                type="text"
                                onClick={() => handleEditTest(record)}
                                style={{
                                    backgroundColor: '#1890ff',
                                    borderRadius: '20%',
                                    padding: 6,
                                    lineHeight: 1,
                                }}
                            >
                                <EditOutlined style={{ color: 'white' }} />
                            </Button>
                        </Tooltip>
                        <Tooltip title="Quản lý nội dung">
                            <Button
                                type="text"
                                onClick={() =>
                                    history.push(`/classes/${classId}/tests/${record._id}/form-elements`)
                                }
                                style={{
                                    backgroundColor: '#4d79ff',
                                    borderRadius: '20%',
                                    padding: 6,
                                    lineHeight: 1,
                                }}
                            >
                                <SettingOutlined style={{ color: 'white' }} />
                            </Button>
                        </Tooltip>
                        {(userData?.role === 'teacher' || userData?.role === 'admin') && (
                            <Tooltip title="Xem kết quả">
                                <Button
                                    type="text"
                                    onClick={() => handleViewResults(record._id, record.title)}
                                    style={{
                                        backgroundColor: '#00cc66',
                                        borderRadius: '20%',
                                        padding: 6,
                                        lineHeight: 1,
                                    }}
                                >
                                    <EyeOutlined style={{ color: 'white' }} />
                                </Button>
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    const dataSourceTests = isAddingTestInline
        ? [{ key: 'new', isNew: true }, ...filteredTests.map(test => ({ key: test._id, ...test }))]
        : filteredTests.map(test => ({ key: test._id, ...test }));

    return (
        <div>
            <div style={{ marginTop: '16px' }}>
                {tests && tests.length > 0 || isAddingTestInline ? (
                    <Table
                        dataSource={dataSourceTests}
                        columns={testColumns}
                        rowClassName={(record, index) => (index % 2 === 0 ? 'even-row' : 'odd-row')}
                        pagination={false}
                        style={{ paddingTop: '10px' }}
                    />
                ) : (
                    <p style={{ paddingTop: '10px' }}>Lớp học hiện chưa có bài kiểm tra.</p>
                )}
                {(userData?.role === 'teacher' || userData?.role === 'admin') && (
                    <Button
                        type="primary"
                        onClick={handleCreateTestInline}
                        style={{ borderRadius: '8px', marginTop: '16px' }}
                    >
                        Thêm bài kiểm tra
                    </Button>
                )}
            </div>

            {/* Modal hiển thị kết quả */}
            <ResultDetailModal
                visible={isResultModalVisible}
                onClose={handleCloseResultModal}
                results={selectedTestResults}
                testTitle={currentTestTitle}
                fetchWrapper={fetchWrapper}
            />
        </div>
    );
}

export default TestManagement;