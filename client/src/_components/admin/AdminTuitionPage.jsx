import React, { useEffect, useState } from 'react';
import { Layout, Typography, Table, Input, Button, Modal, Form, InputNumber, message, Space, Tag } from 'antd'; // Thêm Tag để hiển thị trạng thái
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import { useFetchWrapper } from '_helpers';
import { useRecoilValue } from 'recoil';
import { authAtom } from '_state';

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

export function AdminTuitionPage() {
    const fetchWrapper = useFetchWrapper();
    const auth = useRecoilValue(authAtom);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [currentClassPayment, setCurrentClassPayment] = useState(null); // Lưu thông tin paymentStatus của lớp đang chọn
    const [form] = Form.useForm();

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Gọi API mới để lấy danh sách học sinh kèm thông tin học phí
            const response = await fetchWrapper.get('/api/admin/students-with-tuition');
            const data = await response.json();
            console.log("thông tin cần biết: ", data.message)
            if (data && data.message) {
                setStudents(data.message);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách học sinh:", error);
            message.error("Không thể tải danh sách học sinh.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleSearch = (value) => {
        setSearchText(value.toLowerCase());
    };

    const handleEditTuition = (student) => {
        setCurrentStudent(student);
        // Hiện tại, giả định chúng ta sẽ chỉnh sửa paymentStatus cho lớp đầu tiên của học sinh
        // Hoặc bạn có thể thêm dropdown để chọn lớp nếu học sinh học nhiều lớp
        const paymentForClass = student.paymentStatus && student.paymentStatus.length > 0
            ? student.paymentStatus[0] : { classId: null, className: 'Chưa có lớp', classFee: 0, amountPaid: 0, status: 'unpaid' };

        setCurrentClassPayment(paymentForClass); // Lưu thông tin payment của lớp đang chỉnh sửa

        form.setFieldsValue({
            studentName: student.name,
            className: paymentForClass.className, // Hiển thị tên lớp
            totalClassFee: paymentForClass.classFee, // Hiển thị tổng học phí của lớp
            amountPaid: paymentForClass.amountPaid || 0,
        });
        setIsEditModalVisible(true);
    };

    const handleUpdateTuition = async (values) => {
        if (!currentStudent || !currentClassPayment || !currentClassPayment.classId) {
            message.error("Không đủ thông tin để cập nhật học phí.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                studentId: currentStudent._id,
                classId: currentClassPayment.classId, // Gửi classId của lớp đang cập nhật
                amountPaid: values.amountPaid
            };

            const response = await fetchWrapper.post('/api/admin/update-student-tuition', 'application/json', payload);

            if (response && response.status === 200) {
                message.success("Cập nhật học phí thành công!");
                setIsEditModalVisible(false);
                fetchStudents(); // Tải lại danh sách sau khi cập nhật
            } else {
                message.error(response.message || "Có lỗi khi cập nhật học phí.");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật học phí:", error);
            message.error("Không thể cập nhật học phí.");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchText) ||
        student.vnu_id.toLowerCase().includes(searchText) ||
        (student.email && student.email.toLowerCase().includes(searchText))
    );

    const columns = [
        {
            title: 'Mã học sinh',
            dataIndex: 'vnu_id',
            key: 'vnu_id',
            sorter: (a, b) => a.vnu_id.localeCompare(b.vnu_id),
        },
        {
            title: 'Tên học sinh',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number',
        },
        {
            title: 'Lớp học',
            key: 'className',
            render: (_, record) => {
                // Hiển thị tên lớp của paymentStatus đầu tiên hoặc tất cả các lớp
                return record.paymentStatus && record.paymentStatus.length > 0 ?
                    record.paymentStatus.map(p => p.className).join(', ') : 'Chưa có lớp';
            }
        },
        {
            title: 'Tổng học phí (VND)',
            key: 'totalClassFee',
            render: (_, record) => {
                // Hiển thị tổng học phí của lớp đầu tiên hoặc tổng nếu có nhiều lớp
                const fee = record.paymentStatus && record.paymentStatus.length > 0
                    ? record.paymentStatus[0].classFee : 0;
                return `${fee.toLocaleString('vi-VN')} VND`;
            },
            sorter: (a, b) => {
                const feeA = (a.paymentStatus && a.paymentStatus.length > 0) ? a.paymentStatus[0].classFee : 0;
                const feeB = (b.paymentStatus && b.paymentStatus.length > 0) ? b.paymentStatus[0].classFee : 0;
                return feeA - feeB;
            },
        },
        {
            title: 'Số tiền đã đóng (VND)',
            key: 'amountPaid',
            render: (_, record) => {
                const paid = record.paymentStatus && record.paymentStatus.length > 0
                    ? record.paymentStatus[0].amountPaid : 0;
                return `${paid.toLocaleString('vi-VN')} VND`;
            },
            sorter: (a, b) => {
                const paidA = (a.paymentStatus && a.paymentStatus.length > 0) ? a.paymentStatus[0].amountPaid : 0;
                const paidB = (b.paymentStatus && b.paymentStatus.length > 0) ? b.paymentStatus[0].amountPaid : 0;
                return paidA - paidB;
            },
        },
        {
            title: 'Trạng thái thanh toán',
            key: 'status',
            render: (_, record) => {
                const status = record.currentPaymentStatus; // Sử dụng trạng thái đã tính toán từ backend
                let color;
                let text;
                switch (status) {
                    case 'paid':
                        color = 'green';
                        text = 'Đã thanh toán đủ';
                        break;
                    case 'partially_paid':
                        color = 'orange';
                        text = 'Đã thanh toán một phần';
                        break;
                    case 'unpaid':
                        color = 'red';
                        text = 'Chưa thanh toán';
                        break;
                    default:
                        color = 'gray';
                        text = 'Không xác định';
                }
                return <Tag color={color}>{text}</Tag>;
            },
            sorter: (a, b) => {
                const statusOrder = { 'paid': 3, 'partially_paid': 2, 'unpaid': 1, 'Chưa có thông tin': 0 };
                return statusOrder[a.currentPaymentStatus] - statusOrder[b.currentPaymentStatus];
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditTuition(record)}
                    >
                        Cập nhật học phí
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Layout style={{ padding: '24px' }}>
            <Content
                style={{
                    padding: 24,
                    margin: 0,
                    minHeight: 280,
                    background: '#fff',
                    borderRadius: 8,
                }}
            >
                <Title level={3} style={{ marginBottom: 24 }}>Quản lý Học phí</Title>
                <Search
                    placeholder="Tìm kiếm theo tên, mã học sinh, email..."
                    allowClear
                    enterButton
                    onSearch={handleSearch}
                    style={{ marginBottom: 20, width: 400 }}
                />
                <Table
                    columns={columns}
                    dataSource={filteredStudents}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />

                <Modal
                    title="Cập nhật Học phí"
                    visible={isEditModalVisible}
                    onCancel={() => setIsEditModalVisible(false)}
                    footer={null}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateTuition}
                    >
                        <Form.Item
                            name="studentName"
                            label="Tên học sinh"
                        >
                            <Input readOnly />
                        </Form.Item>
                        <Form.Item
                            name="className"
                            label="Lớp học"
                        >
                            <Input readOnly />
                        </Form.Item>
                        <Form.Item
                            name="totalClassFee"
                            label="Tổng học phí lớp (VND)"
                        >
                            <Input readOnly />
                        </Form.Item>
                        <Form.Item
                            name="amountPaid"
                            label="Số tiền đã đóng (VND)"
                            rules={[
                                { required: true, message: 'Vui lòng nhập số tiền đã đóng!' },
                                { type: 'number', min: 0, message: 'Số tiền phải là số không âm!' }
                            ]}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Cập nhật
                            </Button>
                            <Button onClick={() => setIsEditModalVisible(false)} style={{ marginLeft: 8 }}>
                                Hủy
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>
        </Layout>
    );
}