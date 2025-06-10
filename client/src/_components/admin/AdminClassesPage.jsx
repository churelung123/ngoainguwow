// src/_components/admin/AdminClassesPage.jsx
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; // Sử dụng useHistory cho React Router v5
import {
    Row, Col, Button, Modal, Form, Input, Space, Typography, message,
    InputNumber, DatePicker, TimePicker, Checkbox, Select
} from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useFetchWrapper } from '_helpers'; // Giả sử bạn có hook này
// import { useAuthWrapper } from '_helpers'; // Nếu cần
import ItemCard from './ItemCard';
import moment from 'moment';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select; // Nếu bạn dùng Select với Option

const initialFormValues = {
    className: '',
    classId: '',
    course_code: null,
    teacher_id: '', // Hoặc giá trị mặc định phù hợp
    assistantTeachers_ids: [],
    classFee: null,    // classFee giờ nằm ở cấp ngoài
    schedule: {
        totalSessions: null,
        daysOfWeek: [],
        startTime: null,
        sessionDuration: null,
        startDate: null,
        endDate: null,
        room: '',
    },
};

const daysOfWeekOptions = [
    { label: 'Thứ 2', value: 'Monday' },
    { label: 'Thứ 3', value: 'Tuesday' },
    { label: 'Thứ 4', value: 'Wednesday' },
    { label: 'Thứ 5', value: 'Thursday' },
    { label: 'Thứ 6', value: 'Friday' },
    { label: 'Thứ 7', value: 'Saturday' },
    { label: 'Chủ Nhật', value: 'Sunday' },
];

const dayNameToIsoWeekday = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
    'Friday': 5, 'Saturday': 6, 'Sunday': 7
};

const mockUsers = [
    { _id: 'user1', name: 'Giáo viên A (GV001)' },
    { _id: 'user2', name: 'Giáo viên B (GV002)' },
    { _id: 'user3', name: 'Trợ giảng X (TA001)' },
    { _id: 'user4', name: 'Trợ giảng Y (TA002)' },
    { _id: 'user5', name: 'Trợ giảng Z (TA003)' },
];

const AdminClassesPage = () => {
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]); // State để lưu danh sách khóa học
    const [loading, setLoading] = useState(false); // Loading chung cho trang
    const [formActionLoading, setFormActionLoading] = useState(false); // Loading cho các action của form (submit, delete)
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingClass, setEditingClass] = useState(null); // Lưu trữ class đang sửa (_id hoặc toàn bộ object)
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [error, setError] = useState(null);
    const [users, setUsers] = useState(mockUsers);

    const fetchWrapper = useFetchWrapper();
    const history = useHistory();

    // Watchers cho việc tính toán endDate
    const watchedStartDate = Form.useWatch(['schedule', 'startDate'], form);
    const watchedDaysOfWeek = Form.useWatch(['schedule', 'daysOfWeek'], form);
    const watchedTotalSessions = Form.useWatch(['schedule', 'totalSessions'], form);
    const watchedCourseCode = Form.useWatch('course_code', form); // Theo dõi mã khóa học được chọn
    const watchedCourseCodeForClassId = Form.useWatch('course_code', form);
    const [selectedCourseStandardFee, setSelectedCourseStandardFee] = useState(null);


    // Fetch danh sách lớp học
    const fetchClasses = async () => {
        setLoading(true);
        setError(null);
        try {
            // Ví dụ URL, thay thế bằng API endpoint của bạn
            const response = await fetchWrapper.get(`/api/admin/classes/get`);
            const data = await response.json();
            if (data && data.message && Array.isArray(data.message.classes)) { // Hoặc cấu trúc khác
                setClasses(data.message.classes);
            }
            else {
                console.error("API response for classes is not an array:", data);
                setError("Dữ liệu lớp học không hợp lệ.");
                setClasses([]);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách lớp học:", err);
            setError(err.message || "Lỗi kết nối khi tải lớp học.");
            setClasses([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch danh sách khóa học (để chọn trong form)
    const fetchCourses = async () => {
        // setCoursesLoading(true); 
        try {
            const response = await fetchWrapper.get(`/api/admin/courses/get`); // API endpoint của bạn
            const data = await response.json();
            if (data && Array.isArray(data.data)) {
                setCourses(data.data);
            } else {
                setCourses([]);
                console.error("Courses API response không hợp lệ:", data);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách khóa học:", err);
            setCourses([]);
        } finally {
            // setCoursesLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            // const response = await fetchWrapper.get(`/api/users/get?roles=teacher,assistant`); // Ví dụ
            // const data = await response.json();
            // if (data && data.success && Array.isArray(data.data)) {
            //     setUsers(data.data);
            // } else {
            //     // setUsers(mockUsers); // Fallback to mock data if API fails
            //     console.error("Users API response không hợp lệ, sử dụng mock data:", data);
            // }
            setUsers(mockUsers); // Hiện tại dùng mock data
        } catch (err) {
            console.error("Lỗi khi tải danh sách người dùng, sử dụng mock data:", err);
            // setUsers(mockUsers); // Fallback
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchCourses();
        fetchUsers();
    }, []);

    // Tính toán ngày kết thúc dự kiến
    useEffect(() => {
        if (isModalVisible && watchedStartDate && watchedDaysOfWeek && watchedDaysOfWeek.length > 0 && watchedTotalSessions > 0) {
            let currentDate = moment(watchedStartDate).clone();
            let sessionsScheduled = 0;
            const targetIsoWeekdays = watchedDaysOfWeek.map(dayString => dayNameToIsoWeekday[dayString]).filter(Boolean);

            if (targetIsoWeekdays.length === 0) {
                form.setFieldsValue({ schedule: { ...form.getFieldValue('schedule'), endDate: null } });
                return;
            }

            let iterations = 0;
            const maxIterations = watchedTotalSessions * 7 * 2;

            while (sessionsScheduled < watchedTotalSessions) {
                if (iterations >= maxIterations) {
                    form.setFieldsValue({ schedule: { ...form.getFieldValue('schedule'), endDate: null } });
                    return;
                }
                if (targetIsoWeekdays.includes(currentDate.isoWeekday())) {
                    sessionsScheduled++;
                }
                if (sessionsScheduled < watchedTotalSessions) {
                    currentDate.add(1, 'days');
                }
                iterations++;
            }
            form.setFieldsValue({ schedule: { ...form.getFieldValue('schedule'), endDate: currentDate } });
        } else if (isModalVisible) {
            const currentEndDate = form.getFieldValue(['schedule', 'endDate']);
            if (currentEndDate !== null && (!watchedStartDate || !watchedDaysOfWeek || watchedDaysOfWeek.length === 0 || !watchedTotalSessions || watchedTotalSessions <= 0)) {
                form.setFieldsValue({ schedule: { ...form.getFieldValue('schedule'), endDate: null } });
            }
        }
    }, [isModalVisible, watchedStartDate, watchedDaysOfWeek, watchedTotalSessions, form]);

    // Hiển thị học phí gốc của khóa học được chọn
    useEffect(() => {
        if (!isModalVisible) {
            setSelectedCourseStandardFee(null);
            return;
        }
        // Giả sử course_code trong form là _id của khóa học
        const selectedCourse = courses.find(course => course._id === watchedCourseCodeForClassId);

        if (selectedCourse && typeof selectedCourse.course_fee !== 'undefined') {
            setSelectedCourseStandardFee(selectedCourse.course_fee);
            if (!editingClass || (editingClass && watchedCourseCodeForClassId !== (editingClass.course_code?._id || editingClass.course_code))) {
                form.setFieldsValue({ classFee: selectedCourse.course_fee });
            }
        } else {
            setSelectedCourseStandardFee(null);
        }
    }, [watchedCourseCodeForClassId, courses, isModalVisible, editingClass, form]);


    const generateClassId = async (courseId) => {
        if (!courseId) return '';
        const course = courses.find(c => c._id === courseId);
        if (!course || !course.course_code) return '';

        const baseClassId = course.course_code.toUpperCase();
        let newClassId = baseClassId;
        let counter = 1;

        // Kiểm tra sự tồn tại của classId (cần danh sách classes đã fetch)
        // eslint-disable-next-line no-loop-func
        while (classes.some(cls => cls.classId === newClassId && cls._id !== editingClass?._id)) {
            newClassId = `${baseClassId}-${String(counter).padStart(2, '0')}`;
            counter++;
        }
        return newClassId;
    };

    // Theo dõi course_code để tự động tạo classId khi thêm mới
    useEffect(() => {
        if (isModalVisible && !editingClass && watchedCourseCodeForClassId) {
            generateClassId(watchedCourseCodeForClassId).then(generatedId => {
                form.setFieldsValue({ classId: generatedId });
            });
        }
        // Nếu đang sửa và classId rỗng (có thể xảy ra nếu dữ liệu cũ không có), cũng có thể tạo mới
        else if (isModalVisible && editingClass && !form.getFieldValue('classId') && watchedCourseCodeForClassId) {
            generateClassId(watchedCourseCodeForClassId).then(generatedId => {
                form.setFieldsValue({ classId: generatedId });
            });
        }
    }, [watchedCourseCodeForClassId, isModalVisible, editingClass, form, classes]);


    const showAddModal = () => {
        setEditingClass(null);
        form.resetFields();
        form.setFieldsValue(initialFormValues); // Đặt giá trị mặc định cho form thêm mới
        setSelectedCourseStandardFee(null);
        setIsModalVisible(true);
    };

    const showEditModal = async (record) => {
        console.log("Dữ liệu record nhận được để chỉnh sửa:", JSON.stringify(record, null, 2)); // Log chi tiết hơn

        // Dữ liệu mặc định cho schedule nếu record.schedule không tồn tại hoặc thiếu trường
        const defaultSchedule = {
            totalSessions: null,
            sessionDuration: null,
            daysOfWeek: [],
            startTime: null,
            room: '',
            startDate: null,
        };

        const currentSchedule = record.schedule || defaultSchedule;

        let assistantVnuIdsToSet = [];
        // Ưu tiên trường `assistantTeachers` nếu API trả về mảng object đã populate đầy đủ
        if (Array.isArray(record.assistantTeachers) && record.assistantTeachers.length > 0) {
            assistantVnuIdsToSet = record.assistantTeachers
                .map(at => at && at.vnu_id ? String(at.vnu_id) : null)
                .filter(id => id != null);
        }
        // Fallback: Nếu API trả về `assistantTeachers_ids` chứa các object đã populate (ít phổ biến hơn nếu đã có `assistantTeachers`)
        else if (Array.isArray(record.assistantTeachers_ids) && record.assistantTeachers_ids.length > 0) {
             assistantVnuIdsToSet = record.assistantTeachers_ids
                .map(at => (typeof at === 'object' && at !== null && at.vnu_id) ? String(at.vnu_id) : null)
                .filter(id => id != null);
        }


        const formData = {
            classId: record.classId,
            className: record.className,
            course_code: record.course?._id,
            teacher_id: record.teacher?.vnu_id,
            assistantTeachers_ids: assistantVnuIdsToSet,
            classFee: record.classFee || currentSchedule.classFee,

            schedule: {
                totalSessions: currentSchedule.totalSessions,
                sessionDuration: currentSchedule.sessionDuration,
                daysOfWeek: currentSchedule.daysOfWeek || [], // Đảm bảo là mảng
                room: currentSchedule.room,
                startTime: currentSchedule.startTime ? moment(currentSchedule.startTime, 'HH:mm') : null,
                startDate: currentSchedule.startDate ? moment(currentSchedule.startDate) : null,
                // endDate sẽ được tính tự động hoặc lấy từ currentSchedule.endDate nếu có
                endDate: currentSchedule.endDate ? moment(currentSchedule.endDate) : null,
            }
        };

        console.log("Dữ liệu sẽ được set cho form (formData):", JSON.stringify(formData, null, 2));

        setEditingClass(record);
        form.resetFields();
        form.setFieldsValue(formData);

        if (!formData.classId && formData.course_code) {
            const generatedId = await generateClassId(formData.course_code);
            form.setFieldsValue({ classId: generatedId });
        }

        // Cập nhật học phí gốc của khóa học được chọn
        const selectedCourseInfo = courses.find(course => course._id === formData.course_code);
        if (selectedCourseInfo && typeof selectedCourseInfo.course_fee !== 'undefined') {
            setSelectedCourseStandardFee(selectedCourseInfo.course_fee);
        } else {
            setSelectedCourseStandardFee(null);
        }

        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setEditingClass(null);
        form.resetFields();
        setSelectedCourseStandardFee(null);
    };

    const handleFormSubmit = async (values) => {
        setFormActionLoading(true);
        setError(null);

        const classIdExists = classes.some(
            cls => cls.classId === values.classId && cls._id !== editingClass?._id
        );

        if (classIdExists) {
            message.error(`Mã lớp "${values.classId}" đã tồn tại. Vui lòng chọn mã khác.`);
            form.setFields([{ name: 'classId', errors: ['Mã lớp này đã tồn tại!'] }]);
            setFormActionLoading(false);
            return;
        }

        // values từ form sẽ có startTime và startDate là moment objects
        // Cần chuyển đổi chúng về định dạng schema yêu cầu trước khi gửi
        const schedulePayload = {
            totalSessions: values.schedule?.totalSessions,
            daysOfWeek: values.schedule?.daysOfWeek || [],
            // Chuyển startTime (moment object) về string "HH:mm"
            startTime: values.schedule?.startTime ? values.schedule.startTime.format('HH:mm') : null,
            sessionDuration: values.schedule?.sessionDuration,
            // Chuyển startDate (moment object) về Date (ISOString thường dùng cho API)
            startDate: values.schedule?.startDate ? values.schedule.startDate.toISOString() : null,
            // endDate cũng tương tự nếu bạn gửi nó lên
            endDate: values.schedule?.endDate ? values.schedule.endDate.toISOString() : null,
            room: values.schedule?.room,
        };

        const payload = {
            classId: values.classId,
            className: values.className,
            course_code: values.course_code, // Đảm bảo đây là ObjectId của course
            teacher_id: values.teacher_id,   // Đảm bảo đây là ObjectId của teacher
            assistantTeachers_ids: values.assistantTeachers_ids || [],
            classFee: values.classFee,       // classFee ở cấp ngoài
            schedule: schedulePayload,
            // Các trường khác như assistantTeachers_ids, students_ids, tests nếu có trên form
        };
        // Nếu là chỉnh sửa, không gửi _id của class trong payload nếu API không cho phép
        // delete payload._id; (tùy thuộc vào API của bạn)

        console.log("Payload sẽ gửi lên API:", JSON.stringify(payload, null, 2));

        try {
            if (editingClass && editingClass._id) {
                const classId = editingClass._id;
                await fetchWrapper.put(`/api/admin/classes/edit/${classId}`, 'application/json', payload);
                message.success(`Đã cập nhật lớp học: ${payload.className}`);
            } else {
                await fetchWrapper.post('/api/admin/classes/create', 'application/json', payload);
                message.success(`Đã thêm lớp học mới: ${payload.className}`);
            }
            fetchClasses();
            setIsModalVisible(false);
            setEditingClass(null);
            form.resetFields();
            setSelectedCourseStandardFee(null);
        } catch (err) {
            console.error("Lỗi khi lưu lớp học:", err);
            const apiError = err.response?.data?.message || err.message;
            message.error(apiError || 'Lưu thông tin lớp học thất bại.');
            setError(apiError || 'Lưu thông tin lớp học thất bại.');
        } finally {
            setFormActionLoading(false);
        }
    };

    const handleViewDetailsFromModal = () => {
        if (editingClass && editingClass._id) {
            const classId = editingClass._id;
            history.push(`/class/${classId}`); // Điều hướng đến trang chi tiết
            setIsModalVisible(false);
        } else {
            message.error("Không tìm thấy thông tin lớp để xem chi tiết.");
        }
    };

    const handleDeleteFromEditModal = () => {
        if (!editingClass || !editingClass._id) return;

        const classId = editingClass._id;
        const classNameToDelete = form.getFieldValue('className') || editingClass.className || "lớp học này";

        Modal.confirm({
            title: 'Xác nhận xóa lớp học',
            content: `Bạn có chắc chắn muốn xóa lớp học "${classNameToDelete}" không? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setFormActionLoading(true);
                try {
                    // await fetchWrapper.delete(`/api/admin/classes/delete/${classId}`);
                    console.log("Deleting class:", classId);
                    message.success(`Đã xóa lớp học: ${classNameToDelete}`);
                    fetchClasses();
                    setIsModalVisible(false);
                    setEditingClass(null);
                    form.resetFields();
                    setSelectedCourseStandardFee(null);
                } catch (err) {
                    console.error("Lỗi khi xóa lớp học:", err);
                    const apiError = err.response?.data?.message || err.message;
                    message.error(apiError || 'Xóa lớp học thất bại.');
                } finally {
                    setFormActionLoading(false);
                }
            },
        });
    };

    const filteredClasses = Array.isArray(classes) ? classes.filter(cls =>
        (cls.className && cls.className.toLowerCase().includes(searchText.toLowerCase())) ||
        (cls.teacher_id && cls.teacher_id.toLowerCase().includes(searchText.toLowerCase())) ||
        (cls.course_code && (typeof cls.course_code === 'string' ? cls.course_code.toLowerCase().includes(searchText.toLowerCase()) : (cls.course_code?.course_name || cls.course_code?.course_code || '').toLowerCase().includes(searchText.toLowerCase())))
    ) : [];

    const courseOptions = courses.map(course => ({
        value: course._id, // Sử dụng _id làm value
        label: `${course.course_name} (${course.course_code})`, // Hiển thị tên và mã khóa học
    }));

    const teacherOptions = users
        .filter(user => user.role === 'teacher') // Nếu có trường role
        .map(user => ({
            value: user._id,
            label: user.name || user.username || user._id // Hiển thị tên nếu có
        }));

    const assistantTeacherOptions = users
        .filter(user => user.role === 'teacher') // TA có thể là GV
        .map(user => ({
            value: user._id,
            label: user.name || user.username || user._id
        }));


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '16px' }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Lớp học</Title>
                <Space>
                    <Search
                        placeholder="Tìm theo tên lớp, giáo viên, khóa học..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        enterButton={<SearchOutlined />}
                        onSearch={value => setSearchText(value)}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                        Thêm Lớp học
                    </Button>
                </Space>
            </div>

            {loading && <p>Đang tải danh sách lớp học...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
            {!loading && !error && classes.length > 0 && filteredClasses.length === 0 && <p>Không tìm thấy lớp học nào phù hợp.</p>}
            {!loading && !error && classes.length === 0 && <p>Chưa có lớp học nào. Hãy thêm lớp học mới!</p>}

            <Row gutter={[16, 24]}>
                {filteredClasses.map(cls => (
                    <Col key={cls._id} xs={24} sm={12} md={8} lg={6}>
                        <ItemCard
                            item={cls}
                            type="class"
                            onEdit={() => showEditModal(cls)}
                        />
                    </Col>
                ))}
            </Row>

            <Modal
                title={editingClass ? "Chỉnh sửa Lớp học" : "Thêm Lớp học mới"}
                visible={isModalVisible}
                onCancel={handleCancelModal}
                width={700}
                destroyOnClose // Quan trọng: reset trạng thái của form con khi modal đóng
                footer={
                    <div style={{ display: 'flex', justifyContent: editingClass ? 'space-between' : 'flex-end', width: '100%' }}>
                        <div>
                            {editingClass && (editingClass._id || editingClass.id) && (
                                <Space>
                                    <Button
                                        key="delete"
                                        danger
                                        onClick={handleDeleteFromEditModal}
                                        loading={formActionLoading}
                                        icon={<DeleteOutlined />}
                                    >
                                        Xóa lớp học
                                    </Button>
                                    <Button
                                        key="viewDetails"
                                        onClick={handleViewDetailsFromModal}
                                        icon={<EyeOutlined />}
                                        disabled={formActionLoading}
                                    >
                                        Xem chi tiết
                                    </Button>
                                </Space>
                            )}
                        </div>
                        <Space>
                            <Button key="cancel" onClick={handleCancelModal} disabled={formActionLoading}>
                                Hủy
                            </Button>
                            <Button
                                key="submit"
                                type="primary"
                                htmlType="submit"
                                form="classForm" // Liên kết với ID của Form
                                loading={formActionLoading}
                            >
                                {editingClass ? "Lưu thay đổi" : "Thêm mới"}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Form
                    id="classForm"
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                // initialValues được set động trong showAddModal/showEditModal
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="className"
                                label="Tên lớp học"
                                rules={[{ required: true, message: 'Vui lòng nhập tên lớp học!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="course_code" // Sẽ lưu _id của khóa học
                                label="Khóa học"
                                rules={[{ required: true, message: 'Vui lòng chọn khóa học!' }]}
                            >
                                <Select
                                    placeholder="Chọn một khóa học"
                                    options={courseOptions}
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                // loading={coursesLoading} // Nếu có state loading riêng
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="classId"
                                label="Mã lớp học"
                                rules={[
                                    { required: true, message: 'Mã lớp học là bắt buộc!' },
                                    // Thêm validation nếu cần, ví dụ: không chứa ký tự đặc biệt
                                ]}
                                extra="Mã lớp được gợi ý dựa trên mã khóa học. Bạn có thể chỉnh sửa nếu cần."
                            >
                                <Input placeholder="Ví dụ: ANHVANCB-01" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {selectedCourseStandardFee !== null && (
                        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                            <Text type="secondary">Học phí gốc của khóa học đã chọn: </Text>
                            <Text strong>{selectedCourseStandardFee.toLocaleString('vi-VN')} VNĐ</Text>
                        </div>
                    )}

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="classFee"
                                label="Học phí lớp (VNĐ)"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập học phí cho lớp!' },
                                    { type: 'number', min: 0, message: 'Học phí không hợp lệ!' }
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Nhập học phí thực tế của lớp"
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => String(value).replace(/,*/g, '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="teacher_id"
                                label="Mã giáo viên (Teacher ID)"
                                rules={[{ required: true, message: 'Vui lòng nhập mã giáo viên!' }]}
                            >
                                <Input placeholder="Nhập ID hoặc mã của giáo viên" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name="assistantTeachers_ids"
                        label="Trợ giảng"
                    >
                        <Select
                            mode="multiple" // Cho phép chọn nhiều
                            placeholder="Chọn trợ giảng (nếu có)"
                            options={assistantTeacherOptions}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            allowClear
                        />
                    </Form.Item>

                    <Title level={5} style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                        Thông tin lịch học
                    </Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name={["schedule", "totalSessions"]}
                                label="Tổng số buổi học"
                                rules={[{ type: 'number', min: 1, message: 'Tổng số buổi học không hợp lệ!' }]}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="Ví dụ: 20" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name={["schedule", "sessionDuration"]}
                                label="Thời lượng mỗi buổi (phút)"
                                rules={[{ type: 'number', min: 15, message: 'Thời lượng không hợp lệ!' }]}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="Ví dụ: 90" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name={["schedule", "daysOfWeek"]}
                        label="Các ngày học trong tuần"
                        rules={[{ type: 'array', required: true, message: 'Vui lòng chọn ít nhất một ngày học!' }]}
                    >
                        <Checkbox.Group options={daysOfWeekOptions} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name={["schedule", "startTime"]}
                                label="Thời gian bắt đầu buổi học"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
                            >
                                <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="Chọn giờ" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name={["schedule", "room"]}
                                label="Phòng học"
                            >
                                <Input placeholder="Ví dụ: Phòng A101" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name={["schedule", "startDate"]}
                                label="Ngày bắt đầu lớp"
                                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name={["schedule", "endDate"]}
                                label="Ngày kết thúc lớp (dự kiến)"
                                extra="Ngày kết thúc được tính tự động."
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Tính tự động"
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export { AdminClassesPage };