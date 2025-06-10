import React, { useEffect, useState } from 'react';
import loginTitleImage from '../../images/TitlePic.png';
import { Link, useHistory } from 'react-router-dom';
import { useFetchWrapper } from '_helpers';
import PostSectionLayout from './PostSectionLayout';
import { useAuthWrapper } from '_helpers';
import './custom.css';

export { HomePageContent };

    const HomePageContent = ({userRole, userId}) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const history = useHistory();
    const [error, setError] = useState(null);
    const fetchWrapper = useFetchWrapper();
    const [user, setUser] = useState(null);

    const [latestNewsPost, setLatestNewsPost] = useState(null);
    const [otherNewsPosts, setOtherNewsPosts] = useState([]);
    const [latestCoursePost, setLatestCoursePost] = useState(null);
    const [otherCoursePosts, setOtherCoursePosts] = useState([]);
    const authWrapper = useAuthWrapper();

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const userData = await authWrapper.getUserInfo();
                if (userData && userData._id) {
                    setUser(userData);
                }
                const responseData = await fetchWrapper.get(
                    '/api/posts' // Lấy 6 bài mới nhất
                );

                const data = await responseData.json();
                if (data.status === "Lấy danh sách bài viết thành công" && data.message) {
                    const allFetchedPosts = data.message.posts;

                    console.log("All fetched posts:", allFetchedPosts);

                    const news = allFetchedPosts.filter(p => p.type === 'Post');
                    const courses = allFetchedPosts.filter(p => p.type === 'Course');

                    if (news.length > 0) {
                        setLatestNewsPost(news[0]); // Bài mới nhất
                        setOtherNewsPosts(news.slice(1, 4)); // 3 bài tiếp theo
                    } else {
                        setLatestNewsPost(null);
                        setOtherNewsPosts([]);
                    }

                    if (courses.length > 0) {
                        setLatestCoursePost(courses[0]);
                        setOtherCoursePosts(courses.slice(1, 4));
                    } else {
                        setLatestCoursePost(null);
                        setOtherCoursePosts([]);
                    }

                } else {
                    setError(data?.message || data?.result || 'Không thể tải bài viết hoặc dữ liệu không đúng.');
                    setLatestNewsPost(null); setOtherNewsPosts([]);
                    setLatestCoursePost(null); setOtherCoursePosts([]);
                }

            } catch (err) {
                console.error("Lỗi khi tải bài viết:", err);
                setError(err.message || 'Lỗi kết nối hoặc lỗi không xác định.');
                setPosts([]); // Đặt lại posts thành mảng rỗng nếu có lỗi
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const handleAddNewPost = () => {
        history.push('/create-post');
    };

    const centerStyle = { textAlign: 'center' };

    if (loading) {
        return <div style={centerStyle}><p>Đang tải dữ liệu...</p></div>;
    }

    if (error) {
        return <div style={centerStyle}><p style={{ color: 'red' }}>Lỗi: {error}</p></div>;
    }

    return (
        <div style={{ textAlign: 'center' }}>
            {/* Hình ảnh tiêu đề */}
            <div style={{ margin: 0, padding: 0 }}>
                <img
                    src={loginTitleImage}
                    alt="WOW"
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        margin: '0 auto',
                        maxWidth: '100%',
                    }}
                />
            </div>
            <div>
                {/* Khu vực Tin tức */}
                <div id='news-posts'>
                    <PostSectionLayout
                        sectionTitle="Tin Tức Mới Nhất"
                        latestPost={latestNewsPost}
                        otherPosts={otherNewsPosts}
                        seeMorePath="/news" // Đường dẫn đến trang danh sách tất cả tin tức
                    />
                </div>

                {/* Khu vực Khóa học */}
                <div id='course-posts'>
                    <PostSectionLayout
                        sectionTitle="Khóa Học Nổi Bật"
                        latestPost={latestCoursePost}
                        otherPosts={otherCoursePosts}
                        seeMorePath="/courses" // Đường dẫn đến trang danh sách tất cả khóa học
                    />
                </div>
            </div>
            {userId && userRole === 'admin' && (
                <button
                    className="fab-add-post"
                    onClick={handleAddNewPost}
                    title="Thêm bài viết"
                >
                    +
                    <span className="fab-tooltip">Thêm bài viết</span>
                </button>
            )}
        </div>

    );
};

export default HomePageContent;