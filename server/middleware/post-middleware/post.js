const mongoose = require('mongoose');
const Configs = require('../../configs/Constants'); // Đường dẫn tới file Constants của bạn

// Middleware phụ trợ: Gắn thông tin bài viết vào req để các middleware sau sử dụng
async function preloadPost(req, res, next, postId) {
    try {
        // Kiểm tra xem postId có phải là một ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json(Configs.RES_FORM("ID không hợp lệ", "ID bài viết không đúng định dạng."));
        }

        const post = await global.DBConnection.Post.findById(postId).populate('author', 'name vnu_id email role');
        if (!post) {
            return res.status(404).json(Configs.RES_FORM("Không tìm thấy", "Không tìm thấy bài viết với ID này."));
        }
        req.post = post; // Gắn bài viết đã tìm thấy vào request object
        return next();
    } catch (error) {
        console.error("Lỗi khi tải thông tin bài viết:", error);
        if (error.name === 'CastError') { // Thường xảy ra với ID không đúng định dạng dù đã check isValid
             return res.status(400).json(Configs.RES_FORM("ID không hợp lệ", "ID bài viết không đúng định dạng."));
        }
        return res.status(500).json(Configs.RES_FORM("Lỗi máy chủ nội bộ", error.message));
    }
}

// Middleware phụ trợ: Kiểm tra quyền sở hữu bài viết hoặc vai trò admin
// Cần chạy sau middleware xác thực token và preloadPost
function checkPostOwnershipOrAdmin(req, res, next) {
    // Giả sử req.senderInstance chứa thông tin người dùng đã đăng nhập (từ middleware xác thực)
    // và req.post chứa thông tin bài viết (từ middleware preloadPost)
    if (!req.senderInstance || !req.senderInstance._id) {
        return res.status(401).json(Configs.RES_FORM("Chưa xác thực", "Yêu cầu xác thực để thực hiện hành động này."));
    }
    if (!req.post) {
         return res.status(404).json(Configs.RES_FORM("Không tìm thấy", "Không tìm thấy bài viết để kiểm tra quyền."));
    }

    const isAdmin = req.senderInstance.role === 'admin';
    // Chuyển đổi _id sang string để so sánh an toàn
    const isAuthor = req.post.author && req.post.author._id.toString() === req.senderInstance._id.toString();

    if (isAuthor || isAdmin) {
        return next(); // Người dùng là tác giả hoặc admin, cho phép tiếp tục
    }

    return res.status(403).json(Configs.RES_FORM("Không có quyền", "Bạn không có quyền thực hiện hành động này với bài viết."));
}


/**
 * @description Tạo một bài viết mới.
 * Yêu cầu: người dùng đã đăng nhập (thông tin trong req.senderInstance)
 */
async function createPost(req, res) {
    try {
        const { title, content, type, tags, imageUrl } = req.body;

        if (!title || !content || !type) {
            return res.status(400).json(Configs.RES_FORM("Thiếu thông tin", "Tiêu đề, nội dung và loại bài viết là bắt buộc."));
        }

        // Đảm bảo req.senderInstance đã được thiết lập bởi middleware xác thực token
        if (!req.senderInstance || !req.senderInstance._id) {
            return res.status(401).json(Configs.RES_FORM("Chưa xác thực", "Người dùng chưa đăng nhập hoặc token không hợp lệ để tạo bài viết."));
        }

        const newPost = new global.DBConnection.Post({
            title,
            content,
            author: req.senderInstance._id,
            type,
            tags: tags || [],
            imageUrl: imageUrl || '',
        });

        const savedPost = await newPost.save();
        // Populate thông tin tác giả
        const populatedPost = await global.DBConnection.Post.findById(savedPost._id).populate('author', 'name vnu_id email role');

        res.status(201).json(Configs.RES_FORM("Tạo bài viết thành công", populatedPost));

    } catch (error) {
        console.error("Lỗi khi tạo bài viết:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json(Configs.RES_FORM("Dữ liệu không hợp lệ", messages.join(', ')));
        }
        res.status(500).json(Configs.RES_FORM("Lỗi máy chủ nội bộ", error.message));
    }
}

/**
 * @description Lấy danh sách tất cả bài viết, hỗ trợ phân trang và lọc.
 */
async function getAllPosts(req, res) {
    try {
        const { page = 1, limit = 10, type, authorId, tag, sortBy = 'createdAt', order = 'desc' } = req.query;

        const query = {};
        if (type) query.type = type;
        if (authorId) {
            if (!mongoose.Types.ObjectId.isValid(authorId)) {
                return res.status(400).json(Configs.RES_FORM("ID tác giả không hợp lệ", "ID tác giả cung cấp không đúng định dạng."));
            }
            query.author = authorId;
        }
        if (tag) query.tags = { $in: [tag] }; // Tìm bài viết chứa tag cụ thể

        const posts = await global.DBConnection.Post.find(query)
            .populate('author', 'name vnu_id email role') // Lấy thông tin cơ bản của tác giả
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 }) // Sắp xếp theo createdAt giảm dần (mới nhất trước)
            .lean(); // .lean() để trả về plain JS objects, nhanh hơn

        const totalPosts = await global.DBConnection.Post.countDocuments(query);

        res.status(200).json(Configs.RES_FORM("Lấy danh sách bài viết thành công", {
            posts,
            totalPages: Math.ceil(totalPosts / limit),
            currentPage: parseInt(page),
            totalPosts
        }));

    } catch (error) {
        console.error("Lỗi khi lấy danh sách bài viết:", error);
        res.status(500).json(Configs.RES_FORM("Lỗi máy chủ nội bộ", error.message));
    }
}

/**
 * @description Lấy chi tiết một bài viết bằng ID.
 * Sử dụng middleware preloadPost để tải bài viết vào req.post
 */
function getPostDetail(req, res) {
    // Thông tin bài viết đã được populate và gắn vào req.post bởi preloadPost
    if (req.post) {
        return res.status(200).json(Configs.RES_FORM("Lấy chi tiết bài viết thành công", req.post));
    } else {
        // Trường hợp này không nên xảy ra nếu preloadPost hoạt động đúng
        return res.status(404).json(Configs.RES_FORM("Không tìm thấy", "Không tìm thấy bài viết."));
    }
}


/**
 * @description Cập nhật một bài viết.
 * Yêu cầu: người dùng là tác giả bài viết hoặc admin.
 * Sử dụng middleware preloadPost và checkPostOwnershipOrAdmin.
 */
async function updatePostById(req, res) {
    try {
        const postToUpdate = req.post; // Lấy từ preloadPost
        const { title, content, type, tags, imageUrl } = req.body;

        // Chỉ cho phép cập nhật các trường nhất định
        if (title) postToUpdate.title = title;
        if (content) postToUpdate.content = content;
        if (type) postToUpdate.type = type;
        if (tags) postToUpdate.tags = tags; // Cho phép cập nhật mảng tags
        if (typeof imageUrl !== 'undefined') { // Chỉ cập nhật nếu imageUrl có trong request body
            postToUpdate.imageUrl = imageUrl;
        }

        // Mongoose sẽ tự động cập nhật trường `updatedAt` do {timestamps: true} trong schema
        const updatedPost = await postToUpdate.save();
        // Populate lại author nếu cần (thường không đổi nhưng để đảm bảo nhất quán)
        const populatedPost = await global.DBConnection.Post.findById(updatedPost._id).populate('author', 'name vnu_id email role');


        res.status(200).json(Configs.RES_FORM("Cập nhật bài viết thành công", populatedPost));

    } catch (error) {
        console.error("Lỗi khi cập nhật bài viết:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json(Configs.RES_FORM("Dữ liệu không hợp lệ", messages.join(', ')));
        }
        res.status(500).json(Configs.RES_FORM("Lỗi máy chủ nội bộ", error.message));
    }
}

/**
 * @description Xóa một bài viết.
 * Yêu cầu: người dùng là tác giả bài viết hoặc admin.
 * Sử dụng middleware preloadPost và checkPostOwnershipOrAdmin.
 */
async function deletePostById(req, res) {
    try {
        const postToDelete = req.post; // Lấy từ preloadPost

        await global.DBConnection.Post.findByIdAndDelete(postToDelete._id);

        res.status(200).json(Configs.RES_FORM("Xóa bài viết thành công", { postId: postToDelete._id, message: "Bài viết đã được xóa." }));

    } catch (error) {
        console.error("Lỗi khi xóa bài viết:", error);
        res.status(500).json(Configs.RES_FORM("Lỗi máy chủ nội bộ", error.message));
    }
}

module.exports = {
    preloadPost,
    checkPostOwnershipOrAdmin,
    createPost,
    getAllPosts,
    getPostDetail,
    updatePostById,
    deletePostById
};