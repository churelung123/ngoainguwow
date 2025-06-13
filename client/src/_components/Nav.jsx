// src/Nav.jsx
import React, { useEffect, useState } from 'react';

import { Link, useLocation, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil'; // Giữ nguyên
import { authAtom, isTakingTestAtom } from '_state'; // Đã thêm isTakingTestAtom
import { useClassWrapper } from '../_helpers/class-wrapper'
import { useUserActions } from '_actions';
import 'antd/dist/antd.css';
import 'index.css';


import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  MessageOutlined,
  BellOutlined,
  InfoCircleOutlined,
  UserOutlined,
  DashboardOutlined,
  TableOutlined,
  LoginOutlined,
  BookOutlined,
  UploadOutlined,
  ReadOutlined,
  TeamOutlined,
  SolutionOutlined,
  UserSwitchOutlined,
  GroupOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

export { Nav };

function Nav(props) {
  var classID = props.classID ? props.classID : "";
  const location = useLocation();

  // const [pathname, setPathname] = useState(location.pathname);
  const { navCollapsed, setNavCollapsed } = props;
  const onCollapse = (collapsed) => setNavCollapsed(collapsed);
  const userActions = useUserActions();
  const classWrapper = useClassWrapper();
  const auth = props.auth;
  const onLogout = props.onLogout;
  var userData = JSON.parse(localStorage.getItem("userData"));
  // Đọc trạng thái làm bài kiểm tra từ Recoil
  const isTakingTest = useRecoilValue(isTakingTestAtom); // Đã thêm dòng này
  // only show nav when logged in

  useEffect(() => {
    const handleResize = () => {
      setNavCollapsed(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    console.log(location.pathname)
    console.log("NAV constructing ", classID);
    userData = JSON.parse(localStorage.getItem("userData"));
  }, [])

  if (!auth) return null;
  // const currentClassID = JSON.parse(localStorage.getItem('currentClass')).class_id;

  return (
    <Sider
      collapsible
      collapsed={navCollapsed}
      onCollapse={onCollapse}
      className={navCollapsed && window.innerWidth < 768 ? 'hide-sider' : ''}
      style={{
        overflow: 'auto',
        height: '90vh',
        left: 0,
        top: 64,
        position: "sticky"
      }}
    >
      <div className="logo" />
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={[location.pathname]}
        selectedKeys={[location.pathname]}
      >
        {!classWrapper.curClass &&
          <Menu.Item key="/" className="nav-home-item" disabled={isTakingTest}> {/* Đã thêm disabled */}
            <HomeOutlined />
            <span>Trang chủ</span>
            <Link to="/"></Link>
          </Menu.Item>
        }

        {(classWrapper.curClass) && userData && (
          <>
            {(userData.role == "teacher") &&
              <Menu.Item key={`/${classWrapper.curClass.class_id}/`} disabled={isTakingTest}> {/* Đã thêm disabled */}
                <HomeOutlined />
                <span>Trang chủ</span>
                <Link to={`/${classWrapper.curClass.class_id}/`}></Link>
              </Menu.Item>
            }
          </>
        )}

        <>
          {(userData?.role === "Student") && (
            <Menu.Item key={`/studying`} disabled={isTakingTest}> {/* Đã thêm disabled */}
              <ReadOutlined />
              <span>Học tập</span>
              <Link to={`/studying`}></Link>
            </Menu.Item>
          )}
        </>
        <>
          {(userData?.role === "teacher") && (
            <Menu.Item key={`/teaching`} disabled={isTakingTest}> {/* Đã thêm disabled */}
              <BookOutlined />
              <span>Giảng dạy</span>
              <Link to={`/teaching`}></Link>
            </Menu.Item>
          )}
        </>
        <>
          {userData?.role === "admin" && (
            <>
              <Menu.Item key={`/classes`} disabled={isTakingTest}> {/* Đã thêm disabled */}
                <GroupOutlined />
                <span>Quản lý Lớp học</span>
                <Link to={`/classes`}></Link>
              </Menu.Item>

              <Menu.Item key={`/courses`} disabled={isTakingTest}> {/* Đã thêm disabled */}
                <SolutionOutlined />
                <span>Quản lý Khóa học</span>
                <Link to={`/courses`}></Link>
              </Menu.Item>

              <Menu.Item key={`/users`} disabled={isTakingTest}> {/* Đã thêm disabled */}
                <TeamOutlined />
                <span>Quản lý Người dùng</span>
                <Link to={`/users`}></Link>
              </Menu.Item>
            </>
          )}
        </>
        <>
          {(userData?.role === "teacher" || userData?.role === "admin") && (
            <Menu.Item key={`/dbportal`} disabled={isTakingTest}> {/* Đã thêm disabled */}
              <UploadOutlined />
              <span>Quản lý CSDL</span>
              <Link to={`/dbportal`}></Link>
            </Menu.Item>
          )}
        </>


        <Menu.Item key="/profile" disabled={isTakingTest}> {/* Đã thêm disabled */}
          <UserOutlined />
          <span>Hồ sơ cá nhân</span>
          <Link to="/profile"></Link>
        </Menu.Item>
        <Menu.Item key="nothing">
        </Menu.Item>
        <Menu.Item key="logout" onClick={userActions.logout} disabled={isTakingTest}>
          <LoginOutlined />
          <span>Đăng xuất</span>
        </Menu.Item>
      </Menu>
    </Sider>
  );
}