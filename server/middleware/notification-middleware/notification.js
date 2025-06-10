const Configs = require('../../configs/Constants');

// Tạo thông báo
const createNotification = async (req, res) => {
    const { classId, content } = req.body;
    try {
        const senderId = req.senderInstance._id; // Lấy ID của người gửi từ token

        const newNotification = new global.DBConnection.Notification({
            classId,
            senderId,
            content
        });

        const savedNotification = await newNotification.save();

        return res.status(201).json({
            status: "Success",
            message: savedNotification
        });
    } catch (error) {
        console.error("Lỗi khi tạo thông báo:", error);
        return res.status(500).json({
            status: "Error",
            message: "Lỗi server khi tạo thông báo."
        });
    }
};

// Lấy tất cả thông báo của một lớp
const getNotificationsByClass = async (req, res) => {
    try {
        
        const { classId } = req.params;

        const notifications = await global.DBConnection.Notification.find({ classId })
            .populate('senderId', 'name role') // Lấy thông tin người gửi (tên và vai trò)
            .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo giảm dần

        return res.status(200).json({
            status: "Success",
            message: notifications
        });
    } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        return res.status(500).json({
            status: "Error",
            message: "Lỗi server khi lấy thông báo."
        });
    }
};

// Lấy chi tiết một thông báo
const getNotificationDetail = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await global.DBConnection.Notification.findById(notificationId)
            .populate('senderId', 'name role');

        if (!notification) {
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy thông báo."
            });
        }

        return res.status(200).json({
            status: "Success",
            message: notification
        });
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết thông báo:", error);
        return res.status(500).json({
            status: "Error",
            message: "Lỗi server khi lấy chi tiết thông báo."
        });
    }
};

// Đánh dấu thông báo là đã đọc
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const studentId = req.senderInstance._id; // Lấy ID của học sinh từ token

        const notification = await global.DBConnection.Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy thông báo."
            });
        }

        // Kiểm tra xem học sinh đã đọc thông báo chưa
        if (!notification.isReadBy.includes(studentId)) {
            notification.isReadBy.push(studentId);
            await notification.save();
        }

        return res.status(200).json({
            status: "Success",
            message: "Đánh dấu đã đọc thành công."
        });
    } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
        return res.status(500).json({
            status: "Error",
            message: "Lỗi server khi đánh dấu đã đọc."
        });
    }
};

module.exports = {
    createNotification,
    getNotificationsByClass,
    getNotificationDetail,
    markNotificationAsRead
};