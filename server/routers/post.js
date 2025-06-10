const express = require('express');
const postRouter = express.Router();
const Configs = require('../configs/Constants'); // Đường dẫn tới Constants
const post = require('../middleware/post-middleware/post'); // Đường dẫn tới file post.js vừa tạo
const { validateToken } = require('../middleware/auth-middleware/auth'); // Giả sử đây là middleware xác thực token của bạn

// Middleware này sẽ chạy mỗi khi có tham số :postId trong URL của postRouter
// Nó sẽ gọi hàm preloadPost từ post để tải thông tin bài viết vào req.post
postRouter.param('postId', post.preloadPost);

// Định nghĩa các routes

// 1. Tạo bài viết mới
// Yêu cầu xác thực token
postRouter.post(
    Configs.API_PATH.CREATE_POST,
    validateToken, // Middleware xác thực người dùng
    post.createPost
);

// 2. Lấy danh sách tất cả bài viết (có thể public hoặc yêu cầu token tùy theo logic của bạn)
// Hiện tại để public, không cần validateToken
postRouter.get(
    Configs.API_PATH.GET_ALL_POSTS,
    post.getAllPosts
);

// 3. Lấy chi tiết một bài viết bằng ID
// Hiện tại để public, không cần validateToken
// Middleware preloadPost đã được gọi tự động thông qua postRouter.param('postId', ...)
postRouter.get(
    Configs.API_PATH.GET_POST_BY_ID,
    post.getPostDetail
);

// 4. Cập nhật bài viết bằng ID
// Yêu cầu xác thực token VÀ người dùng phải là tác giả hoặc admin
// Middleware preloadPost được gọi tự động
postRouter.put( // Hoặc bạn có thể dùng .patch() nếu chỉ cập nhật một phần
    Configs.API_PATH.UPDATE_POST_BY_ID,
    validateToken,
    post.checkPostOwnershipOrAdmin, // Kiểm tra quyền sở hữu hoặc admin
    post.updatePostById
);

// 5. Xóa bài viết bằng ID
// Yêu cầu xác thực token VÀ người dùng phải là tác giả hoặc admin
// Middleware preloadPost được gọi tự động
postRouter.delete(
    Configs.API_PATH.DELETE_POST_BY_ID,
    validateToken,
    post.checkPostOwnershipOrAdmin, // Kiểm tra quyền sở hữu hoặc admin
    post.deletePostById
);

module.exports = postRouter;