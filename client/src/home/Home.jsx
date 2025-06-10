import { Link, Redirect } from 'react-router-dom';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useEffect, useState } from 'react';
import { authAtom } from '_state';
import { useAuthWrapper, useClassWrapper } from '_helpers';
import { classPickerVisibleAtom } from '_state';
import { Button, Card, Row, Col } from 'antd';
import {
    HomeOutlined,
    MessageTwoTone,
    BellTwoTone,
    InfoCircleTwoTone,
    AppstoreTwoTone,
    DashboardTwoTone,
    LayoutTwoTone,
    LeftCircleTwoTone,
    HddTwoTone
} from '@ant-design/icons';
import { useUserActions } from '_actions';

export { Home };

function Home() {
    console.log("Component Home được render");
    const [drawerVisible, setDrawerVisible] = useRecoilState(classPickerVisibleAtom);
    const authWrapper = useAuthWrapper();
    console.log("Home render, token value:", authWrapper.tokenValue);
    const [userData, setUserData] = useState(null);
    const [studentFirstClassLoaded, setStudentFirstClassLoaded] = useState(false);
    const classWrapper = useClassWrapper();
    const userActions = useUserActions();
    const [isLoading, setIsLoading] = useState(true);

    const onClick = () => {
        classWrapper.getClassList();
        setDrawerVisible(true);
    };

    useEffect(() => {
        console.log("useEffect Home chạy, token:", authWrapper.tokenValue);
        async function fetchUserData() {
            setIsLoading(true); // Set isLoading thành true trước khi fetch
            try {
                const userDataFromWrapper = await authWrapper.getUserInfo();
                setUserData(userDataFromWrapper);
                console.log("Cập nhật userData từ getUserInfo:", userDataFromWrapper);
            } catch (error) {
                console.error("Lỗi khi fetch user data:", error);
                // Xử lý lỗi nếu cần
            } finally {
                setIsLoading(false); // Set isLoading thành false sau khi fetch (thành công hoặc thất bại)
            }
        }
        
    
        if (authWrapper.tokenValue) {
            fetchUserData();
        } else {
            setUserData(null); // Reset userData khi không có token
        }
    }, [authWrapper.tokenValue]);

    if (!authWrapper.tokenValue) {
        return <Redirect to="/account" />;
    }

    return userData ? (
        <>
            {(userData.role === "teacher") &&
                <div className="p-4">
                    <div className="container">
                        <h3>Chào mừng đến với Ứng dụng Quản lý học sinh - Giáo viên!</h3>
                        <br />
                        <Row>
                            <Col flex='520px'>
                                <Link to={`/profile`}>
                                    <Card hoverable style={{ width: 500, height: 310 }}>
                                    <h5>Thông tin cá nhân</h5>
                                    <h3>{userData?.name}</h3><br /> {/* Sử dụng ?. */}
                                    Vai trò<br />
                                    <h4>{userData?.role === "Student" ? "Sinh viên" : "Cố vấn học tập"}</h4> {/* Sử dụng ?. */}
                                    Lớp hiện tại<br />
                                    <h4>{classWrapper.curClass?.class_name ? classWrapper.curClass.class_name : "Vui lòng chọn lớp để bắt đầu"}</h4> {/* Sử dụng ?. */}
                                    </Card></Link>
                            </Col>
                            <Col flex='200px'>
                                <Row>
                                    <Card style={{ width: 240, height: 145 }} onClick={onClick} hoverable>
                                        <AppstoreTwoTone twoToneColor="#205ec9" style={{ fontSize: '40px', display: 'inline-block', verticalAlign: 'middle' }} />
                                        <br /><br /><h5>{classWrapper.curClass ? "Đổi lớp" : "Chọn lớp"}</h5>
                                    </Card>
                                </Row>
                                <br />
                                <Row>
                                    <Card style={{ width: 240, height: 145 }} hoverable onClick={userActions.logout}>
                                        <LeftCircleTwoTone twoToneColor="#cf1b4b" style={{ fontSize: '40px', display: 'inline-block', verticalAlign: 'middle' }} />
                                        <br /><br /><h5>Đăng xuất</h5>
                                    </Card>
                                </Row>
                            </Col>
                        </Row>
                        <br /><br />

                        {(classWrapper.curClass) &&
                            <>
                                <h4>Tiện ích liên lạc </h4>
                                <Row>
                                    <Col flex='260px'>
                                        <Link to={`/${classWrapper.curClass.class_id}/studentinfo`}>
                                            <Card hoverable style={{ width: 240 }}>
                                                <InfoCircleTwoTone twoToneColor="#206cc9" style={{ fontSize: '30px', display: 'inline-block', verticalAlign: 'middle' }} />
                                                <br /><br /><h4>Thông tin liên hệ</h4>
                                            </Card></Link>
                                    </Col>
                                    <Col flex='260px'>
                                        <Link to={`/${classWrapper.curClass.class_id}/feed`}>
                                            <Card hoverable style={{ width: 240 }}>
                                                <BellTwoTone twoToneColor="#c98e20" style={{ fontSize: '30px', display: 'inline-block', verticalAlign: 'middle' }} />
                                                <br /><br /><h4>Diễn đàn</h4>
                                            </Card></Link>
                                    </Col>
                                    <Col flex='260px'>
                                        <Link to={`/chat`}>
                                            <Card hoverable style={{ width: 240 }}>
                                                <MessageTwoTone twoToneColor="#5e20c9" style={{ fontSize: '30px', display: 'inline-block', verticalAlign: 'middle' }} />
                                                <br /><br /><h4>Nhắn tin</h4>
                                            </Card></Link>
                                    </Col>
                                </Row>
                                <br /><br />
                                <h4>Tiện ích theo dõi & thống kê</h4>
                                <Row>
                                    <Col flex='260px'>
                                        <Link to={`/${classWrapper.curClass.class_id}/dashboard`}>
                                            <Card hoverable style={{ width: 240 }}>
                                                <DashboardTwoTone twoToneColor="#52c41a" style={{ fontSize: '30px', display: 'inline-block', verticalAlign: 'middle' }} />
                                                <br /><br /><h4>Bảng theo dõi</h4>
                                            </Card></Link>
                                    </Col>
                                    <Col flex='260px'>
                                        <Link to={`/${classWrapper.curClass.class_id}/studentscore`}>
                                            <Card hoverable style={{ width: 240 }}>
                                                <LayoutTwoTone twoToneColor="#52c41a" style={{ fontSize: '30px', display: 'inline-block', verticalAlign: 'middle' }} />
                                                <br /><br /><h4>Bảng điểm</h4>
                                            </Card></Link>
                                    </Col>
                                    <Col flex='260px'>
                                        <Link to={`/dbportal`}>
                                            <Card hoverable style={{ width: 240 }}>
                                                <HddTwoTone twoToneColor="#52c41a" style={{ fontSize: '30px', display: 'inline-block', verticalAlign: 'middle' }} />
                                                <br /><br /><h4>Quản lý CSDL</h4>
                                            </Card></Link>
                                    </Col>
                                </Row>
                            </>
                        }
                        <br />
                        <b>Website Quản lý Học Sinh - Giáo viên</b><br />
                        <br />
                    </div>
                </div>
            }
            {(userData.role === "Student") &&
                <>
                    {(studentFirstClassLoaded && !classWrapper.curClass) &&
                        <div className="p-4">
                            <div className="container">
                                <h1>Xin chào, bạn là sinh viên nhưng chưa có lớp!</h1><br />
                                <br />
                                <h5>Vui lòng liên hệ với admin hệ thống và nhà trường để được thêm vào trang lớp học của bạn.</h5>
                            </div>
                        </div>
                    }
                </>
            }
            {(studentFirstClassLoaded && classWrapper.curClass) &&
                <Redirect from="*" to={`/stuhome`} />
            }
            {(userData.role === "admin") &&
                <div className="p-4">
                    <div className="container">
                        <h1>Xin chào Admin!</h1>
                    </div>
                </div>
            }
        </>
    ) : (
        isLoading ? <div>Đang tải thông tin người dùng...</div> : <div>Không có thông tin người dùng.</div>
    );
}