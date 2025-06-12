import { authAtom} from '_state';
import { useRecoilState } from 'recoil';
import { useFetchWrapper } from '_helpers';
import { useAlertActions ,useProfileAction} from '_actions';
import { alertBachAtom } from '_state';
import { useCallback } from 'react'; // Import useCallback

export { useAuthWrapper };

function useAuthWrapper(param) {
    const [auth, setAuth] = useRecoilState(authAtom);
    const [alert, setAlert] = useRecoilState(alertBachAtom);
    const fetchWrapper = useFetchWrapper();
    const alertActions = useAlertActions();
    const profileAction = useProfileAction();
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    async function login(param){
        console.log("Login in wrapper called");
        const response = await fetchWrapper.post(`${API_BASE_URL}/auth/login`, "application/x-www-form-urlencoded", param);
        if (response == null) {
            console.log("No response");
        }
        console.log(response);
        let rawjson = await response.json();
        console.log(rawjson);
        if (rawjson.status === "Logged In Success"){
            console.log(rawjson.status);
            setLoginToken(rawjson.message.token);
            await loadUser();
        } else {
            setAlert({message: "Thất bại", description: "Sai tên đăng nhập hoặc mật khẩu"});
        }
        console.log("Token registered in Recoil is: " + auth);
        return rawjson;
    }

    async function logout(){
        console.log("Logout in authWrapper called");
        setLoginToken("");
        localStorage.clear();
        printLoginToken();
    }

    function setLoginToken(token){
    setAuth(token);
    // KHÔNG cần set cookie thủ công vì server đã set đúng
    // localStorage có thể lưu làm dự phòng
    localStorage.setItem("token", token);
}

    function printLoginToken(token){
        console.log(document.cookie);
        console.log(auth);
    }

    async function loadUser(){
        const response = await fetchWrapper.get(`${API_BASE_URL}/api/profile/me`, null, null);
        if (response == null) {
            console.log("No response.");
        }
        let rawjson = await response.json();
        console.log(rawjson);
        rawjson = rawjson.message;
        var userProfile = {
            _id: rawjson._id,
            name: rawjson.name,
            role: rawjson.role,
            date_of_birth: rawjson.date_of_birth,
            email: rawjson.email,
            vnu_id: rawjson.vnu_id
        };
        console.log(userProfile);
        profileAction.getMyProfile();
        localStorage.setItem('userData', JSON.stringify(userProfile));
    }

    // Sử dụng useCallback để memoize getUserInfo
    async function getUserInfo() {
        let data = JSON.parse(localStorage.getItem("userData"))
        if (data  && data.vnu_id) {
          return data
        }
          
        else {
          await loadUser();
        }
        return JSON.parse(localStorage.getItem("userData"))
    }

    function loadLoginToken(){
        return async () => { // Loại bỏ 'async' ở đây vì không có await bên trong
            var allcookies = document.cookie;
            var cookiearray = allcookies.split(';');
            var token = '';
            for(var i=0; i<cookiearray.length; i++){
                var namae = cookiearray[i].split('=')[0].trim(); // Thêm trim() để loại bỏ khoảng trắng
                var value = cookiearray[i].split('=')[1];
                if (namae === 'token') {
                    token = value;
                    break; // Thêm break để dừng vòng lặp khi tìm thấy token
                }
            }
            setLoginToken(token);
        };
    }

    async function forgetPassword(params) {
        console.log(params);
        var urlencoded = new URLSearchParams();
        urlencoded.append("email", params.email);
        let response = {message: ""};
        try {
            const res = await fetchWrapper.post(`${API_BASE_URL}/api/auth/forget_password`, "application/x-www-form-urlencoded", urlencoded);
            response = await res.json();
            if (response.status === "Success") {
                setAlert({message: "Thành công", description: response.message});
            } else throw Error("Forget Password fail");
        } catch (e) {
            setAlert({message: "Thất bại", description: response.message});
        }
    }

    return {
        login : login,
        logout : logout,
        tokenValue : auth,
        getUserInfo : getUserInfo, // Trả về hàm đã được memoize
        forgetPassword: forgetPassword,
        loadLoginToken: loadLoginToken,
        loadUser
    };
}