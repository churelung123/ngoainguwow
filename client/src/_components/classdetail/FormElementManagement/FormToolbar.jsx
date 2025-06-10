import React from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

function FormToolbar({ onAddElement }) {
    return (
        <div style={{
            backgroundColor: '#f0f2ff',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d9d9d9',
            width: '200px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Typography.Title level={4} style={{ marginBottom: '10px', color: '#555', textAlign: 'center' }}>
                Thêm Phần Tử
            </Typography.Title>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
            }}>
                {['multiple_choice', 'short_answer', 'paragraph', 'section_title', 'description'].map(type => (
                    <button
                        key={type}
                        onClick={() => onAddElement(type)}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            color: '#333',
                            border: '1px solid #ccc',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            marginBottom: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease-in-out',
                            boxSizing: 'border-box',
                            flex: '1 0 auto',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            outline: 'none', // Loại bỏ viền khi focus
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e6f7ff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                        }}
                        onFocus={(e) => {
                            e.target.style.outline = 'none'; // Loại bỏ viền khi focus (cho các trình duyệt khác)
                        }}
                    >
                        <PlusOutlined style={{ marginRight: '8px' }} />
                        {type === 'multiple_choice' ? 'Trắc Nghiệm' :
                         type === 'short_answer' ? 'Tự Luận' :
                         type === 'paragraph' ? 'Đoạn Văn' :
                         type === 'section_title' ? 'Tiêu Đề Mục' :
                         type === 'description' ? 'Mô Tả' : type}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default FormToolbar;