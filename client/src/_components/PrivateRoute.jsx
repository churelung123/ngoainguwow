import React from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom'; // Import useLocation
import { useRecoilValue } from 'recoil';

import { useAuthWrapper } from '_helpers';

export { PrivateRoute };

function PrivateRoute({ component: Component, ...rest }) {
    const authWrapper = useAuthWrapper();
    const location = useLocation(); // Sử dụng hook useLocation để lấy thông tin về location hiện tại

    return (
        <Route {...rest} render={props => {
            if (authWrapper.tokenValue) {
                console.log("priveteroute: ", Component);
                return <Component {...props} />
            } else {
                // Nếu chưa đăng nhập VÀ không phải đang ở trang /account/login thì mới chuyển hướng
                if (location.pathname !== '/account/login') {
                    return <Redirect to={{ pathname: '/account/login', state: { from: props.location } }} />;
                }

                // Nếu chưa đăng nhập VÀ đang ở trang /account/logind, thì render null hoặc một component thông báo
                return null; // Hoặc có thể render một thông báo "Bạn cần đăng nhập" nếu muốn
            }
        }} />
    );
}