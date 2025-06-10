const jwt = require('jsonwebtoken');
const Configs = require('../../configs/Constants'); // Đảm bảo đường dẫn này đúng tới Constants.js

// Middleware 1: Xác thực token JWT
function checkTokenValid(socket, next) {
    console.log(`[IOAuth - checkTokenValid] Starting...`);
    let token = null;

    // Ưu tiên lấy từ socket.handshake.auth.token (cách client gửi hiện tại)
    if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
        console.log(`[IOAuth - checkTokenValid] Found token in handshake.auth.token.`);
    }
    // Các cách lấy token khác (nếu có, nhưng hiện tại client chỉ dùng auth.token)
    // else if (socket.handshake.query && socket.handshake.query.token) {
    //     token = socket.handshake.query.token;
    //     console.log(`[IOAuth - checkTokenValid] Found token in handshake.query.token.`);
    // } else if (socket.handshake.headers && socket.handshake.headers["x-auth-token"]) {
    //     token = socket.handshake.headers["x-auth-token"];
    //     console.log(`[IOAuth - checkTokenValid] Found token in handshake.headers["x-auth-token"].`);
    // }

    // Khởi tạo socket.loginInfo để các middleware sau có thể sử dụng
    socket.loginInfo = {
        user_ref: {
            _id: null,
            name: null,
            role: null
        },
        isGuest: true, // Mặc định là guest, sẽ thay đổi nếu có token hợp lệ
        isNew: true, // Mặc định là kết nối mới, sẽ thay đổi nếu tìm thấy LoginInfo cũ
    };

    if (!token) {
        console.warn('[IOAuth - checkTokenValid] No token provided. User will be treated as guest.');
        socket.loginInfo.user_ref = null; // Không có ID người dùng xác thực
        return next(); // Tiếp tục, để handleNewConnection xử lý là guest
    }

    try {
        // RẤT QUAN TRỌNG: Đảm bảo SECRET_KEY khớp với key bạn dùng để SIGN token ở backend khi đăng nhập
        // Có thể là Configs.ACCESS_TOKEN_SECRET hoặc Configs.SECRET_KEY tùy cách bạn đặt tên
        const decoded = jwt.verify(token, Configs.ACCESS_TOKEN_SECRET || Configs.SECRET_KEY); // Sử dụng ACCESS_TOKEN_SECRET nếu có
        console.log(`[IOAuth - checkTokenValid] Token verified. Decoded payload:`, decoded);

        // Đảm bảo rằng decoded có trường `user` và `_id` bên trong nó
        // Payload JWT của bạn có thể là { user: { _id: '...', role: '...' } }
        // Hoặc chỉ { id: '...', role: '...' }
        // Cần kiểm tra cấu trúc chính xác của payload bạn nhận được từ backend.
        if (decoded && decoded.user && decoded.user._id) { // Giả định payload có { user: { _id: '...' } }
            socket.loginInfo.user_ref = {
                _id: decoded.user._id,
                name: decoded.user.name, // Lấy tên từ token nếu có
                role: decoded.user.role
            };
            socket.loginInfo.isGuest = false;
            console.log(`[IOAuth - checkTokenValid] User ID from token: ${decoded.user._id}, Role: ${decoded.user.role}`);
        } else if (decoded && decoded.id) { // Hoặc nếu payload là { id: '...' } và role
             socket.loginInfo.user_ref = {
                 _id: decoded.id,
                 name: decoded.name || `User_${decoded.id.substring(0, 4)}`, // Lấy tên hoặc tạo tạm
                 role: decoded.role
             };
             socket.loginInfo.isGuest = false;
             console.log(`[IOAuth - checkTokenValid] User ID from token: ${decoded.id}, Role: ${decoded.role}`);
        }
        else {
            console.error('[IOAuth - checkTokenValid] JWT payload missing user ID or malformed. User will be treated as guest.');
            // Giữ nguyên là guest, user_ref._id sẽ là null hoặc socket.id sau này
        }
        next();
    } catch (err) {
        console.error(`[IOAuth - checkTokenValid] JWT verification failed: ${err.message}. User will be treated as guest.`);
        socket.loginInfo.user_ref = null; // Token không hợp lệ hoặc hết hạn
        next(); // Tiếp tục, để handleNewConnection xuser_refử lý là guest
    }
}

// Middleware 2: Lấy thông tin LoginInfo từ DB
async function checkLoginInfo(socket, next) {
    console.log(`[IOAuth - checkLoginInfo] Starting for user_ref: ${socket.loginInfo?.user_ref}`);

    // Chỉ tìm LoginInfo nếu checkTokenValid đã tìm thấy một user_ref hợp lệ
    if (socket.loginInfo && socket.loginInfo.user_ref) {
        try {
            // Tìm tài liệu LoginInfo dựa trên user_ref từ token
            const instance = await global.DBConnection.LoginInfo.findOne({ user_ref: socket.loginInfo.user_ref });

            if (instance) {
                // Lấy thông tin user_ref từ LoginInfo document
                const userRef = await global.DBConnection.User.findById(instance.user_ref).select('name role');

                if (userRef) {
                    socket.loginInfo = {
                        _id: instance._id, // ID của LoginInfo document
                        user_ref: {
                            _id: userRef._id,
                            name: userRef.name,
                            role: userRef.role
                        },
                        isNew: false, // Đây là LoginInfo đã tồn tại
                        current_socket_id: instance.current_socket_id,
                        last_login: instance.last_login,
                        // Thêm các trường khác của LoginInfo nếu cần
                    };
                    console.log(`[IOAuth - checkLoginInfo] LoginInfo FOUND and user_ref populated for user: ${userRef.name} (${userRef._id})`);
                } else {
                    console.warn(`[IOAuth - checkLoginInfo] User for LoginInfo ${instance._id} (user_ref: ${instance.user_ref}) NOT FOUND. Treating as guest.`);
                    // Nếu user_ref không tồn tại (đã bị xóa?), coi như guest.
                    socket.loginInfo = {
                        user_ref: {
                            _id: socket.loginInfo.user_ref, // Giữ lại ID từ token
                            name: `Guest_${socket.loginInfo.user_ref.substring(0, 4)}`, // Tên tạm
                            role: 'guest'
                        },
                        isGuest: true,
                        isNew: true, // Coi như kết nối guest mới
                    };
                }
            } else {
                console.warn(`[IOAuth - checkLoginInfo] LoginInfo NOT FOUND for user_ref: ${socket.loginInfo.user_ref}. Creating temporary user_ref for new LoginInfo.`);
                // Nếu không tìm thấy LoginInfo, cần tìm user để lấy role và name
                const user = await global.DBConnection.User.findById(socket.loginInfo.user_ref).select('name role');

                if (user) {
                    socket.loginInfo = {
                        user_ref: {
                            _id: user._id,
                            name: user.name,
                            role: user.role
                        },
                        isNew: true, // Đánh dấu để handleNewConnection biết cần tạo LoginInfo mới
                    };
                    console.log(`[IOAuth - checkLoginInfo] Temporary user_ref created for user: ${user.name} (${user._id})`);
                } else {
                    console.error(`[IOAuth - checkLoginInfo] User (ID: ${socket.loginInfo.user_ref}) not found for new LoginInfo. This should not happen if token is valid.`);
                     socket.loginInfo = {
                        user_ref: {
                            _id: socket.loginInfo.user_ref,
                            name: `Unknown User_${socket.loginInfo.user_ref.substring(0, 4)}`,
                            role: 'guest' // Fallback to guest if user not found
                        },
                        isGuest: true,
                        isNew: true,
                    };
                }
            }
            next();
        } catch (error) {
            console.error('[IOAuth - checkLoginInfo] Error fetching LoginInfo from DB:', error);
            // Lỗi DB, coi như không xác thực
            socket.loginInfo = null; // Hoặc gán { user_ref: null } để handleNewConnection xử lý guest
            next();
        }
    } else {
        console.log('[IOAuth - checkLoginInfo] No valid user_ref from previous middleware. Skipping LoginInfo lookup.');
        socket.loginInfo = null; // Đảm bảo là null để handleNewConnection xử lý guest
        next();
    }
}

module.exports = { checkLoginInfo, checkTokenValid };