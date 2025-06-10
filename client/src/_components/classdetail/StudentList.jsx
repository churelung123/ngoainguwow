import React, { useState } from 'react';
import { Table, Input, Button, Popconfirm, Tag, message, Modal, Form, Select, InputNumber, Space } from 'antd'; // Thêm Space
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

function StudentList({ students, searchText, classId, onStudentRemoved, fetchWrapper, userData }) {
    const [isEditPaymentModalVisible, setIsEditPaymentModalVisible] = useState(false);
    const [currentEditingStudent, setCurrentEditingStudent] = useState(null);
    const [form] = Form.useForm();

    // Hàm xử lý xóa học sinh
    const handleDeleteStudent = async (studentId, studentName) => { // studentId là _id của học sinh
        try {
            // Gửi _id của học sinh để xóa khỏi lớp
            const response = await fetchWrapper.delete(`/api/classes/${classId}/remove-Student/${studentId}`);
            const data = await response.json();

            if (data.status === "Success") {
                message.success(`Đã xóa học sinh ${studentName} khỏi lớp.`);
                onStudentRemoved(); // Tải lại chi tiết lớp để cập nhật UI
            } else {
                message.error(data.message || "Không thể xóa học sinh khỏi lớp.");
            }
        } catch (error) {
            console.error("Lỗi khi xóa học sinh:", error);
            const apiErrorMessage = error.response?.data?.message || error.response?.data?.error;
            message.error(apiErrorMessage || "Có lỗi xảy ra khi xóa học sinh.");
        }
    };

    // Hàm mở modal chỉnh sửa học phí
    const handleEditPayment = (Student) => {
        setCurrentEditingStudent(Student);
        // Tìm thông tin paymentStatus của học sinh này cho lớp hiện tại
        const currentClassPayment = Student.paymentStatus?.find(item => item.classId === classId);
        form.setFieldsValue({
            status: currentClassPayment?.status || 'unpaid',
            amountPaid: currentClassPayment?.amountPaid || 0,
        });
        setIsEditPaymentModalVisible(true);
    };

    // Hàm submit form chỉnh sửa học phí
    const handleUpdatePayment = async (values) => {
        if (!currentEditingStudent) return;

        try {
            // Gửi yêu cầu PUT để cập nhật trạng thái học phí và số tiền đã đóng
            const response = await fetchWrapper.put(`/api/students/${currentEditingStudent._id}/payment-status`, {
                classId: classId,
                status: values.status,
                amountPaid: values.amountPaid,
            });
            const data = await response.json();

            if (data.status === "Success") {
                message.success(`Đã cập nhật trạng thái học phí cho ${currentEditingStudent.name}.`);
                setIsEditPaymentModalVisible(false);
                setCurrentEditingStudent(null);
                form.resetFields(); // Reset form sau khi đóng modal
                onStudentRemoved(); // Tải lại chi tiết lớp để cập nhật dữ liệu
            } else {
                message.error(data.message || "Không thể cập nhật trạng thái học phí.");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái học phí:", error);
            const apiErrorMessage = error.response?.data?.message || error.response?.data?.error;
            message.error(apiErrorMessage || "Có lỗi xảy ra khi cập nhật trạng thái học phí.");
        }
    };

    const studentColumns = [
        {
            title: 'Họ tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'VNU-ID',
            dataIndex: 'vnu_id',
            key: 'vnu_id',
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number',
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'date_of_birth',
            key: 'date_of_birth',
            render: (text) => {
                if (!text) return 'N/A';
                const date = new Date(text);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            },
        },
        {
            title: 'Trạng thái học phí',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (paymentStatusArray) => {
                const currentClassPayment = paymentStatusArray?.find(item => item.classId === classId);
                const status = currentClassPayment ? currentClassPayment.status : 'unpaid'; // Mặc định 'unpaid'

                let color;
                let text;
                switch (status) {
                    case 'paid':
                        color = 'green';
                        text = 'Đã đóng đủ';
                        break;
                    case 'partially_paid':
                        color = 'orange';
                        text = 'Đã đóng một phần';
                        break;
                    case 'unpaid':
                    default:
                        color = 'red';
                        text = 'Chưa đóng';
                        break;
                }
                return <Tag color={color}>{text.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Số tiền đã đóng',
            dataIndex: 'paymentStatus',
            key: 'amountPaid',
            render: (paymentStatusArray) => {
                const currentClassPayment = paymentStatusArray?.find(item => item.classId === classId);
                const amount = currentClassPayment ? currentClassPayment.amountPaid : 0;
                // Định dạng tiền tệ Việt Nam
                return `${amount.toLocaleString('vi-VN')} VND`;
            }
        },
        // Chỉ hiển thị cột hành động nếu người dùng là admin hoặc teacher
        ...(userData?.role === 'admin' || userData?.role === 'teacher' ? [{
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space> {/* Sử dụng Space để các button không bị dính vào nhau */}
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditPayment(record)}
                    >
                        Sửa Học phí
                    </Button>
                    <Popconfirm
                        title={`Bạn có chắc chắn muốn xóa ${record.name} khỏi lớp này?`}
                        onConfirm={() => handleDeleteStudent(record._id, record.name)} // Sử dụng _id của học sinh
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Xóa khỏi lớp
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        }] : []),
    ];

    // Lọc danh sách học sinh dựa trên searchText (tên hoặc VNU-ID)
    const filteredStudents = students?.filter(Student =>
        Student.vnu_id?.toLowerCase().includes(searchText.toLowerCase()) ||
        Student.name?.toLowerCase().includes(searchText.toLowerCase())
    ) || [];

    return (
        <div>
            <div style={{ marginTop: '16px' }}>
                {students && students.length > 0 ? (
                    <Table
                        dataSource={filteredStudents.map(Student => ({ key: Student._id, ...Student }))} // Thêm key cho mỗi dòng
                        columns={studentColumns}
                        rowClassName={(record, index) => (index % 2 === 0 ? 'even-row' : 'odd-row')}
                        pagination={false} // Tắt phân trang mặc định nếu bạn muốn tự quản lý
                        style={{ paddingTop: '10px' }}
                    />
                ) : (
                    <p style={{ paddingTop: '10px' }}>Lớp học hiện chưa có học sinh.</p>
                )}
            </div>

            {/* Modal chỉnh sửa trạng thái học phí */}
            <Modal
                title={`Cập nhật Học phí cho ${currentEditingStudent?.name}`}
                visible={isEditPaymentModalVisible}
                onCancel={() => {
                    setIsEditPaymentModalVisible(false);
                    setCurrentEditingStudent(null);
                    form.resetFields(); // Reset form khi đóng modal
                }}
                onOk={() => form.submit()} // Gửi form khi nhấn OK
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdatePayment} // Xử lý khi form được submit
                >
                    <Form.Item
                        name="status"
                        label="Trạng thái học phí"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                    >
                        <Select placeholder="Chọn trạng thái">
                            <Option value="unpaid">Chưa đóng</Option>
                            <Option value="partially_paid">Đã đóng một phần</Option>
                            <Option value="paid">Đã đóng đủ</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="amountPaid"
                        label="Số tiền đã đóng (VND)"
                        rules={[{ required: true, message: 'Vui lòng nhập số tiền đã đóng!' }, { type: 'number', min: 0, message: 'Số tiền phải là số không âm!' }]}
                    >
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} // Định dạng hiển thị
                            parser={value => value.replace(/\$\s?|(,*)/g, '')} // Parse giá trị nhập vào
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default StudentList;