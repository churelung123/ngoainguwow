// src/_components/homepagecontent/PostSectionLayout.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './custom.css'

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

const PostSectionLayout = ({ sectionTitle, latestPost, otherPosts = [], seeMorePath = "/" }) => {

    if (!latestPost && otherPosts.length === 0) {
        return (
            <div className="post-section-container"> 
                <h2 className="section-title-custom">{sectionTitle}</h2> 
                <p>Chưa có bài viết nào trong mục này.</p>
            </div>
        );
    }
    const imageSizeForSmallPost = 100;
    const latestPostTransformSize = 500;
    return (
        <div className="post-section-container">
            <h2 className="section-title-custom"> 
                {sectionTitle}
            </h2>
            <div className="posts-layout-grid"> 
                {latestPost && (
                    <Link
                        to={`/posts/${latestPost._id}`}
                        className="latest-post-card-square"
                    >
                        {latestPost.imageUrl && (
                            <img
                                src={getTransformedCloudinaryUrl(
                                    latestPost.imageUrl,
                                    `w_${latestPostTransformSize},h_${latestPostTransformSize},c_fill,g_auto,q_auto,f_auto`
                                )}
                                alt={latestPost.title}
                                className="latest-post-image-zoom"
                                onError={(e) => {e.target.src = 'https://via.placeholder.com/300x150?text=Image+Error'}}
                            />
                        )}
                        <div className="latest-post-overlay-content"> 
                            <h3 className="latest-post-title">{latestPost.title}</h3> 
                            {latestPost.author && (
                                <p className="latest-post-author"> 
                                    Tác giả: {latestPost.author.name || 'N/A'}
                                </p>
                            )}
                        </div>
                    </Link>
                )}

                {otherPosts.length > 0 && (
                    <div className="other-posts-column"> 
                        {otherPosts.map(post => (
                            <Link
                                key={post._id}
                                to={`/posts/${post._id}`}
                                className="small-post-card" // Class đã có
                            >
                                {post.imageUrl && (
                                    <div className="small-post-image-container"> 
                                        <img
                                            src={getTransformedCloudinaryUrl(post.imageUrl, `w_${imageSizeForSmallPost},h_${imageSizeForSmallPost},c_fill,g_auto,q_auto,f_auto`)}
                                            alt={post.title}
                                            className="small-post-image" // Sử dụng class
                                            onError={(e) => {e.target.src = 'https://via.placeholder.com/300x150?text=Image+Error'}}
                                        />
                                    </div>
                                )}
                                <div className="small-post-content-container"> 
                                    <h4 className="small-post-title">{post.title}</h4> 
                                    <p className="post-date-meta"> 
                                        {new Date(post.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </Link>
                        ))}
                        <Link to={seeMorePath} className="see-more-link">Xem tất cả &raquo;</Link> {/* Class đã có */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostSectionLayout;