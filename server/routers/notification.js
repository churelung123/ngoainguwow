const notificationRoute = require('express').Router();
const {
    createNotification,
    getNotificationsByClass,
    getNotificationDetail,
    markNotificationAsRead
} = require('../middleware/notification-middleware/notification');

const { validateToken, authorize } = require('../middleware/auth-middleware/auth');

const Config = require('../configs/Constants');

// Tạo thông báo
notificationRoute.post(Config.API_PATH.CREATE_NOTIFICATION, validateToken, authorize(['teacher', 'admin']), createNotification);

// Lấy tất cả thông báo của một lớp
notificationRoute.get(Config.API_PATH.GET_CLASS_NOTIFICATIONS, validateToken, authorize(['teacher', 'admin', 'Student']), getNotificationsByClass);

// Lấy chi tiết một thông báo
notificationRoute.get(Config.API_PATH.GET_NOTIFICATION_DETAIL, validateToken, authorize(['teacher', 'admin', 'Student']), getNotificationDetail);

// Đánh dấu thông báo là đã đọc
notificationRoute.put(Config.API_PATH.MARK_NOTIFICATION_AS_READ, validateToken, authorize(['Student']), markNotificationAsRead);

module.exports = notificationRoute;