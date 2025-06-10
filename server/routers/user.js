const { validateToken } = require('../middleware/auth-middleware/auth')
const { getProfileById, validateEditProfileArgument, editProfileById } = require('../middleware/user-middleware/user');
const Config = require('../configs/Constants');
const userRouter = require('express').Router();
userRouter.get(Config.API_PATH.PROFILE_BY_ID , validateToken, getProfileById);
userRouter.post(Config.API_PATH.SET_PROFILE_BY_ID, validateToken, validateEditProfileArgument, editProfileById);

// 1. Route để lấy ID của Admin
userRouter.get('/api/admin/admin-id', async (req, res) => {
    try {
        const adminUser = await global.DBConnection.User.findOne({ role: 'admin' }).select('_id');
        if (adminUser) {
            res.json({ adminId: adminUser._id });
        } else {
            res.status(404).json({ message: 'Admin user not found.' });
        }
    } catch (error) {
        console.error('Error fetching admin ID:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Hàm tạo chatRoomId nhất quán
const getChatRoomId = async (currentUserId, currentUserRole, targetId) => {
    let adminId;
    try {
        const adminUser = await global.DBConnection.User.findOne({ role: "admin" }).select('_id');
        if (adminUser) {
            adminId = adminUser._id;
        } else {
            console.error("[getChatRoomId] Không tìm thấy Admin user trong DB. Không thể tạo chatRoomId.");
            return null; // Trả về null nếu không tìm thấy admin
        }
    } catch (error) {
        console.error("[getChatRoomId] Lỗi khi tìm Admin user:", error);
        return null;
    }

    let userOrGuestId;
    if (currentUserRole === "admin") {
        userOrGuestId = targetId; // Nếu là admin, targetId là user/guest
    } else if (["Student", "teacher", "guest"].includes(currentUserRole)) {
        userOrGuestId = currentUserId; // Nếu là user/guest, currentUserId là user/guest
    } else {
        console.warn(`[getChatRoomId] Vai trò không xác định: ${currentUserRole}`);
        return null;
    }

    // Đảm bảo userOrGuestId là một chuỗi ObjectId hoặc chuỗi guestId
    const formattedUserOrGuestId = userOrGuestId.toString();

    // Định dạng chatRoomId là chat_adminId_userIdOrGuestId
    return `chat_${adminId.toString()}_${formattedUserOrGuestId}`;
};

// 2. Route để lấy lịch sử chat
// Yêu cầu xác thực token vì chat là tính năng bảo mật
userRouter.get('/api/chat/history/:targetId', validateToken, async (req, res) => {
    try {
        const currentUserId = req.senderInstance._id; // ID của người dùng hiện tại từ token
        const currentUserRole = req.senderInstance.role; // Vai trò của người dùng hiện tại từ token
        const { targetId } = req.params; // ID của đối tác chat (adminId hoặc userId khác)

        if (!currentUserId || !targetId) {
            return res.status(400).json({ message: 'Missing user ID or target ID.' });
        }
        
        const chatRoomId = await getChatRoomId(currentUserId, currentUserRole, targetId);

        if (!chatRoomId) {
            return res.status(500).json({ message: 'Could not determine chat room ID.' });
        }

        // Lấy tin nhắn dựa trên chatRoomId
        // Sắp xếp theo timestamp để đảm bảo thứ tự tin nhắn
        const history = await global.DBConnection.Message.find({ chatRoomId: chatRoomId })
            .sort({ timestamp: 1 }) // Sắp xếp theo thời gian tăng dần
            .populate({ // Populate thông tin người gửi nếu bạn muốn hiển thị tên/vai trò
                path: 'sender',
                select: 'name role _id' // Chọn các trường bạn muốn hiển thị
            })
            .populate({ // Populate thông tin người nhận nếu cần
                path: 'receiver',
                select: 'name role _id'
            })
            .lean(); // lean() để lấy plain JavaScript objects

        res.json({ history });
    } catch (error) {
        console.error(`Error fetching chat history for ${req.senderInstance.role} (ID: ${req.senderInstance._id}) with target ${req.params.targetId}:`, error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// 3. Route để lấy danh sách đối tác chat (chỉ Admin)
userRouter.get('/api/chat/partners', validateToken, async (req, res) => {
    try {
        const currentUserId = req.senderInstance._id;
        const currentUserRole = req.senderInstance.role; // Đây sẽ là 'admin'

        if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Chỉ Admin mới có quyền truy cập danh sách đối tác chat.' });
        }

        // ✅ Lấy adminId một lần ở đây để sử dụng cho getChatRoomId
        let adminUserId;
        const adminUser = await global.DBConnection.User.findOne({ role: "admin" }).select('_id');
        if (adminUser) {
            adminUserId = adminUser._id;
        } else {
            console.error('[API - /chat/partners] Không tìm thấy Admin user trong DB.');
            return res.status(500).json({ message: 'Lỗi server: Không tìm thấy thông tin Admin.' });
        }


        // Tìm tất cả người dùng trừ chính Admin hiện tại
        // và trừ vai trò 'guest' (vì guest không có tài khoản cố định)
        const chatPartners = await global.DBConnection.User.find({
            _id: { $ne: currentUserId }, // Loại trừ chính Admin
            role: { $ne: 'guest' } // Loại trừ khách
        }).select('_id name username role');

        // Đối với mỗi đối tác, tìm tin nhắn cuối cùng để hiển thị trong danh sách chat
        const partnersWithLastMessage = await Promise.all(chatPartners.map(async (partner) => {
            // ✅ Gọi hàm getChatRoomId với các tham số phù hợp
            // Khi admin lấy danh sách partners, currentUserId là adminId, và partner._id là targetId
            // Tuy nhiên, hàm getChatRoomId đã được thiết kế để luôn tạo chat_adminId_userId.
            // Nên chúng ta chỉ cần truyền adminUserId và ID của partner là đủ để hàm xử lý đúng.
            // Cụ thể, khi admin gọi, `currentUserId` sẽ là adminUserId, `currentUserRole` là "admin", `targetId` là `partner._id`.
            const chatRoomId = await getChatRoomId(adminUserId, 'admin', partner._id);

            let lastMessage = null;
            if (chatRoomId) { // Chỉ tìm tin nhắn nếu chatRoomId được tạo thành công
                lastMessage = await global.DBConnection.Message.findOne({ chatRoomId })
                    .sort({ timestamp: -1 })
                    .select('content timestamp');
            } else {
                console.warn(`[API - /chat/partners] Không thể tạo chatRoomId cho Admin (${adminUserId}) và Partner (${partner._id}).`);
            }

            return {
                partnerId: partner._id,
                name: partner.name || partner.username,
                role: partner.role,
                lastMessage: lastMessage ? lastMessage.content : 'Chưa có tin nhắn',
                timestamp: lastMessage ? lastMessage.timestamp : null
            };
        }));

        // Sắp xếp danh sách đối tác theo thời gian tin nhắn cuối cùng
        partnersWithLastMessage.sort((a, b) => {
            if (!a.timestamp && !b.timestamp) return 0;
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp - a.timestamp;
        });
        return res.status(200).json(partnersWithLastMessage);
    } catch (error) {
        console.error('Error fetching all chat partners:', error);
        return res.status(500).json({ message: 'Lỗi server khi tải danh sách đối tác chat.' });
    }
});

module.exports = userRouter;