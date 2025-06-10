import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom'; // Bỏ comment nếu cần dùng Link
import { Row, Col, Button, Modal, Form, Input, Space, Typography, message, InputNumber, Select } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFetchWrapper } from '_helpers'; // Import hook để gọi API
import ItemCard from './ItemCard';

const { Title } = Typography;
const { TextArea } = Input;
const { Search } = Input;
// const { Option } = Select; // Bỏ comment nếu cần dùng lại Select cho trường nào đó

// Giả định CourseSchema.js có các trường: course_name, course_code, description, course_fee

const AdminCoursesPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null); // Lưu trữ _id của khóa học đang sửa
    const [formActionLoading, setFormActionLoading] = useState(false);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [error, setError] = useState(null);
    const fetchWrapper = useFetchWrapper();

    const initialFormValues = {
        course_name: '',
        course_code: '',
        description: '',
        course_fee: null,
        duration: '',
    };

    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const responseData = await fetchWrapper.get(`/api/admin/courses/get`);
            const data = await responseData.json();
            if (data && Array.isArray(data.data)) {
                setCourses(data.data);
            }
            else {
                console.error("Courses API response không hợp lệ:", data);
                setError("Không thể tải danh sách khóa học.");
                setCourses([]);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách khóa học:", err);
            setError(err.message || "Lỗi kết nối khi tải khóa học.");
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleViewDetails = (courseItem) => {
        console.log('Xem chi tiết khóa học:', courseItem);
        // Thêm logic điều hướng hoặc hiển thị modal chi tiết nếu cần
        // ví dụ: history.push(`/admin/course-detail/${courseItem._id}`);
    };

    const showAddModal = () => {
        setEditingCourse(null);
        form.resetFields();
        form.setFieldsValue(initialFormValues); // Đặt giá trị mặc định
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingCourse(record._id); // Lưu _id để biết là đang sửa
        // Map dữ liệu từ record (API) sang các trường của form
        form.setFieldsValue({
            course_name: record.course_name,
            course_code: record.course_code,
            description: record.description,
            course_fee: record.course_fee,
            duration: record.duration,
        });
        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setEditingCourse(null);
        form.resetFields(); // Đảm bảo form được reset khi hủy
    };

    const handleFormSubmit = async (values) => {
        setFormActionLoading(true);
        setError(null); // Xóa lỗi trước đó

        const payload = {
            course_name: values.course_name,
            course_code: values.course_code,
            description: values.description,
            course_fee: Number(values.course_fee), // Đảm bảo là số
            duration: values.duration,
        };

        try {
            let response; // Để lưu trữ response từ API nếu cần
            if (editingCourse) {
                response = await fetchWrapper.put(`/api/admin/courses/edit/${editingCourse}`, 'application/json', payload);
                message.success(`Đã cập nhật khóa học: ${payload.course_name}`);
            } else {
                response = await fetchWrapper.post('/api/admin/courses/create', 'application/json', payload);
                message.success(`Đã thêm khóa học mới: ${payload.course_name}`);
            }
            fetchCourses();
            setIsModalVisible(false);
            setEditingCourse(null);
            form.resetFields(); // Reset các trường trong form

        } catch (err) {
            console.error("Lỗi khi lưu khóa học:", err);
            const apiErrorMessage = err.response?.data?.message || err.response?.data?.error;
            const displayMessage = apiErrorMessage || err.message || 'Lưu thông tin khóa học thất bại. Vui lòng thử lại.';

            message.error(displayMessage);
            setError(displayMessage);
        } finally {
            setFormActionLoading(false);
        }
    };

    const handleDeleteFromEditModal = () => {
        if (!editingCourse) return;

        const courseNameToDelete = form.getFieldValue('course_name') || "khóa học này";

        Modal.confirm({
            title: 'Xác nhận xóa khóa học',
            content: `Bạn có chắc chắn muốn xóa khóa học "${courseNameToDelete}" không? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setFormActionLoading(true); // Bắt đầu loading cho hành động xóa từ modal
                setError(null);
                try {
                    await fetchWrapper.delete(`/api/admin/courses/delete/${editingCourse}`);
                    message.success(`Đã xóa khóa học: ${courseNameToDelete}`);
                    fetchCourses(); // Tải lại danh sách khóa học
                    setIsModalVisible(false); // Đóng modal chỉnh sửa
                    setEditingCourse(null); // Reset trạng thái chỉnh sửa
                    form.resetFields();
                } catch (err) {
                    console.error("Lỗi khi xóa khóa học:", err);
                    const apiErrorMessage = err.response?.data?.message || err.response?.data?.error;
                    const displayMessage = apiErrorMessage || err.message || 'Xóa khóa học thất bại.';
                    message.error(displayMessage);
                    setError(displayMessage);
                } finally {
                    setFormActionLoading(false); // Kết thúc loading cho hành động xóa từ modal
                }
            },
            onCancel: () => {
                // Người dùng đã hủy việc xóa, không làm gì thêm, modal chỉnh sửa vẫn mở.
            },
        });
    };

    const filteredCourses = Array.isArray(courses) ? courses.filter(course =>
        (course.course_name && course.course_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (course.course_code && course.course_code.toLowerCase().includes(searchText.toLowerCase())) ||
        (course.description && course.description.toLowerCase().includes(searchText.toLowerCase()))
    ) : [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '16px' }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Khóa học</Title>
                <Space>
                    <Search
                        placeholder="Tìm theo tên, mã, mô tả..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        enterButton={<SearchOutlined />}
                        onSearch={value => setSearchText(value)}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                        Thêm Khóa học
                    </Button>
                </Space>
            </div>

            {/* Hiển thị loading chính khi tải danh sách */}
            {loading && <p>Đang tải danh sách khóa học...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
            {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && <p>Không tìm thấy khóa học nào phù hợp với tìm kiếm.</p>}
            {!loading && !error && courses.length === 0 && <p>Chưa có khóa học nào. Hãy thêm khóa học mới!</p>}


            <Row gutter={[16, 24]}>
                {filteredCourses.map(course => (
                    <Col key={course._id} xs={24} sm={12} md={8} lg={6}>
                        <ItemCard
                            item={{
                                id: course._id,
                                title: course.course_name,
                                description: course.description,
                                courseFee: course.course_fee,
                                courseCode: course.course_code,
                                _id: course._id,
                                duration: course.duration
                            }}
                            type="course"
                            onViewDetails={() => handleViewDetails(course)}
                            onEdit={() => showEditModal(course)}
                        />
                    </Col>
                ))}
            </Row>

            <Modal
                title={editingCourse ? "Chỉnh sửa Khóa học" : "Thêm Khóa học mới"}
                visible={isModalVisible}
                onCancel={handleCancelModal}
                width={600}
                destroyOnClose
                footer={
                    <div style={{ display: 'flex', justifyContent: editingCourse ? 'space-between' : 'flex-end', width: '100%' }}>
                        <div>
                            {/* Nút Xóa chỉ hiển thị khi đang chỉnh sửa */}
                            {editingCourse && (
                                <Button
                                    key="delete"
                                    danger // Làm cho nút có màu đỏ nguy hiểm
                                    onClick={handleDeleteFromEditModal}
                                    loading={formActionLoading} // Sử dụng loading riêng cho form
                                    icon={<DeleteOutlined />} // Tùy chọn: thêm icon
                                >
                                    Xóa khóa học
                                </Button>
                            )}
                        </div>
                        <Space>
                            <Button key="cancel" onClick={handleCancelModal} disabled={formActionLoading}>
                                Hủy
                            </Button>
                            <Button
                                key="submit"
                                type="primary"
                                htmlType="submit" // Nút này sẽ trigger onFinish của Form
                                form="courseForm"  // Liên kết với ID của Form
                                loading={formActionLoading}
                            >
                                {editingCourse ? "Lưu thay đổi" : "Thêm mới"}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Form
                    id="courseForm" // Thêm ID cho Form để nút submit bên ngoài có thể trigger
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    initialValues={initialFormValues}
                >
                    <Form.Item
                        name="course_name"
                        label="Tên khóa học"
                        rules={[{ required: true, message: 'Vui lòng nhập tên khóa học!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="course_code"
                        label="Mã khóa học"
                        rules={[{ required: true, message: 'Vui lòng nhập mã khóa học!' }]}
                    >
                        <Input placeholder="VD: WEB_FE_01, ENG_ADV_02" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả chi tiết"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <TextArea rows={3} placeholder="Mô tả chi tiết về nội dung, mục tiêu của khóa học..." />
                    </Form.Item>
                    <Form.Item
                        name="duration"
                        label="Thời lượng khóa học"
                        rules={[{ required: true, message: 'Vui lòng nhập thời lượng khóa học!' }]}
                    >
                        <Input placeholder="VD: 3 tháng, 12 tuần, 60 giờ" />
                    </Form.Item>
                    <Form.Item
                        name="course_fee"
                        label="Học phí (VNĐ)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập học phí!' },
                            { type: 'number', min: 0, message: 'Học phí không hợp lệ!' }
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => String(value).replace(/,*/g, '')}
                            placeholder="Nhập số tiền"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export { AdminCoursesPage };