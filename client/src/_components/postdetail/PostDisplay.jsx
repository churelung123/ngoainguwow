// src/_components/postdetail/PostDisplay.jsx
import React from 'react';
import DOMPurify from 'dompurify';
import './custom.css';
import { Height } from '@mui/icons-material';
// import { Link } from 'react-router-dom'; // Nếu bạn cần Link cho tags hoặc tác giả

// --- STYLES --- (Sao chép các style từ PostDetail.jsx liên quan đến hiển thị)
const titleStyle = {
    fontSize: '2.5em',
    marginBottom: '0.5em',
    color: '#333',
    borderBottom: '2px solid #eee',
    paddingBottom: '0.3em',
};

const metaInfoStyle = {
    fontSize: '0.9em',
    color: '#666',
    marginBottom: '20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    alignItems: 'center', // Căn giữa các item trong meta info
};

const authorStyle = { fontWeight: 'bold' };
const dateStyle = {};

const thumbnailStyle = {
    width: '20%',
    maxHeight: '500px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
};

const contentStyle = {
    fontSize: '1.1em',
    color: '#444',
};

const tagsContainerStyle = {
    marginTop: '30px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
};

const tagStyle = {
    display: 'inline-block',
    backgroundColor: '#e9ecef', // Màu xám nhạt hơn
    color: '#495057',          // Màu chữ tối hơn
    padding: '6px 12px',
    borderRadius: '20px',      // Bo tròn hơn
    marginRight: '10px',
    marginBottom: '10px',
    fontSize: '0.9em',
    textDecoration: 'none',
    transition: 'background-color 0.2s', // Hiệu ứng hover
    // ':hover': { // Không hoạt động trực tiếp trong inline style, cần thư viện CSS-in-JS hoặc CSS file
    //     backgroundColor: '#ced4da',
    // }
};


const PostDisplay = ({ post }) => {
    if (!post) {
        return null;
    }

    const cleanHtmlContent = DOMPurify.sanitize(post.content, {
        USE_PROFILES: { html: true }
    });

    const getTransformedCloudinaryUrl = (originalUrl, transformations) => {
        if (!originalUrl || !originalUrl.includes('res.cloudinary.com') || !transformations) {
            return originalUrl;
        }
        const parts = originalUrl.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/${transformations}/${parts[1]}`;
        }
        return originalUrl;
    };

    return (
        <>
            <h1 className="post-display-title">{post.title}</h1>

            <div className="post-display-meta-info">
                {post.author && (
                    <span className="post-display-author">
                        Tác giả: {post.author.name || 'Không rõ'}
                    </span>
                )}
                {post.author && <span className="meta-info-separator">|</span>}
                <span className="post-display-date">
                    Ngày đăng: {new Date(post.createdAt || post.created_date || Date.now()).toLocaleDateString('vi-VN', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                </span>
            </div>

            {post.imageUrl && (
                <img
                    src={getTransformedCloudinaryUrl(post.imageUrl, "w_900,c_limit,q_auto,f_auto")}
                    alt={post.title}
                    className="post-display-thumbnail"
                />
            )}

            <div
                className="quill-content-display"
                dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
            />

            {post.tags && post.tags.length > 0 && (
                <div className="post-display-tags-container">
                    <strong className="post-display-tags-label">Tags:</strong>
                    {post.tags.map((tag, index) => (
                        <span key={index} className="post-display-tag">{tag}</span>
                    ))}
                </div>
            )}
        </>
    );
};

export default PostDisplay;