// ClassDetail.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFetchWrapper } from '_helpers';
import { useParams } from 'react-router-dom';
// Đảm bảo đã import Form và InputNumber từ antd
import { Layout, Row, Col, Input, Spin, Alert, Button, Typography, Modal, Table, message, Space, Form, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

import ClassDetailInfo from './ClassDetailInfo';
import NotificationArea from './NotificationArea';
import TestManagement from './TestManagement';
import StudentList from './StudentList';
import AttendanceManagement from './AttendanceManagement';
import MyAttendanceView from './MyAttendanceView';
import StudentResultsView from './StudentResultsView';

const { Content } = Layout;
const { Search } = Input;

export function ClassDetail() {
  const { id: classId } = useParams();
  const fetchWrapper = useFetchWrapper();

  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [notifications, setNotifications] = useState([]);

  // State và hàm cho modal thêm học sinh
  const [isAddStudentModalVisible, setIsAddStudentModalVisible] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [addStudentSearchText, setAddStudentSearchText] = useState('');
  const [addingStudentLoading, setAddingStudentLoading] = useState(false);
  const [addStudentForm] = Form.useForm(); // Khởi tạo form instance

  // THÊM STATE MỚI ĐỂ LƯU THÔNG TIN HỌC SINH ĐƯỢC CHỌN TRƯỚC KHI MỞ MODAL
  const [selectedStudentForForm, setSelectedStudentForForm] = useState(null); // <-- Dòng này quan trọng

  const userData = useMemo(() => JSON.parse(localStorage.getItem('userData')), []);
  const initialActiveViewForStudent = useMemo(() => {
    return 'studentResults';
  }, []);

  const [activeView, setActiveView] = useState(
    userData?.role === 'Student' ? initialActiveViewForStudent : 'students'
  );

  const fetchClassDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWrapper.get(`/api/classes/${classId}/details`);
      const data = await response.json();

      if (data.status === "Success" && data.message) {
        setClassDetails(data.message);
      } else {
        setError("Không thể tải thông tin lớp học.");
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết lớp học:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetchWrapper.get(`/api/classes/${classId}/notifications`);
      const data = await response.json();
      if (data.status === 'Success' && data.message) {
        setNotifications(data.message);
      } else {
        console.error('Lỗi khi tải thông báo:', data.message);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    fetchNotifications();
  }, [classId]);

  const fetchAvailableStudents = useCallback(async () => {
    setAddingStudentLoading(true);
    try {
      const allStudentsResponse = await fetchWrapper.get('/api/users/students');
      const allStudentsData = await allStudentsResponse.json();

      if (allStudentsData.status === "Success") {
        const currentStudentIdsInClass = new Set(classDetails?.students_ids.map(s => s._id.toString()) || []);
        const studentsNotInClass = allStudentsData.message.users.filter(Student =>
          !currentStudentIdsInClass.has(Student._id.toString())
        );
        setAvailableStudents(studentsNotInClass);
      } else {
        message.error(allStudentsData.message || "Không thể tải danh sách học sinh.");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách học sinh:", error);
      message.error("Có lỗi xảy ra khi tải danh sách học sinh.");
    } finally {
      setAddingStudentLoading(false);
    }
  }, [fetchWrapper, classDetails]);

  // HÀM NÀY CHỈ LƯU HỌC SINH VÀ MỞ MODAL
  const handleSelectStudentForModal = (Student) => {
    console.log("Học sinh được chọn (trước khi set form):", Student); // DEBUG
    setSelectedStudentForForm(Student); // Lưu học sinh vào state
    setIsAddStudentModalVisible(true);
  };

  // useEffect này sẽ kích hoạt khi modal mở VÀ selectedStudentForForm thay đổi
  useEffect(() => {
    if (isAddStudentModalVisible && selectedStudentForForm) {
        addStudentForm.setFieldsValue({
            studentId: selectedStudentForForm._id,
            studentName: selectedStudentForForm.name,
            amountPaid: 0, // Mặc định số tiền là 0
        });
    } else if (!isAddStudentModalVisible) {
        // Reset form và state khi modal đóng
        addStudentForm.resetFields();
        setSelectedStudentForForm(null);
        setAddStudentSearchText('');
    }
  }, [isAddStudentModalVisible, selectedStudentForForm, addStudentForm]); // addAddStudentForm là dependency để tránh lỗi

  // Hàm xử lý thêm học sinh vào lớp (sau khi nhập học phí)
  const handleAddStudentFinal = useCallback(async (values) => {
    setAddingStudentLoading(true);
    const { studentId, studentName, amountPaid } = values;

    try {
      const response = await fetchWrapper.post(`/api/classes/${classId}/add-Student`, 'application/json', { studentId, amountPaid });
      const data = await response.json();

      if (data.status === "Success") {
        message.success(`Đã thêm học sinh ${studentName} vào lớp với số tiền đã đóng: ${amountPaid.toLocaleString('vi-VN')} VND.`);
        setIsAddStudentModalVisible(false); // Đóng modal
        // Không cần resetFields ở đây vì useEffect đã làm khi isAddStudentModalVisible = false
        fetchClassDetails(); // Tải lại chi tiết lớp để cập nhật danh sách học sinh và trạng thái học phí
      } else {
        message.error(data.message || "Không thể thêm học sinh vào lớp.");
      }
    } catch (error) {
      console.error("Lỗi khi thêm học sinh:", error);
      const apiErrorMessage = error.response?.data?.message || error.response?.data?.error;
      message.error(apiErrorMessage || "Có lỗi xảy ra khi thêm học sinh.");
    } finally {
      setAddingStudentLoading(false);
    }
  }, [classId, fetchWrapper, fetchClassDetails]);


  useEffect(() => {
    if (isAddStudentModalVisible && classDetails) {
      fetchAvailableStudents();
    }
  }, [isAddStudentModalVisible, classDetails]);


  const handleViewChange = (view) => {
    setActiveView(view);
    setSearchText('');
  };

  const getSearchPlaceholder = () => {
    if (activeView === 'students') return "Tìm kiếm theo VNU-ID hoặc tên học sinh";
    if (activeView === 'tests') return "Tìm kiếm theo tiêu đề bài kiểm tra";
    if (activeView === 'attendance') return "Tìm kiếm học sinh để điểm danh";
    return "Tìm kiếm...";
  };

  // Các cột cho bảng trong modal thêm học sinh (chọn học sinh)
  const selectStudentColumns = useMemo(() => [
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" onClick={() => handleSelectStudentForModal(record)}> {/* SỬ DỤNG HÀM MỚI */}
          Chọn và Thêm
        </Button>
      ),
    },
  ], [handleSelectStudentForModal]); // Cập nhật dependency

  const filteredAvailableStudents = useMemo(() => {
    return availableStudents.filter(Student =>
      Student.name?.toLowerCase().includes(addStudentSearchText.toLowerCase()) ||
      Student.vnu_id?.toLowerCase().includes(addStudentSearchText.toLowerCase()) ||
      Student.email?.toLowerCase().includes(addStudentSearchText.toLowerCase())
    );
  }, [availableStudents, addStudentSearchText]);


  if (loading) {
    return (
      <Layout style={{ padding: '24px' }}>
        <Content
          style={{
            background: '#fff',
            padding: 24,
            margin: 0,
            minHeight: 280,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spin size="large" tip="Đang tải thông tin lớp học..." />
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ padding: '24px' }}>
        <Content
          style={{
            background: '#fff',
            padding: 24,
            margin: 0,
            minHeight: 280,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Alert message="Lỗi" description={error} type="error" showIcon />
        </Content>
      </Layout>
    );
  }

  if (!classDetails) {
    return (
      <Layout style={{ padding: '24px' }}>
        <Content
          style={{
            background: '#fff',
            padding: 24,
            margin: 0,
            minHeight: 280,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Alert message="Không tìm thấy lớp học" description="Lớp học bạn đang tìm không tồn tại hoặc đã bị xóa." type="warning" showIcon />
        </Content>
      </Layout>
    );
  }

  return (
    <Content style={{ padding: '20px' }}>
      {classDetails &&
        <ClassDetailInfo
          classDetails={classDetails}
          classId={classId}
          notifications={notifications}
          userData={userData}
          fetchNotifications={fetchNotifications}
          fetchWrapper={fetchWrapper} />}
      <div style={{ marginTop: '20px' }}>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={10} md={8}>
            {(activeView === 'students' || activeView === 'tests' || activeView === 'attendance') && (userData?.role !== 'Student') && (
              <Search
                placeholder={getSearchPlaceholder()}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
              />
            )}
          </Col>
          <Col xs={24} sm={14} md={16} style={{ textAlign: 'right' }}>
            {(userData?.role === 'teacher' || userData?.role === 'admin') && (
              <>
                <Button
                  type={activeView === 'students' ? 'primary' : 'default'}
                  onClick={() => { setActiveView('students'); setSearchText(''); }}
                  style={{ marginRight: 8, borderRadius: '8px' }}
                >
                  Danh sách học sinh
                </Button>
                <Button
                  type={activeView === 'tests' ? 'primary' : 'default'}
                  onClick={() => { setActiveView('tests'); setSearchText(''); }}
                  style={{ marginRight: 8, borderRadius: '8px' }}
                >
                  Danh sách bài kiểm tra
                </Button>
                <Button
                  type={activeView === 'attendance' ? 'primary' : 'default'}
                  onClick={() => { setActiveView('attendance'); setSearchText(''); }}
                  style={{ borderRadius: '8px' }}
                >
                  Điểm danh
                </Button>
              </>
            )}
            {(userData?.role === 'Student') && (
              <>
                <Button
                  type={activeView === 'myAttendance' ? 'primary' : 'default'}
                  onClick={() => handleViewChange('myAttendance')}
                  style={{ borderRadius: '8px', marginRight: '8px' }}
                >
                  Điểm danh của tôi
                </Button>
                <Button
                  type={activeView === 'tests' ? 'primary' : 'default'}
                  onClick={() => handleViewChange('tests')}
                  style={{ borderRadius: '8px', marginRight: '8px' }}
                >
                  Danh sách bài kiểm tra
                </Button>
                <Button
                  type={activeView === 'studentResults' ? 'primary' : 'default'}
                  onClick={() => handleViewChange('studentResults')}
                  style={{ borderRadius: '8px' }}
                >
                  Kết quả học tập
                </Button>
              </>
            )}
          </Col>
        </Row>

        {activeView === 'students' && (userData?.role === 'teacher' || userData?.role === 'admin') && (
          <>
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Col>
                    <Typography.Title level={3} style={{ marginBottom: 0 }}>Danh sách học sinh:</Typography.Title>
                </Col>
                <Col>
                    {(userData?.role === 'admin' || userData?.role === 'teacher') && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                // Khi nhấn nút "Thêm học sinh", chỉ mở modal, useEffect sẽ reset form
                                setIsAddStudentModalVisible(true);
                                setSelectedStudentForForm(null); // Đảm bảo reset selected Student khi mở modal chính
                            }}
                        >
                            Thêm học sinh
                        </Button>
                    )}
                </Col>
            </Row>
            <StudentList
              classId={classId}
              students={classDetails?.students_ids}
              searchText={searchText}
              onStudentRemoved={fetchClassDetails}
              fetchWrapper={fetchWrapper}
              userData={userData}
            />
          </>
        )}
        {activeView === 'tests' && (
          <>
            <Typography.Title level={3} style={{ marginBottom: '16px' }}>Danh sách bài kiểm tra:</Typography.Title>
            <TestManagement
              classId={classId}
              tests={classDetails?.tests}
              userData={userData}
              fetchWrapper={fetchWrapper}
              setClassDetails={setClassDetails}
              searchText={searchText}
            />
          </>
        )}
        {activeView === 'attendance' && (userData?.role === 'teacher' || userData?.role === 'admin') && (
          <>
            <Typography.Title level={3} style={{ marginBottom: '16px' }}>Điểm danh học sinh:</Typography.Title>
            <AttendanceManagement
              classDetails={classDetails}
              userData={userData}
              fetchWrapper={fetchWrapper}
              searchText={searchText}
              onRefreshClassDetails={fetchClassDetails}
            />
          </>
        )}

        {activeView === 'myAttendance' && userData?.role === 'Student' && (
          <>
            <Typography.Title level={3} style={{ marginBottom: '16px' }}>Bảng điểm danh của học sinh:</Typography.Title>
            <MyAttendanceView
              classId={classId}
              fetchWrapper={fetchWrapper}
            />
          </>
        )}

        {activeView === 'studentResults' && userData?.role === 'Student' && (
          <>
            <Typography.Title level={3} style={{ marginBottom: '16px' }}>Kết quả học tập của bạn:</Typography.Title>
            <StudentResultsView
              classId={classId}
              studentId={userData._id}
              fetchWrapper={fetchWrapper}
            />
          </>
        )}

        {userData?.role === 'Student' &&
          activeView !== 'myAttendance' &&
          activeView !== 'tests' &&
          activeView !== 'studentResults' &&
          (!classDetails?.tests || classDetails?.tests.length === 0) && (
            <Typography.Paragraph>Hiện không có thông tin bài kiểm tra hoặc kết quả học tập cho lớp này. Bạn có thể xem điểm danh của mình.</Typography.Paragraph>
          )}
        {userData?.role === 'Student' && activeView === 'tests' && (!classDetails?.tests || classDetails.tests.length === 0) && (
          <Typography.Paragraph>Lớp học này hiện không có bài kiểm tra nào.</Typography.Paragraph>
        )}
        {userData?.role === 'Student' && activeView === 'studentResults' && (!classDetails?.tests || classDetails.tests.length === 0) && (
          <Typography.Paragraph>Lớp học này hiện chưa có kết quả bài kiểm tra nào.</Typography.Paragraph>
        )}
      </div>

      {/* Modal để thêm học sinh */}
      <Modal
        title="Thêm Học sinh vào Lớp"
        visible={isAddStudentModalVisible}
        // onCancel sẽ được xử lý bởi useEffect, nhưng vẫn cần đóng modal
        onCancel={() => {
            setIsAddStudentModalVisible(false);
        }}
        footer={null} // Không dùng footer mặc định của Modal
        width={800}
      >
        <Search
            placeholder="Tìm kiếm học sinh theo tên, VNU ID hoặc email"
            value={addStudentSearchText}
            onChange={(e) => setAddStudentSearchText(e.target.value)}
            style={{ marginBottom: 16 }}
            enterButton={<SearchOutlined />}
        />
        <Table
          dataSource={filteredAvailableStudents.map(Student => ({ key: Student._id, ...Student }))}
          columns={selectStudentColumns}
          loading={addingStudentLoading}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          scroll={{ y: 300 }}
          locale={{ emptyText: "Không tìm thấy học sinh nào hoặc tất cả đã có trong lớp." }}
        />

        {/* Form nhập liệu học sinh và số tiền */}
        {/* CHỈ HIỂN THỊ FORM KHI ĐÃ CÓ HỌC SINH ĐƯỢC CHỌN */}
        {selectedStudentForForm && (
            <Form
                form={addStudentForm}
                layout="vertical"
                onFinish={handleAddStudentFinal}
                style={{ marginTop: '20px' }}
            >
                <Form.Item
                    name="studentId"
                    hidden
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="studentName"
                    label="Học sinh được chọn"
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
                    <Button type="primary" htmlType="submit" loading={addingStudentLoading}>
                        Thêm học sinh vào lớp
                    </Button>
                    <Button onClick={() => {
                        setIsAddStudentModalVisible(false); // Đóng modal
                        // useEffect sẽ tự động reset form
                    }} style={{ marginLeft: 8 }}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        )}
      </Modal>
    </Content>
  );
}

export default ClassDetail;