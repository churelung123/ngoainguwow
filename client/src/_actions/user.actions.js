import { useRecoilState, useSetRecoilState, useResetRecoilState } from 'recoil';

import { history, useFetchWrapper, useAuthWrapper } from '_helpers';
import { authAtom, usersAtom, userAtom, currentClassAtom } from '_state';
import { alertBachAtom } from '_state';
export { useUserActions };

function useUserActions () {
    const baseUrl = `${process.env.REACT_APP_API_URL}/users`;
    const fetchWrapper = useFetchWrapper();
    const authWrapper = useAuthWrapper();
    const [alert, setAlert] = useRecoilState(alertBachAtom)
    const [auth, setAuth] = useRecoilState(authAtom);
    const setUsers = useSetRecoilState(usersAtom);
    const setUser = useSetRecoilState(userAtom);
    const [curClass, setCurClass] = useRecoilState(currentClassAtom)
    return {
        login,
        logout,
        register,
        update,
        delete: _delete,
        resetUsers: useResetRecoilState(usersAtom),
        resetUser: useResetRecoilState(userAtom)
    }

    async function login({ username, password }) {
        var details = {
            'userName': username,
            'password': password
        };
        
        var urlencoded = new URLSearchParams();
        urlencoded.append("username", username);
        urlencoded.append("password", password);
        let response = {message: ""};
        try {
            response = await authWrapper.login(urlencoded); // response ở đây là `rawjson` từ authWrapper
            console.log('[user.actions] Raw response from authWrapper.login:', response); // Log toàn bộ response

            if (response.status === "Error") {
                throw new Error("Đăng nhập thất bại");
            }
            
            // **Sửa đổi DÒNG NÀY để truy cập đúng `response.message.token`**
            if (response && response.message && response.message.token) {
                localStorage.setItem('token', response.message.token); // <-- LƯU TOKEN VÀO LOCALSTORAGE
                console.log('[user.actions] Token successfully saved to localStorage!');
                
                // Tùy chọn: Cập nhật authAtom với thông tin người dùng nếu bạn muốn
                if (response.message.user) {
                    setAuth({ user: response.message.user, token: response.message.token }); 
                } else {
                    setAuth({ user: null, token: response.message.token }); // Hoặc chỉ lưu token nếu không có user
                }

            } else {
                console.warn('[user.actions] Login successful, but no token found at response.message.token. This might cause issues with Socket.IO connection.');
                // Có thể bạn muốn hiển thị một cảnh báo nếu đăng nhập thành công nhưng không nhận được token
            }
            // ------------------------------------------------------------------
            
            setAlert({
                isShow: true,
                message: "Đăng nhập thành công",
                type: "success"
            });
            return response;
        } catch (error) {
            console.error('[user.actions] Login failed:', error);
            setAlert({
                isShow: true,
                message: error.message || "Đăng nhập thất bại không xác định.",
                type: "error"
            });
            return null;
        }
    }

    function logout() {
        return new Promise(resolve => { // Wrap the operations in a Promise
            localStorage.removeItem('token');
            // If you save user info into localStorage: localStorage.removeItem('user');
            setAuth(null); // Clear Recoil auth state
            history.push('/'); // Redirect to home page
            resolve(); // Resolve the promise once operations are complete
        });
    }

    function register(user) {
        return fetchWrapper.post(`${baseUrl}/register`, user);
    }

    // function getAll() {
    //     return fetchWrapper.get(baseUrl).then(setUsers);
    // }

    // function getById(id) {
    //     return fetchWrapper.get(`${baseUrl}/${id}`).then(setUser);
    // //}

    function update(id, params) {
        return fetchWrapper.put(`${baseUrl}/${id}`, params)
            .then(x => {
                // update stored user if the logged in user updated their own record
                if (id === auth?.id) {
                    // update local storage
                    const user = { ...auth, ...params };
                    localStorage.setItem('user', JSON.stringify(user));

                    // update auth user in recoil state
                    setAuth(user);
                }
                return x;
            });
    }

    // prefixed with underscored because delete is a reserved word in javascript
    function _delete(id) {
        setUsers(users => users.map(x => {
            // add isDeleting prop to user being deleted
            if (x.id === id) 
                return { ...x, isDeleting: true };

            return x;
        }));

        return fetchWrapper.delete(`${baseUrl}/${id}`)
            .then(() => {
                // remove user from list after deleting
                setUsers(users => users.filter(x => x.id !== id));

                // auto logout if the logged in user deleted their own record
                if (id === auth?.id) {
                    logout();
                }
            });
    }
}
