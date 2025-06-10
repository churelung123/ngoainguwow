import React from 'react';
import { Layout, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchWrapper } from '_helpers';
import { useAuthWrapper } from '_helpers';
import { Row, Col, Card, Style, Divider, Input } from 'antd'; // Import Row, Col, Card

const { Content } = Layout;
const { Title, Paragraph } = Typography;
export { Teaching };

const { Search } = Input;

function Teaching() {
  const [searchText, setSearchText] = useState('');
  const [teachingClasses, setTeachingClasses] = useState([]);
  const fetchWrapper = useFetchWrapper();
  const authWrapper = useAuthWrapper(); // Sử dụng hook để lấy thông tin người dùng


  useEffect(() => {
    const fetchTeacherClasses = async () => {
      try {
        const userData = await authWrapper.getUserInfo(); // Lấy thông tin người dùng đã đăng nhập
        if (userData && userData._id) {
          const response = await fetchWrapper.get(`/api/classes/teacher/${userData._id}`);
          const data = await response.json();
          if (data.status === "Success" && data.message) {

            console.log("thong tin can biet: ", data.message);
            setTeachingClasses(data.message);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải lớp học:", error);
      }
    };

    fetchTeacherClasses();
  }, []); // Thêm authWrapper vào dependency array để fetch lại khi thông tin đăng nhập thay đổi

  const filteredClasses = teachingClasses.filter(lop =>
    lop.classId?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSearch = (value) => {
    setSearchText(value);
  };

  return (
    <div>
      <h2>Chào mừng đến với trang Giảng dạy!</h2>
      <h3>Các lớp học của bạn:</h3>
      <Search
        placeholder="Tìm kiếm theo Mã lớp học"
        onChange={(e) => handleSearch(e.target.value)}
        style={{ width: 300, marginBottom: 16 }}
      />
      <Row gutter={[16, 16]} style={{ overflowX: 'auto' }}>
        {filteredClasses.map(lop => (
          <Col key={lop._id} xs={24} sm={12} md={8} lg={6}>
            <Link to={`/class/${lop._id || lop._id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <Card
                style={{ borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                bodyStyle={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ backgroundColor: '#a4c4a2', padding: '12px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                  <Title level={4} style={{ marginBottom: '0' }}>{lop.className}</Title>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#eae7d6' }}>
                  <Paragraph>Mã lớp học: {lop.classId}</Paragraph>
                  <Typography.Paragraph>Khóa học: {lop.course_code?.course_name || 'Chưa có'}</Typography.Paragraph>
                  {lop.studentCount && <Typography.Paragraph>Tỉ số lớp: {lop.studentCount}</Typography.Paragraph>}
                  {lop.userRoleInClass && <Typography.Paragraph>Vai trò: {lop.userRoleInClass}</Typography.Paragraph>}
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default Teaching;