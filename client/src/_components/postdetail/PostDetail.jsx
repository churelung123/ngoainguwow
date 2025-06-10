// src/components/PostDetail/PostDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useHistory, Link } from 'react-router-dom'; // Thêm Link nếu cần
import { useFetchWrapper, useAuthWrapper } from '_helpers';
import PostDisplay from './PostDisplay';

export { PostDetail };

const PostDetail = () => {
    const { id } = useParams(); // Lấy ID bài viết từ URL
    const history = useHistory();
    const fetchWrapper = useFetchWrapper();
    const authWrapper = useAuthWrapper(); // Giữ lại nếu bạn vẫn cần kiểm tra auth

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPostDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const responseData = await fetchWrapper.get(`/api/posts/${id}`);
                const data = await responseData.json();

                if (data && (data.result || data.message)) {
                    const fetchedPost = data.message;
                    if (typeof fetchedPost === 'object' && fetchedPost !== null) {
                        setPost(fetchedPost);
                    } else {
                         // Trường hợp response có nhưng không phải object post
                        console.error("Dữ liệu bài viết không hợp lệ:", fetchedPost);
                        setError("Không thể tải chi tiết bài viết. Dữ liệu không hợp lệ.");
                    }
                } else {
                    // Trường hợp response không có result hoặc message, hoặc cấu trúc không đúng
                    console.error("API response không hợp lệ:", responseData);
                    setError(responseData?.status || "Không thể tải chi tiết bài viết.");
                }
            } catch (err) {
                console.error("Lỗi khi tải chi tiết bài viết:", err);
                setError(err.message || "Lỗi kết nối hoặc lỗi không xác định.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPostDetail();
        } else {
            setError("Không có ID bài viết.");
            setLoading(false);
        }
    // Dependency array: authWrapper.tokenValue, history, id, fetchWrapper
    // Nếu fetchWrapper không thay đổi, có thể bỏ ra
    }, []);


    // --- STYLES --- 
    const pageContainerStyle = {
        maxWidth: '100%',
        margin: '20px auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif', // Font chung có thể đặt ở App.js hoặc index.css
        lineHeight: '1.6',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    };

    const loadingErrorStyle = {
        textAlign: 'center',
        padding: '40px 20px',
        fontSize: '1.2em',
        minHeight: '200px', // Để giữ không gian khi loading/error
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return <div style={pageContainerStyle}><div style={loadingErrorStyle}>Đang tải bài viết...</div></div>;
    }

    if (error) {
        return <div style={pageContainerStyle}><div style={{ ...loadingErrorStyle, color: 'red' }}>Lỗi: {error}</div></div>;
    }

    if (!post) {
        // Đã có kiểm tra post hợp lệ hơn trong useEffect, nhưng vẫn giữ lại để an toàn
        return <div style={pageContainerStyle}><div style={loadingErrorStyle}>Không tìm thấy bài viết.</div></div>;
    }

    return (
        <div style={pageContainerStyle}>
            <PostDisplay post={post} />
            {/* Các phần khác có thể thêm vào PostDetail nếu cần, ví dụ:
                - Nút sửa/xóa bài viết (nếu người dùng có quyền)
                - Khu vực bình luận (có thể là một component riêng nữa)
            */}
        </div>
    );
};