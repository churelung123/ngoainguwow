import React, { useEffect, useState } from 'react';
import { Router, Route, Switch, Redirect, useLocation } from 'react-router-dom';
import { useRecoilValue, useRecoilState } from 'recoil';

import { Nav, PrivateRoute, ClassPicker } from '_components';
import { history, useAuthWrapper, useClassWrapper } from '_helpers';
import { Home } from 'home';
import { Account } from '_components/account';
import { Dashboard } from '_components/dashboard';
import { Feed } from '_components/feed';
import { Chat } from '_components/chat';
import { Profile } from '_components/profile';
import { Teaching } from '_components/teaching';
import { ClassDetail } from '_components/classdetail';
import { StudentInfoList } from '_components/studentInfoList';
import { StudentScoreList } from '_components/studentScoreList';
import { Studying } from '_components/studying';
import { StudentTest } from '_components/studenttest';
import { FormElementManagement } from '_components/classdetail';

import { authAtom, classPickerVisibleAtom, loadingVisibleAtom, isTakingTestAtom } from '_state';
import { Layout, Typography, Button } from 'antd'; // Import Button
import { MenuOutlined } from '@ant-design/icons'; // Import MenuOutlined

import LinearProgress from '@mui/material/LinearProgress';
import { DBPortal } from '_components/dbportal/DBPortal';
import { useUserActions } from '_actions';
import { Notification } from './_components/bach_component/Notification/Notification';
import Socket from '_components/bach_component/Socket/socket';

import logo from './images/WowLogo.png';
import { AppFooter } from '_components/footer/Footer';
import { HomePageContent } from '_components/homepagecontent/HomePageContent';
import { PostDetail } from '_components/postdetail/PostDetail';
import { CreatePostPage } from '_components/homepagecontent/CreatePostPage';

import { AdminClassesPage } from '_components/admin/AdminClassesPage';
import { AdminCoursesPage } from '_components/admin/AdminCoursesPage';
import { AdminUserPage } from '_components/admin/AdminUserPage';

import './index.css';

const { Header, Content } = Layout;
const { Title } = Typography;

export { App };

function App() {
    const authWrapper = useAuthWrapper();
    const classWrapper = useClassWrapper();
    const [drawerVisible, setDrawerVisible] = useRecoilState(classPickerVisibleAtom);
    const loadingVisible = useRecoilValue(loadingVisibleAtom);
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [currentClassName, setCurrentClassName] = useState("");
    const auth = useRecoilValue(authAtom);
    const userActions = useUserActions();
    const [scrollTargetId, setScrollTargetId] = useState(null);
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem("userData")));

    const onDrawerClose = () => setDrawerVisible(false);
    const showLoginModal = () => setLoginModalVisible(true);
    const handleLoginModalClose = () => setLoginModalVisible(false);

    const handleLogout = () => {
        userActions.logout().then(() => {
            history.push('/');
        });
        setLoginModalVisible(false);
    };

    const scrollToElement = (elementId) => {
        if (history.location.pathname === '/') {
            setScrollTargetId(elementId);
        } else {
            setScrollTargetId(elementId);
            history.push('/');
        }
    };

    useEffect(() => {
        if (authWrapper.tokenValue) {
            setUserData(JSON.parse(localStorage.getItem("userData")));
            if (classWrapper.curClass) {
                setCurrentClassName(classWrapper.curClass.class_name);
            } else {
                setCurrentClassName("Chưa chọn lớp");
            }
        } else {
            setUserData(null);
            localStorage.removeItem('currentClass');
            setCurrentClassName("");
        }
    }, [authWrapper.tokenValue, classWrapper.curClass]);

    return (
        <div className={'app-container' + (authWrapper.tokenValue ? ' bg-light' : '')}>
            {authWrapper.tokenValue && <Socket />}
            <Router history={history}>
                <MainLayout
                    userData={userData}
                    scrollToElement={scrollToElement}
                    onLogout={handleLogout}
                    authWrapper={authWrapper}
                    loginModalVisible={loginModalVisible}
                    setLoginModalVisible={setLoginModalVisible}
                    handleLoginModalClose={handleLoginModalClose}
                    drawerVisible={drawerVisible}
                    onDrawerClose={onDrawerClose}
                    setDrawerVisible={setDrawerVisible}
                    scrollTargetId={scrollTargetId}
                    setScrollTargetId={setScrollTargetId}
                    loadingVisible={loadingVisible}
                />
            </Router>
        </div>
    );
}

function MainLayout({
    userData,
    scrollToElement,
    onLogout,
    authWrapper,
    loginModalVisible,
    setLoginModalVisible,
    handleLoginModalClose,
    drawerVisible,
    onDrawerClose,
    setDrawerVisible,
    scrollTargetId,
    setScrollTargetId,
    loadingVisible
}) {
    const location = useLocation();
    const [isTakingTest, setIsTakingTest] = useRecoilState(isTakingTestAtom);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [navCollapsed, setNavCollapsed] = useState(window.innerWidth < 768); // Thêm state cho navCollapsed

    useEffect(() => {
        const isTestPage = location.pathname.includes('/tests/') && location.pathname.includes('/Student/');
        if (!isTestPage && isTakingTest) {
            setIsTakingTest(false);
        }
    }, [location.pathname, isTakingTest, setIsTakingTest]);

    useEffect(() => {
        if (location.pathname === '/' && scrollTargetId) {
            const interval = setInterval(() => {
                const element = document.getElementById(scrollTargetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    clearInterval(interval);
                    setScrollTargetId(null);
                }
            }, 100);
            setTimeout(() => clearInterval(interval), 2000);
            return () => clearInterval(interval);
        }
    }, [location.pathname, scrollTargetId]);

    const toggleNav = () => {
        setNavCollapsed(!navCollapsed);
    };

    return (
        <Layout>
            <Header style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isMobileView && authWrapper.tokenValue && (
                        <Button
                            type="text"
                            onClick={toggleNav}
                            icon={<MenuOutlined />}
                            style={{
                                color: 'white',
                                padding: '4px',
                                fontSize: '18px',
                                marginRight: '8px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        />
                    )}
                    <img src={logo} alt="Logo WOW English" style={{ height: '80px', marginRight: '10px' }} />
                    <Title
                        style={{ color: 'white', margin: 0 }}
                        level={3}
                        className={isMobileView ? 'hide-on-mobile' : ''}
                    >
                        WOW English School
                    </Title>
                </div>
                <div className="header-nav-buttons">
                    <button className="header-nav-button" onClick={() => scrollToElement('news-posts')} disabled={isTakingTest}>Tin tức</button>
                    <button className="header-nav-button" onClick={() => scrollToElement('course-posts')} disabled={isTakingTest}>Khóa học</button>
                    <button className="header-nav-button" onClick={() => scrollToElement('app-footer')} disabled={isTakingTest}>Liên Hệ</button>
                    {authWrapper.tokenValue ? (
                        <button className="header-nav-button" onClick={onLogout} disabled={isTakingTest}>Đăng xuất</button>
                    ) : (
                        <button className="header-nav-button" onClick={() => setLoginModalVisible(true)}>Đăng nhập</button>
                    )}
                </div>
            </Header>
            <Layout>
                {(!isMobileView || !navCollapsed) && authWrapper.tokenValue && (
                    <Nav
                        onLogout={onLogout}
                        auth={authWrapper.tokenValue}
                        userData={userData}
                        navCollapsed={navCollapsed}
                        setNavCollapsed={setNavCollapsed}
                    />
                )}
                <Layout>
                    <Route exact path="/">
                        <HomePageContent userRole={userData?.role} userId={userData?._id} />
                    </Route>
                    <Content style={{ margin: '20px 16px' }}>
                        <Switch>
                            <Route path="/posts/:id" component={PostDetail} />
                            <PrivateRoute path="/create-post" component={CreatePostPage} />
                            <PrivateRoute path="/home" component={Home} />
                            <PrivateRoute path="/chat" component={Chat} />
                            <PrivateRoute path="/profile" component={Profile} />
                            <PrivateRoute path="/teaching" component={Teaching} />
                            <PrivateRoute exact path="/class/:id" component={ClassDetail} />
                            <PrivateRoute exact path="/dbportal" component={DBPortal} />
                            <PrivateRoute exact path="/studying" component={Studying} />

                            {userData?.role === "teacher" && (
                                <>
                                    <PrivateRoute exact path="/:classID/" component={Home} />
                                    <PrivateRoute exact path="/:classID/dashboard" component={Dashboard} />
                                    <PrivateRoute exact path="/:classID/studentinfo" component={StudentInfoList} />
                                    <PrivateRoute exact path="/:classID/studentscore" component={StudentScoreList} />
                                    <PrivateRoute exact path="/:classID/feed" component={Feed} />
                                    <PrivateRoute exact path="/classes/:classId/tests/:testId/form-elements" component={FormElementManagement} />
                                </>
                            )}
                            {userData?.role === "Student" && (
                                <>
                                    <PrivateRoute exact path="/:classID/feed" component={Feed} />
                                    <PrivateRoute exact path="/class/:classId/tests/:testId/Student/:studentId" component={StudentTest} />
                                </>
                            )}
                            {userData?.role === "admin" && (
                                <>
                                    <PrivateRoute exact path="/classes" component={AdminClassesPage} />
                                    <PrivateRoute exact path="/courses" component={AdminCoursesPage} />
                                    <PrivateRoute exact path="/users" component={AdminUserPage} />
                                </>
                            )}
                            <Redirect from="*" to="/" />
                        </Switch>
                    </Content>
                    <AppFooter userRole={userData?.role} userId={userData?._id} isTakingTest={isTakingTest} />
                </Layout>
            </Layout>
            <Account visible={loginModalVisible} onClose={handleLoginModalClose} history={history} />
            <ClassPicker drawerVisible={drawerVisible} setDrawerVisible={setDrawerVisible} onDrawerClose={onDrawerClose} />
            {/* <Notification /> */}
            <LinearProgress
                sx={{
                    position: "fixed",
                    width: "100%",
                    top: "0px",
                    zIndex: 2,
                    visibility: loadingVisible ? "visible" : "hidden"
                }}
            />
        </Layout>
    );
}