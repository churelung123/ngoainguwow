// HandleChatMessage.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const handleChatMessage = async (socket, data) => {
    const sender = socket.loginInfo; // Đối tượng user (hoặc guest mock object)
    const content = data.content;
    let receiverId = data.receiver; // ID của người nhận được gửi từ client (admin sẽ gửi ID user, user sẽ gửi ID admin)
    let receiverRole = data.receiverRole; // Vai trò của người nhận được gửi từ client

    let chatRoomId; // Sẽ được xác định dựa trên sender và receiver

    try {
        if (!sender || !sender._id || !sender.role) {
            console.error(`[Socket.IO - HandleChatMessage] Lỗi: Thông tin người gửi không đầy đủ hoặc không hợp lệ.`);
            socket.emit('chatError', { message: 'Lỗi: Thông tin người gửi không hợp lệ.' });
            return;
        }

        let adminUserId;
        // Lấy ID của admin, luôn là một phần của chatRoomId
        const adminUser = await global.DBConnection.User.findOne({ role: "admin" }).select('_id name role');
        if (adminUser) {
            adminUserId = adminUser._id;
        } else {
            console.warn("[Socket.IO - HandleChatMessage] Không tìm thấy Admin user trong DB.");
            socket.emit('chatError', { message: 'Không tìm thấy Admin để gửi tin nhắn.' });
            return;
        }

        if (sender.role === "admin") {
            // Admin gửi tin nhắn cho một Student/Teacher/Guest cụ thể
            if (!receiverId || !receiverRole) {
                console.error(`[Socket.IO - HandleChatMessage] Lỗi chat: Receiver ID và Role là bắt buộc khi Admin gửi tin.`);
                socket.emit('chatError', { message: 'Lỗi chat: Receiver ID và Role là bắt buộc khi Admin gửi tin.' });
                return;
            }
            chatRoomId = `chat_${adminUserId.toString()}_${receiverId.toString()}`;
            console.log(`[Socket.IO - HandleChatMessage] Admin (${sender._id}) gửi tới ${receiverRole} (${receiverId}). ChatRoom: ${chatRoomId}`);

        } else if (["Student", "teacher", "guest"].includes(sender.role)) {
            // Student/Teacher/Guest gửi tin nhắn cho Admin
            receiverId = adminUserId; // Người nhận là admin
            receiverRole = 'admin';
            chatRoomId = `chat_${adminUserId.toString()}_${sender.user_ref.toString()}`;
            console.log(`[Socket.IO - HandleChatMessage] ${sender.role} (${sender.user_ref}) gửi tới Admin (${receiverId}). ChatRoom: ${chatRoomId}`);

        } else {
            console.error(`[Socket.IO - HandleChatMessage] Lỗi chat: Vai trò người gửi không hợp lệ hoặc không được hỗ trợ: ${sender.role}`);
            socket.emit('chatError', { message: 'Lỗi chat: Vai trò người gửi không hợp lệ.' });
            return;
        }

        // Lưu tin nhắn vào DB
        let messageToSave = new global.DBConnection.Message({
            sender: sender.user_ref,
            senderRole: sender.role,
            receiver: receiverId,
            receiverRole: receiverRole,
            content: content,
            chatRoomId: chatRoomId,
            messageType: data.messageType || 'text',
        });
        await messageToSave.save();
        console.log(`[Socket.IO - HandleChatMessage] Tin nhắn đã lưu. Sender: ${sender.name} (${sender.role}), Receiver: ${receiverId} (${receiverRole}), ChatRoom: ${chatRoomId}, Content: "${content}"`);

        // Chuẩn bị tin nhắn để emit về client
        // Populate thông tin người gửi nếu cần, đặc biệt nếu sender là ObjectId
        let messageForClient = messageToSave.toObject();
        if (sender.role !== 'guest') {
            const populatedSender = await global.DBConnection.User.findById(sender.user_ref).select('name role');
            if (populatedSender) {
                messageForClient.sender = {
                    _id: populatedSender._id,
                    name: populatedSender.name,
                    role: populatedSender.role
                };
            } else {
                 messageForClient.sender = { _id: sender.user_ref, name: 'Unknown User', role: sender.role };
            }
        } else {
            // Đối với guest, thông tin sender đã có trong socket.loginInfo.user_ref
            messageForClient.sender = { _id: sender.user_ref, name: sender.name, role: sender.role };
        }


        // Phát tin nhắn đến cả hai bên của cuộc trò chuyện và phòng chung nếu có
        // 1. Phát lại cho chính người gửi (để optimistic update ở frontend)
        socket.emit('receiveMessage', messageForClient);
        console.log(`[Socket.IO - HandleChatMessage] Emitted 'receiveMessage' tới người gửi (${socket.id}).`);

        // 2. Phát tới phòng chatRoomId (cả người gửi và người nhận đều join phòng này)
        // Đảm bảo không emit lại cho người gửi nếu họ đã nhận qua socket.emit ở trên
        global.IOConnection.io.to(chatRoomId).except(socket.id).emit('receiveMessage', messageForClient);
        console.log(`[Socket.IO - HandleChatMessage] Emitted 'receiveMessage' tới phòng ${chatRoomId} (trừ người gửi).`);


    } catch (error) {
        console.error('[Socket.IO - HandleChatMessage] Lỗi xử lý tin nhắn:', error);
        socket.emit('chatError', { message: `Lỗi server: ${error.message}` });
    }
};

module.exports = handleChatMessage;