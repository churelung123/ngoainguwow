import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Row, Col, Button, Modal, Divider, Input, List, Avatar, message, Tag } from 'antd';
import { MessageOutlined, EnvironmentOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { useFetchWrapper } from '_helpers';
import io from 'socket.io-client';
import axios from 'axios';
import { authAtom, isTakingTestAtom } from '_state';

const { Footer } = Layout;
const { Text, Title, Link } = Typography;
const { TextArea } = Input;

const SOCKET_SERVER_URL = "http://localhost:5000";
const API_BASE_URL = process.env.REACT_APP_API_URL;


const branches = [
    {
        name: 'WOW Language School',
        address: 'P16-44-45 Trần Bạch Đằng, Khu Phú Cường, Rạch Giá, Kiên Giang',
        phone: '0297 3515 252',
        mapQuery: 'P16-44-45 Trần Bạch Đằng, Khu Phú Cường, Rạch Giá, Kiên Giang'
    },
    {
        name: 'WOW 30/4',
        address: 'G39 Lê Thánh Tôn, Chợ 30/4, Rạch Giá, Kiên Giang',
        phone: '02973 912 349',
        mapQuery: 'G39 Lê Thánh Tôn, Chợ 30/4, Rạch Giá, Kiên Giang'
    },
    {
        name: 'WOW Elite Way',
        address: 'PL1-15 Mai Chí Thọ, Khu Shophouse Phú Cường, Rạch Giá, Kiên Giang',
        phone: '0297 3515 252',
        mapQuery: 'PL1-15 Mai Chí Thọ, Khu Shophouse Phú Cường, Rạch Giá, Kiên Giang'
    },
    {
        name: 'WOW Elite Pathways ',
        address: 'L1-23-24, Trung tâm Thương mại Rạch Sỏi, Rạch Giá, Kiên Giang',
        phone: '0297 3515 252',
        mapQuery: 'Trung tâm Thương mại Rạch Sỏi, Rạch Giá, Kiên Giang'
    },
];

function AppFooter({ userRole, userId, isTakingTest }) {
    const [isChatModalVisible, setIsChatModalVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatPartners, setChatPartners] = useState([]);
    const [selectedChatPartner, setSelectedChatPartner] = useState(false);
    const [adminId, setAdminId] = useState(null);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fetchWrapper = useFetchWrapper();
    const [isSocketReady, setIsSocketReady] = useState(false);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const fetchAdminId = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/admin-id`);
            setAdminId(response.data.adminId);
            console.log('[Footer] Admin ID fetched:', response.data.adminId);
        } catch (error) {
            console.error('[Footer] Error fetching admin ID:', error);
            message.error('Không thể lấy thông tin Admin để chat.');
        }
    };

    const fetchChatPartners = async () => {
        if (userRole === 'admin') {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/chat/partners`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setChatPartners(response.data);
                console.log('[Footer] Chat partners fetched:', response.data);
            } catch (error) {
                console.error('[Footer] Error fetching chat partners:', error);
                message.error('Không thể tải danh sách người chat.');
            }
        }
    };

    const fetchChatHistory = async (partnerId = null) => {
        try {
            const token = localStorage.getItem('token');
            const targetId = userRole === 'admin' ? partnerId : adminId;

            if (!targetId) {
                console.warn('[Footer] Cannot fetch chat history: Target ID is null.');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/chat/history/${targetId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    userRole: userRole
                }
            });
            setMessages(response.data.history);
            console.log('[Footer] Chat history fetched:', response.data.history);
        } catch (error) {
            console.error('[Footer] Error fetching chat history:', error);
            message.error('Không thể tải lịch sử chat.');
        }
    };

    // useEffect để khởi tạo và quản lý Socket.IO connection
    useEffect(() => {
        if (!socketRef.current) {
            console.log('[Footer] Initializing Socket.IO connection...');
            const storedToken = localStorage.getItem('token');

            const newSocket = io(SOCKET_SERVER_URL, {
                auth: {
                    token: storedToken,
                },
                transports: ['websocket'],
            });

            newSocket.on('connect', () => {
                console.log('Connected to Socket.IO server for chat.');
                setIsSocketReady(true);
            });

            newSocket.on('userInfo', (info) => {
                // Backend gửi lại user_ref và isNew (guest) nếu là khách
                // Nếu user_ref thay đổi (ví dụ từ null -> guest_id), cần cập nhật state
                // Hiện tại user_ref đã được lưu trong socket.loginInfo ở backend
                // Chỉ log để biết
                console.log('[Footer] UserInfo from server:', info);
            });

            newSocket.on('receiveMessage', (msg) => {
                console.log('Received message:', msg);
                // Chỉ thêm tin nhắn nếu nó thuộc về cuộc trò chuyện hiện tại
                // Hoặc nếu là tin nhắn tổng quát cho admin
                const isMyMessage = msg.sender._id === userId;
                const isCurrentConversation = !selectedChatPartner || (selectedChatPartner && (msg.sender._id === selectedChatPartner.partnerId || msg.receiver === selectedChatPartner.partnerId));

                if (isMyMessage || isCurrentConversation || userRole === 'admin') {
                    setMessages((prevMessages) => [...prevMessages, msg]);
                }
            });

            newSocket.on('chatHistoryWithAdmin', (history) => {
                console.log('Received chat history (socket):', history);
                setMessages(history);
            });

            newSocket.on('chatPartnersList', (partners) => {
                console.log('Received chat partners list (socket):', partners);
                setChatPartners(partners);
            });

            newSocket.on('chatError', (error) => {
                console.error('Chat error:', error);
                message.error(`Lỗi chat: ${error.message || error}`);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from Socket.IO server.');
                setIsSocketReady(false);
            });
            socketRef.current = newSocket;
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Fetch admin ID once
    useEffect(() => {
        if (userRole !== 'admin' && !adminId) {
            fetchAdminId();
        }
    }, [userRole, adminId]);

    // useEffect để yêu cầu lịch sử chat hoặc danh sách đối tác khi modal hiển thị hoặc selectedChatPartner thay đổi
    useEffect(() => {
        if (isChatModalVisible && socketRef.current && isSocketReady) {
            if (userRole === 'admin') {
                if (selectedChatPartner) {
                    fetchChatHistory(selectedChatPartner.partnerId);
                } else {
                    fetchChatPartners();
                }
            } else {
                if (adminId) {
                    fetchChatHistory();
                }
            }
        }
    }, [isChatModalVisible, userRole, userId, selectedChatPartner, adminId, isSocketReady]);

    // Scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const showChatModal = () => {
        setIsChatModalVisible(true);

        console.log("thông tin: ", selectedChatPartner)
        if (userRole === 'admin') {
            // Admin user logic
            if (!selectedChatPartner) {
                fetchChatPartners();
            }else {
                fetchChatHistory(selectedChatPartner.partnerId);
            }
        } else {
            if (adminId) { // Đảm bảo đã có adminId
                fetchChatHistory(adminId); // Truyền adminId làm targetId
            } else {
                message.error("Không thể tải lịch sử chat: Không tìm thấy ID của Admin.");
                console.error("Admin ID is not available for chat history fetching.");
            }
        }
    };

    const handleChatModalOk = () => {
        setIsChatModalVisible(false);
        setSelectedChatPartner(null); // Reset selected chat partner khi đóng modal
        setMessages([]); // Clear messages when modal closes
    };

    const handleChatModalCancel = () => {
        setIsChatModalVisible(false);
        setSelectedChatPartner(null); // Reset selected chat partner khi đóng modal
        setMessages([]); // Clear messages when modal closes
    };

    const handleSelectChatPartner = (partner) => {
        setSelectedChatPartner(partner);
        setMessages([]); // Clear messages before fetching new history
        fetchChatHistory(partner.partnerId);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        if (!socketRef.current || !isSocketReady || !socketRef.current.connected) {
            console.warn('[Footer] ❌ Socket chưa kết nối — emit sẽ bị bỏ qua.');
            message.error('Kết nối chat chưa sẵn sàng. Vui lòng đợi kết nối...');
            return;
        }

        const messageToSend = {
            content: newMessage,
            messageType: 'text',
        };

        if (userRole === 'admin') {
            if (!selectedChatPartner) {
                message.warn('Admin phải chọn người để chat.');
                return;
            }
            messageToSend.receiver = selectedChatPartner.partnerId;
            messageToSend.receiverRole = selectedChatPartner.role; // ✅ PHẢI CÓ
        } else {
            messageToSend.receiver = adminId;
        }

        console.log('[Footer] ✅ Emit NewMessage:', messageToSend);
        socketRef.current.emit('NewMessage', messageToSend);

        // Gửi hiển thị ngay (optimistic update)
        setMessages((prevMessages) => [
            ...prevMessages,
            {
                sender: { _id: userId, name: userRole === 'admin' ? 'Admin' : 'Bạn', role: userRole },
                content: newMessage,
                timestamp: new Date().toISOString(),
                receiver: messageToSend.receiver,
            },
        ]);

        setNewMessage('');
    };

    const createGoogleMapsUrl = (query) => {
        return `https://www.google.com/maps/search/?api=1&query={encodeURIComponent(query)}`;
    };

    const shouldShowChatButton = !userRole || userRole === 'Student' || userRole === 'admin';

    if (isTakingTest) {
        return null;
    }

    return (
        <Footer id="app-footer" style={{
            marginBottom: '40px', padding: '20px 40px', border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9'
        }}>
            <Row gutter={[16, 32]} justify="space-around" style={{ marginBottom: '30px' }}>
                <Col xs={24} sm={12} md={8} lg={9} style={{ textAlign: 'center' }}>
                    <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px', color: '#007bff' }}>WOW English School</h2>
                    <Text>Email: <Link href="mailto:Wowenglishschool2018@gmail.com">Wowenglishschool2018@gmail.com</Link></Text>
                    <br />
                    <Text>Điện thoại chính: <Link href="tel:02973515252">0297 3515 252</Link></Text>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text>© {new Date().getFullYear()} WOW English School</Text>
                </Col>

                {shouldShowChatButton && (
                    <Col xs={24} sm={12} md={8} lg={6} style={{ textAlign: 'center', alignSelf: 'center' }}>
                        <Title level={5}>Hỗ Trợ Trực Tuyến</Title>
                        <Button
                            type="primary"
                            icon={<MessageOutlined />}
                            size="large"
                            onClick={showChatModal}
                            style={{ minWidth: '200px' }}
                        >
                            Chat với Admin
                        </Button>
                    </Col>
                )}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '30px' }}>
                <Col span={24} style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ marginBottom: '24px', color: '#1890ff' }}>Các Chi Nhánh Của Chúng Tôi</Title>
                </Col>
            </Row>

            <Row gutter={[16, 24]} justify="center">
                {branches.map((branch, index) => (
                    <Col key={index} xs={24} sm={12} md={12} lg={6} style={{ display: 'flex' }}>
                        <a
                            href={createGoogleMapsUrl(branch.mapQuery || branch.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', width: '100%', display: 'flex' }}
                            className="branch-card-link"
                        >
                            <div style={{
                                padding: '20px',
                                border: '1px solid #e8e8e8',
                                borderRadius: '8px',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                                transition: 'box-shadow 0.3s ease, transform 0.2s ease',
                                cursor: 'pointer'
                            }}
                            >
                                <Title level={5} style={{ marginBottom: '12px', color: '#0050b3' }}>
                                    <EnvironmentOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                                    {branch.name}
                                </Title>
                                <Text type="secondary" style={{ marginBottom: '8px', flexGrow: 1, minHeight: '60px' }}>{branch.address}</Text>
                                {branch.phone && (
                                    <Text style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px dashed #f0f0f0' }}>
                                        <MessageOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                        Điện thoại: <Link href={`tel:${branch.phone.replace(/\s/g, '')}`} onClick={(e) => e.stopPropagation()}>{branch.phone}</Link>
                                    </Text>
                                )}
                            </div>
                        </a>
                    </Col>
                ))}
                {branches.length === 0 && (
                    <Col span={24} style={{ textAlign: 'center' }}>
                        <Text>Hiện chưa có thông tin chi nhánh.</Text>
                    </Col>
                )}
            </Row>

            <Modal
                title={userRole === 'admin' ? `Chat với bộ phận hỗ trợ ${selectedChatPartner ? `- ${selectedChatPartner.name}` : ''}` : "Chat với bộ phận hỗ trợ"}
                visible={isChatModalVisible}
                onOk={handleChatModalOk}
                onCancel={handleChatModalCancel}
                footer={null}
                width={userRole === 'admin' ? 800 : 600}
                bodyStyle={{ padding: 0 }}
            >
                <div style={{ display: 'flex', height: 400 }}>
                    {userRole === 'admin' && !selectedChatPartner && (
                        <div style={{ width: '100%', overflowY: 'auto', borderRight: '1px solid #f0f0f0' }}>
                            <List
                                itemLayout="horizontal"
                                dataSource={chatPartners}
                                renderItem={partner => (
                                    <List.Item
                                        actions={[<Button type="link" onClick={() => handleSelectChatPartner(partner)}>Chat</Button>]}
                                        style={{ cursor: 'pointer', padding: '12px 16px', backgroundColor: selectedChatPartner?.partnerId === partner.partnerId ? '#e6f7ff' : 'white' }}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} />}
                                            title={
                                                <>
                                                    {partner.name || 'Unknown'}
                                                    <Tag style={{ marginLeft: '8px' }} color={partner.role === 'admin' ? 'blue' : partner.role === 'Student' ? 'green' : partner.role === 'teacher' ? 'orange' : 'default'}>
                                                        {partner.role}
                                                    </Tag>
                                                </>
                                            }
                                            description={partner.lastMessage || 'Chưa có tin nhắn'}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}

                    {(userRole !== 'admin' || selectedChatPartner) && (
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px' }}>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={messages}
                                    renderItem={msg => (
                                        <List.Item style={{
                                            justifyContent: msg.sender?.role === userRole || msg.sender?._id === userId ? 'flex-end' : 'flex-start',
                                            padding: '4px 0'
                                        }}>
                                            <div style={{
                                                backgroundColor: msg.sender?.role === userRole || msg.sender?._id === userId ? '#e6f7ff' : '#f0f2f5',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                maxWidth: '70%',
                                                wordBreak: 'break-word'
                                            }}>
                                                <Text strong>{msg.sender?.name || (msg.sender?._id === userId ? 'Bạn' : 'Admin')}</Text>
                                                <p style={{ margin: 0 }}>{msg.content}</p>
                                                <Text type="secondary" style={{ fontSize: '0.75em' }}>
                                                    {formatTimestamp(msg.timestamp)}
                                                </Text>
                                            </div>
                                        </List.Item>
                                    )}
                                >
                                    <div ref={messagesEndRef} />
                                </List>
                            </div>
                            <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', display: 'flex' }}>
                                <TextArea
                                    rows={1}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onPressEnter={(e) => {
                                        if (!e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Nhập tin nhắn..."
                                    style={{ flexGrow: 1, marginRight: '8px' }}
                                    disabled={userRole === 'admin' && !selectedChatPartner}
                                />
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSendMessage}
                                    disabled={!isSocketReady || (userRole === 'admin' && !selectedChatPartner)}
                                >
                                    Gửi
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <style jsx global>{`
                #app-footer .ant-list-item-meta-title {
                    margin-bottom: 2px;
                }
                #app-footer .ant-typography a {
                    color: #1890ff;
                }
                #app-footer .ant-typography a:hover {
                    color: #40a9ff;
                }
                .branch-card-link div:hover {
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
                    transform: translateY(-3px);
                }
            `}</style>
        </Footer>
    );
}

export { AppFooter };