const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');
const Configs = require('../../configs/Constants');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
// const jwtAuth = require("socketio-jwt-auth"); // Không cần thiết nếu bạn đã có checkTokenValid tự custom
const handleChatMessage = require("./HandleChatMessage");
const { checkLoginInfo, checkTokenValid } = require('./IOAuthentication');
const { notifyNewPost, notifyNewComment, notifyUpdatePost } = require('./HandleNotification');

class IOConnection {
    constructor(server) {
        this.handleChatMessage = handleChatMessage;
        this.notifyNewPost = notifyNewPost.bind(this);
        this.notifyNewComment = notifyNewComment.bind(this);
        this.notifyUpdatePost = notifyUpdatePost.bind(this);
        this.io = new Server(server, {
            cors: {
                origin: "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        // Áp dụng các middleware xác thực trước khi thiết lập kết nối
        this.io.use(checkTokenValid);
        this.io.use(checkLoginInfo);

        this.io.on("connection", async (socket) => {
            console.log(`[Socket.IO - Connection] New connection attempt. Socket ID: ${socket.id}`);
            try {
                // Xử lý kết nối mới và lấy thông tin người dùng (guest hoặc đã xác thực)
                await handleNewConnection(socket);

                // Log thông tin người dùng sau khi handleNewConnection đã xác định vai trò
                const userRef = socket.loginInfo;
                if (userRef) {
                    console.log(`[Socket.IO - Connection] User connected. Socket ID: ${socket.id}, Role: ${userRef.role}, Name: ${userRef.name}, User ID: ${userRef.user_ref}`);
                } else {
                    console.log(`[Socket.IO - Connection] User connected. Socket ID: ${socket.id}, No valid loginInfo.user_ref found after handleNewConnection.`);
                }

                // Gắn người dùng vào phòng chat tương ứng dựa trên vai trò đã xác định
                const senderRole = userRef?.role;
                const senderId = userRef?._id; // ID này có thể là ObjectId hoặc chuỗi (nếu là guest)

                if (senderRole === "admin") {
                    socket.join('admin_chat_room');
                    console.log(`[Socket.IO - Connection] Admin ${userRef.name} joined 'admin_chat_room'`);
                } else if (senderRole === "Student" || senderRole === "guest" || senderRole === "teacher") { // Thêm cả teacher vào đây nếu họ cũng chat
                    socket.join(`chat_with_admin_${senderId}`); // Mỗi student/guest/teacher có phòng chat riêng với admin
                    console.log(`[Socket.IO - Connection] ${senderRole} ${userRef.name} joined 'chat_with_admin_${senderId}'`);
                } else {
                    console.log(`[Socket.IO - Connection] User role '${senderRole}' for ${userRef?.name} is not allowed to join chat rooms.`);
                    // Tùy chọn: ngắt kết nối nếu vai trò không được phép chat
                    // socket.disconnect(true);
                }

                // Logic tham gia phòng lớp học (nếu có, dựa trên vai trò teacher/Student)
                // Cần đảm bảo sender.role và sender.user_ref đã được gán đúng bởi handleNewConnection
                if (userRef && userRef.role === "teacher") {
                    try {
                        var classes = await global.DBConnection.Class.find({
                            class_teacher: userRef.user_ref
                        });
                        for (var i of classes) {
                            socket.join(i._id);
                            console.log(`[Socket.IO - Connection] Teacher ${userRef.name} joined class room: ${i._id}`);
                        }
                    } catch (e) {
                        console.error(`[Socket.IO - Connection] Error joining teacher classes for ${userRef.name}:`, e);
                    }
                } else if (userRef && userRef.role === "Student") {
                    try {
                        var classes = await global.DBConnection.Class.find({
                            class_members: userRef.user_ref
                        });
                        for (var i of classes) {
                            socket.join(i._id);
                            console.log(`[Socket.IO - Connection] Student ${userRef.name} joined class room: ${i._id}`);
                        }
                    } catch (e) {
                        console.error(`[Socket.IO - Connection] Error joining student classes for ${userRef.name}:`, e);
                    }
                }

                // Lấy lịch sử chat với admin
                socket.on('getChatHistoryWithAdmin', async (targetUserId) => {
                    console.log(`[Socket.IO - getChatHistoryWithAdmin] Request from socket ${socket.id}. Target User ID: ${targetUserId}`);
                    try {
                        if (!socket.loginInfo || !socket.loginInfo.user_ref || !socket.loginInfo.user_ref._id) {
                            console.error(`[Socket.IO - getChatHistoryWithAdmin] Error: User not authenticated or user info missing for socket ${socket.id}.`);
                            socket.emit('chatError', 'User not authenticated or user info missing.');
                            return;
                        }

                        const userId = socket.loginInfo.user_ref._id;
                        const userRole = socket.loginInfo.user_ref.role;

                        let chatRoomId;
                        if (userRole === "admin" && targetUserId) {
                            // Admin yêu cầu lịch sử chat với một user cụ thể
                            try {
                                new ObjectId(targetUserId); // Chỉ kiểm tra tính hợp lệ của ObjectId
                                chatRoomId = `chat_with_admin_${targetUserId}`;
                            } catch (e) {
                                console.error(`[Socket.IO - getChatHistoryWithAdmin] Invalid targetUserId provided by admin: ${targetUserId}`, e);
                                socket.emit('chatError', 'Invalid target user ID for chat history.');
                                return;
                            }
                        } else if (["Student", "guest", "teacher"].includes(userRole)) {
                            // Student/Guest/Teacher yêu cầu lịch sử chat của chính họ với admin
                            chatRoomId = `chat_with_admin_${userId}`;
                        } else {
                            console.warn(`[Socket.IO - getChatHistoryWithAdmin] Unauthorized role '${userRole}' attempted to get chat history. Socket ID: ${socket.id}`);
                            socket.emit('chatError', 'Your role is not authorized to access chat history.');
                            return;
                        }

                        console.log(`[Socket.IO - getChatHistoryWithAdmin] Fetching messages for chatRoomId: ${chatRoomId}`);
                        const rawMessages = await global.DBConnection.Message.find({ chatRoomId: chatRoomId })
                            .sort({ timestamp: 1 });

                        // Xử lý populate thủ công hoặc cấu trúc lại tin nhắn cho client
                        const messagesForClient = [];
                        for (const msg of rawMessages) {
                            let msgObj = msg.toObject(); // Chuyển Mongoose document sang plain object

                            if (msg.senderRole !== 'guest') {
                                // Nếu là người dùng đã đăng nhập, tìm user từ DB để gán thông tin sender
                                try {
                                    const senderUser = await global.DBConnection.User.findById(msg.sender);
                                    if (senderUser) {
                                        msgObj.sender = {
                                            _id: senderUser._id,
                                            name: senderUser.name,
                                            role: senderUser.role
                                        };
                                    } else {
                                        // Fallback nếu không tìm thấy user (có thể đã xóa user)
                                        msgObj.sender = { _id: msg.sender, name: 'Unknown User', role: msg.senderRole };
                                    }
                                } catch (e) {
                                    console.error(`[Socket.IO - getChatHistoryWithAdmin] Error populating sender for message ${msg._id}:`, e);
                                    msgObj.sender = { _id: msg.sender, name: 'Error Populating', role: msg.senderRole };
                                }
                            } else {
                                // Nếu là guest, sử dụng thông tin sender đã lưu (socket.id) và tạo tên guest tạm thời
                                // Tên guest có thể được lưu kèm theo khi tạo tin nhắn, nếu không thì dùng ID làm tên
                                msgObj.sender = { _id: msg.sender, name: `Guest_${msg.sender.substring(0, 4)}`, role: 'guest' };
                            }
                            messagesForClient.push(msgObj); // Thêm tin nhắn đã xử lý vào mảng
                        }

                        console.log(`[Socket.IO - getChatHistoryWithAdmin] Sending ${messagesForClient.length} messages for chatRoomId ${chatRoomId} to socket ${socket.id}`);
                        socket.emit('chatHistoryWithAdmin', messagesForClient);
                    } catch (error) {
                        console.error(`[Socket.IO - getChatHistoryWithAdmin] Error fetching chat history from socket ${socket.id}:`, error);
                        socket.emit('chatError', 'Failed to fetch chat history due to server error.');
                    }
                });

                // Các sự kiện khác (ví dụ: NewMessage, Notification)
                console.log(`[Socket.IO - Connection] Registering 'NewMessage' handler for socket: ${socket.id}`);
                socket.on('NewMessage', async (data) => {
                    console.log(`[DEBUG] Sự kiện 'NewMessage' nhận được với dữ liệu:`, data);
                    await handleChatMessage(socket, data);
                });
                // Thêm các notify event listeners nếu cần
                // socket.on('notifyNewPost', this.notifyNewPost.bind(this));
                // socket.on('notifyNewComment', this.notifyNewComment.bind(this));
                // socket.on('notifyUpdatePost', this.notifyUpdatePost.bind(this));


                socket.on("disconnect", (reason) => {
                    console.log(`[Socket.IO - Disconnect] Socket ID: ${socket.id} disconnected. Reason: ${reason}`);
                    // Chỉ cập nhật current_socket_id nếu không phải guest
                    if (socket.loginInfo && socket.loginInfo.user_ref && socket.loginInfo.user_ref.role !== 'guest') {
                        // Đảm bảo socket.loginInfo là một Mongoose document trước khi gọi save()
                        if (socket.loginInfo.isNew === false || socket.loginInfo._id) {
                            socket.loginInfo.current_socket_id = null;
                            try {
                                socket.loginInfo.save();
                                console.log(`[Socket.IO - Disconnect] Cleared current_socket_id for user ${socket.loginInfo.user_ref.name}`);
                            } catch (e) {
                                console.error("[Socket.IO - Disconnect] Error resetting ID socket in DB:", e);
                            }
                        } else {
                            console.warn(`[Socket.IO - Disconnect] socket.loginInfo is not a Mongoose document. Cannot clear current_socket_id for user ${socket.loginInfo.user_ref.name}.`);
                        }
                    }
                });
            } catch (error) {
                console.error(`[Socket.IO - Connection Handler] Critical error during connection setup for socket ${socket.id}:`, error);
                socket.emit('chatError', 'Server internal error during connection setup. Please refresh.');
                socket.disconnect(true); // Ngắt kết nối cứng nếu có lỗi nghiêm trọng
            }
        });
        global.IOConnection = this;
    }
}

const handleNewConnection = async (socket) => {
    const loginInfo = socket.loginInfo;

    // Đảm bảo loginInfo và user_ref đã được middleware IOAuthentication thiết lập
    if (!loginInfo || !loginInfo.user_ref || !loginInfo.user_ref._id) {
        console.error(`[Socket.IO - handleNewConnection] Lỗi: Thông tin user_ref không đầy đủ sau xác thực. Ngắt kết nối socket: ${socket.id}`);
        socket.emit('chatError', 'Authentication failed. Please log in again.');
        socket.disconnect(true);
        return;
    }

    const sender = loginInfo.user_ref; // Sử dụng sender đã được cấu trúc lại
    console.log(`[Socket.IO - handleNewConnection] Xử lý kết nối mới cho User ID: ${sender._id}, Role: ${sender.role}, Name: ${sender.name}`);

    // Mỗi người dùng (hoặc guest) tham gia một phòng chat riêng của họ
    socket.join(sender._id.toString());
    console.log(`[Socket.IO - handleNewConnection] User ${sender.name} joined private room: ${sender._id.toString()}`);


    // Cập nhật hoặc tạo LoginInfo trong DB cho người dùng đã đăng nhập
    if (!loginInfo.isGuest) {
        try {
            // Nếu loginInfo.isNew là true, nghĩa là LoginInfo chưa tồn tại trong DB, cần tạo mới.
            // Nếu loginInfo._id tồn tại, nghĩa là đây là LoginInfo đã có, chỉ cần cập nhật.
            const updatedLoginInfo = await global.DBConnection.LoginInfo.findOneAndUpdate(
                { user_ref: sender._id },
                { current_socket_id: socket.id, last_login: Date.now() },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            // Cập nhật socket.loginInfo để nó chứa LoginInfo document thực sự
            socket.loginInfo = updatedLoginInfo;
            console.log(`[Socket.IO - handleNewConnection] LoginInfo cho user ${sender._id} đã được cập nhật/tạo mới với socket ID: ${socket.id}`);
        } catch (error) {
            console.error(`[Socket.IO - handleNewConnection] Lỗi cập nhật/tạo LoginInfo cho user ${sender._id}:`, error);
        }
    } else {
        console.log(`[Socket.IO - handleNewConnection] Guest user connected. ID: ${sender._id}, Socket ID: ${socket.id}`);
        // Đối với guest, không lưu LoginInfo vào DB
    }

    // Logic tham gia phòng chat với admin (phòng riêng của mỗi user/guest với admin)
    let adminUserId;
    try {
        const adminUser = await global.DBConnection.User.findOne({ role: "admin" }).select('_id');
        if (adminUser) {
            adminUserId = adminUser._id;
        } else {
            console.warn("[Socket.IO - Connection] Không tìm thấy Admin user trong DB. Các phòng chat với admin sẽ không được tạo.");
            // Nếu không tìm thấy admin, các logic liên quan đến chatRoomForUserWithAdmin sẽ bị bỏ qua
        }
    } catch (error) {
        console.error("[Socket.IO - Connection] Lỗi khi tìm Admin user:", error);
    }


    if (sender.role === "admin") {
        socket.join('admin_chat_room');
        console.log(`[Socket.IO - Connection] Admin ${sender.name} joined 'admin_chat_room'`);
    } else if (["Student", "guest", "teacher"].includes(sender.role) && adminUserId) { // Chỉ chạy nếu adminUserId đã được tìm thấy
        const chatRoomForUserWithAdmin = `chat_${adminUserId.toString()}_${sender._id.toString()}`;
        socket.join(chatRoomForUserWithAdmin);
        console.log(`[Socket.IO - Connection] ${sender.role} ${sender.name} joined chat room with admin: ${chatRoomForUserWithAdmin}`);
    } else {
        console.log(`[Socket.IO - Connection] User role '${sender.role}' cho ${sender.name} không được phép tham gia phòng chat admin hoặc không tìm thấy admin.`);
    }


    // Logic tham gia phòng lớp học (nếu có, dựa trên vai trò teacher/Student)
    if (sender.role === "teacher") {
        try {
            const classes = await global.DBConnection.Class.find({
                class_teacher: sender._id
            });
            for (const i of classes) {
                socket.join(i._id.toString()); // Tham gia bằng _id của Class
                console.log(`[Socket.IO - Connection] Teacher ${sender.name} joined class room: ${i._id.toString()}`);
            }
        } catch (error) {
            console.error(`[Socket.IO - Connection] Lỗi khi tham gia phòng lớp học cho giáo viên ${sender.name}:`, error);
        }
    } else if (sender.role === "Student") {
        try {
            const classes = await global.DBConnection.Class.find({
                class_members: sender._id
            });
            for (const i of classes) {
                socket.join(i._id.toString()); // Tham gia bằng _id của Class
                console.log(`[Socket.IO - Connection] Student ${sender.name} joined class room: ${i._id.toString()}`);
            }
        } catch (error) {
            console.error(`[Socket.IO - Connection] Lỗi khi tham gia phòng lớp học cho học sinh ${sender.name}:`, error);
        }
    }

    // Log cuối cùng cho kết nối
    console.log(`[Socket.IO - Connection Final Check] User Connected. ID: ${sender._id}, Role: ${sender.role}, Socket ID: ${socket.id}`);
};

module.exports = IOConnection;