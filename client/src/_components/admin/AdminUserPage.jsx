// AdminUserPage.jsx (Chỉ cập nhật phần handleFormSubmit)
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, message, Row, Col, DatePicker, Popconfirm, Tag, Descriptions, } from 'antd';
import {
    PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, ManOutlined, WomanOutlined, EyeOutlined } from '@ant-design/icons';
import { useFetchWrapper } from '_helpers';
import moment from 'moment';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const AdminUserPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formActionLoading, setFormActionLoading] = useState(false);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [error, setError] = useState(null);
    const fetchWrapper = useFetchWrapper();

    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedUserForDetail, setSelectedUserForDetail] = useState(null); // Sẽ dùng để hiển thị user mới tạo

    const USER_ROLES = ['Student', 'teacher', 'admin'];
    const GENDERS = ['male', 'female'];

    const initialFormValues = {
        name: '',
        role: USER_ROLES[0],
        gender: GENDERS[0],
        phone_number: '',
        parent_number: '',
        location: '',
        date_of_birth: null,
        email: '',
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const responseData = await fetchWrapper.get(`/api/admin/users`);
            const data = await responseData.json();

            if (data && Array.isArray(data.message)) {
                setUsers(data.message);
            } else {
                console.error("Users API response không hợp lệ:", data);
                setError("Không thể tải danh sách người dùng.");
                setUsers([]);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách người dùng:", err);
            setError(err.message || "Lỗi kết nối khi tải người dùng.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [fetchWrapper]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const showAddModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue(initialFormValues);
        setIsFormModalVisible(true);
    };

    const showEditModal = (userRecord) => {
        setEditingUser(userRecord._id);
        const dob = userRecord.date_of_birth ? moment(userRecord.date_of_birth) : null;
        form.setFieldsValue({
            ...userRecord,
            date_of_birth: dob,
        });
        setIsFormModalVisible(true);
    };

    const showDetailModal = (userRecord) => {
        setSelectedUserForDetail(userRecord);
        setIsDetailModalVisible(true);
    };

    const handleCancelFormModal = () => {
        setIsFormModalVisible(false);
        setEditingUser(null);
        form.resetFields();
    };

    const handleCancelDetailModal = () => {
        setIsDetailModalVisible(false);
        setSelectedUserForDetail(null);
    };

    const handleFormSubmit = async (values) => {
        setFormActionLoading(true);
        setError(null);

        const payload = { ...values };

        if (payload.date_of_birth) {
            payload.date_of_birth = payload.date_of_birth.valueOf();
        }

        delete payload.vnu_id;
        delete payload.username;
        delete payload.password;
        
        try {
            if (editingUser) {
                await fetchWrapper.put(`/api/admin/users/edit/${editingUser}`, 'application/json', payload);
                message.success(`Đã cập nhật người dùng: ${payload.name || payload.username}`);
            } else {
                const response = await fetchWrapper.post('/api/admin/users/create', 'application/json', payload);
                const responseData = await response.json();
                
                if (responseData.status === "Success" && responseData.message && responseData.message.user) {
                    const newUserInfo = responseData.message.user;
                    const generatedPassword = responseData.message.generatedPassword || 'Không hiển thị';

                    // Cập nhật selectedUserForDetail để hiển thị trong Modal chi tiết
                    setSelectedUserForDetail({
                        ...newUserInfo,
                        generatedPassword: generatedPassword // Thêm mật khẩu tạm thời vào đây
                    });
                    setIsDetailModalVisible(true); // Hiển thị Modal chi tiết

                    message.success(`Đã thêm người dùng mới: ${newUserInfo.name || newUserInfo.username}`, 3); // Giữ tin nhắn ngắn gọn
                } else {
                    message.success(`Đã thêm người dùng mới: ${payload.name || payload.username}`, 3);
                }
            }
            fetchUsers(); // Tải lại danh sách để hiển thị người dùng mới/đã cập nhật
            setIsFormModalVisible(false); // Đóng form modal
            setEditingUser(null);
            form.resetFields();
        } catch (err) {
            console.error("Lỗi khi lưu người dùng:", err);
            const apiErrorMessage = err.response?.data?.message || err.response?.data?.error;
            let displayMessage = apiErrorMessage || err.message || 'Lưu thông tin người dùng thất bại. Vui lòng thử lại.';

            message.error(displayMessage, 7);
            setError(displayMessage);
        } finally {
            setFormActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        setError(null);
        try {
            await fetchWrapper.delete(`/api/admin/users/delete/${userId}`);
            message.success('Đã xóa người dùng thành công.');
            fetchUsers();
        } catch (err) {
            console.error("Lỗi khi xóa người dùng:", err);
            const apiErrorMessage = err.response?.data?.message || err.response?.data?.error;
            const displayMessage = apiErrorMessage || err.message || 'Xóa người dùng thất bại.';
            message.error(displayMessage);
            setError(displayMessage);
        }
    };

    const columns = [
        {
            title: 'VNU ID',
            dataIndex: 'vnu_id',
            key: 'vnu_id',
            sorter: (a, b) => a.vnu_id.localeCompare(b.vnu_id),
        },
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username',
            sorter: (a, b) => a.username.localeCompare(b.username),
        },
        {
            title: 'Họ tên',
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
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'geekblue';
                if (role === 'teacher') color = 'volcano';
                else if (role === 'admin') color = 'green';
                return <Tag color={color}>{role.toUpperCase()}</Tag>;
            },
            filters: USER_ROLES.map(role => ({ text: role.charAt(0).toUpperCase() + role.slice(1), value: role })),
            onFilter: (value, record) => record.role.indexOf(value) === 0,
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            render: (gender) => gender === 'male' ? 'Nam' : 'Nữ',
            filters: GENDERS.map(g => ({ text: g === 'male' ? 'Nam' : 'Nữ', value: g })),
            onFilter: (value, record) => record.gender.indexOf(value) === 0,
        },
        {
            title: 'SĐT',
            dataIndex: 'phone_number',
            key: 'phone_number',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button icon={<EyeOutlined />} onClick={() => showDetailModal(record)} title="Xem chi tiết"></Button>
                    <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} title="Sửa"></Button>
                    <Popconfirm
                        title={`Bạn có chắc muốn xóa người dùng "${record.name || record.username}"?`}
                        onConfirm={() => handleDeleteUser(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />} title="Xóa"></Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filteredUsers = users.filter(user => {
        const searchLower = searchText.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.vnu_id && user.vnu_id.toLowerCase().includes(searchLower)) ||
            (user.username && user.username.toLowerCase().includes(searchLower)) ||
            (user.phone_number && user.phone_number.includes(searchText))
        );
    });

    const currentRoleInForm = Form.useWatch('role', form);

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24, flexWrap: 'wrap', gap: '16px' }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>Quản lý Người dùng</Title>
                </Col>
                <Col>
                    <Space wrap>
                        <Search
                            placeholder="Tìm theo tên, email, VNU ID, SĐT, Username..."
                            allowClear
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            enterButton={<SearchOutlined />}
                            onSearch={value => setSearchText(value)}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                            Thêm Người dùng
                        </Button>
                    </Space>
                </Col>
            </Row>

            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            <Table
                columns={columns}
                dataSource={filteredUsers}
                loading={loading}
                rowKey="_id"
                scroll={{ x: 'max-content' }}
            />

            {/* Modal để thêm/chỉnh sửa người dùng */}
            <Modal
                title={editingUser ? "Chỉnh sửa Người dùng" : "Thêm Người dùng mới"}
                visible={isFormModalVisible}
                onCancel={handleCancelFormModal}
                width={700}
                destroyOnClose
                footer={
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button key="cancel" onClick={handleCancelFormModal} disabled={formActionLoading}>
                            Hủy
                        </Button>
                        <Button
                            key="submit"
                            type="primary"
                            htmlType="submit"
                            form="userForm"
                            loading={formActionLoading}
                        >
                            {editingUser ? "Lưu thay đổi" : "Thêm mới"}
                        </Button>
                    </Space>
                }
            >
                <Form
                    id="userForm"
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    initialValues={initialFormValues}
                >
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="name"
                                label="Họ và tên"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' }
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="example@domain.com" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="phone_number"
                                label="Số điện thoại"
                                rules={[
                                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                                ]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="09xxxxxxxx" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="role"
                                label="Vai trò"
                                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                            >
                                <Select placeholder="Chọn vai trò">
                                    {USER_ROLES.map(role => (
                                        <Option key={role} value={role}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="gender"
                                label="Giới tính"
                                rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                            >
                                <Select placeholder="Chọn giới tính">
                                    {GENDERS.map(gender => (
                                        <Option key={gender} value={gender}>
                                            {gender === 'male' ? <><ManOutlined /> Nam</> : <><WomanOutlined /> Nữ</>}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="date_of_birth"
                                label="Ngày sinh"
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="location"
                        label="Địa chỉ"
                    >
                        <Input prefix={<HomeOutlined />} placeholder="Ví dụ: Rạch Giá, Kiên Giang" />
                    </Form.Item>

                    {currentRoleInForm === 'Student' && (
                        <>
                            <Title level={5} style={{ marginTop: '20px', color: '#0050b3' }}>Thông tin Học sinh</Title>
                            <Form.Item
                                name="parent_number"
                                label="SĐT Phụ huynh"
                                rules={[
                                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại phụ huynh không hợp lệ!' }
                                ]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="SĐT cha/mẹ (nếu có)" />
                            </Form.Item>
                            <Paragraph type="secondary">
                                Các lớp đã đăng ký và hoàn thành của học sinh thường được quản lý ở một giao diện khác.
                            </Paragraph>
                        </>
                    )}

                    {currentRoleInForm === 'teacher' && (
                        <>
                            <Title level={5} style={{ marginTop: '20px', color: '#d46b08' }}>Thông tin Giáo viên</Title>
                            <Paragraph type="secondary">
                                Thông tin các lớp học giảng dạy/trợ giảng của giáo viên thường sẽ được cập nhật tự động khi quản lý lớp học.
                            </Paragraph>
                        </>
                    )}
                    {currentRoleInForm === 'admin' && (
                        <>
                            <Title level={5} style={{ marginTop: '20px', color: '#389e0d' }}>Thông tin Quản trị viên</Title>
                            <Paragraph type="secondary">
                                Quản trị viên có quyền truy cập cao nhất hệ thống.
                            </Paragraph>
                        </>
                    )}
                </Form>
            </Modal>

            {/* Modal để hiển thị chi tiết người dùng */}
            <Modal
                title="Chi tiết Người dùng"
                visible={isDetailModalVisible}
                onCancel={handleCancelDetailModal}
                footer={[
                    <Button key="back" onClick={handleCancelDetailModal}>Đóng</Button>,
                    selectedUserForDetail && (
                        <Button key="edit" type="primary" onClick={() => {
                            handleCancelDetailModal();
                            showEditModal(selectedUserForDetail);
                        }}>
                            Sửa thông tin
                        </Button>
                    ),
                ]}
                width={600}
            >
                {selectedUserForDetail ? (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="VNU ID">{selectedUserForDetail.vnu_id}</Descriptions.Item>
                        <Descriptions.Item label="Tên đăng nhập">{selectedUserForDetail.username}</Descriptions.Item>
                        {/* Hiển thị mật khẩu tạm thời chỉ khi đây là người dùng vừa được tạo */}
                        {selectedUserForDetail.generatedPassword && (
                            <Descriptions.Item label="Mật khẩu tạm thời">
                                <span style={{ fontWeight: 'bold', color: 'red' }}>{selectedUserForDetail.generatedPassword}</span>
                                <br />
                                <small>(Người dùng nên thay đổi sau lần đăng nhập đầu tiên)</small>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Họ và tên">{selectedUserForDetail.name}</Descriptions.Item>
                        <Descriptions.Item label="Email">{selectedUserForDetail.email}</Descriptions.Item>
                        <Descriptions.Item label="Vai trò">
                            <Tag color={selectedUserForDetail.role === 'teacher' ? 'volcano' : selectedUserForDetail.role === 'admin' ? 'green' : 'geekblue'}>
                                {selectedUserForDetail.role?.toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới tính">
                            {selectedUserForDetail.gender === 'male' ? 'Nam' : 'Nữ'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{selectedUserForDetail.phone_number || 'Chưa có'}</Descriptions.Item>
                        {selectedUserForDetail.role === 'Student' && (
                            <Descriptions.Item label="SĐT Phụ huynh">
                                {selectedUserForDetail.parent_number || 'Chưa có'}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Địa chỉ">{selectedUserForDetail.location || 'Chưa có'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {selectedUserForDetail.date_of_birth ? moment(selectedUserForDetail.date_of_birth).format('DD/MM/YYYY') : 'Chưa có'}
                        </Descriptions.Item>
                        {selectedUserForDetail.role === 'teacher' && selectedUserForDetail.teachingClasses && selectedUserForDetail.teachingClasses.length > 0 && (
                            <Descriptions.Item label="Các lớp giảng dạy">
                                {selectedUserForDetail.teachingClasses.join(', ')}
                            </Descriptions.Item>
                        )}
                         {selectedUserForDetail.role === 'Student' && selectedUserForDetail.enrolledClasses && selectedUserForDetail.enrolledClasses.length > 0 && (
                            <Descriptions.Item label="Các lớp đã đăng ký">
                                {selectedUserForDetail.enrolledClasses.join(', ')}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                ) : (
                    <Paragraph>Không có thông tin người dùng được chọn.</Paragraph>
                )}
            </Modal>
        </div>
    );
};

export { AdminUserPage };