// components/FormElementManagement/SectionTitleFormElement.jsx
import React from 'react';
import { Form, Input, Button, Divider } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

function SectionTitleFormElement({
    index,
    element,
    onChange,
    onDelete,
    isSelected,
}) {
    const handleDeleteClick = (event) => {
        event.stopPropagation();
        onDelete(index);
    };
    if (isSelected) {
        return (
            <div>
                <Form.Item label="Tiêu đề Mục" style={{ marginBottom: 12 }}>
                    <ReactQuill
                        size="large"
                        placeholder="Nhập tiêu đề mục..."
                        value={element.title || ''}
                        onChange={(e) => onChange(index, [{ name: ['title'], value: e }])}
                        modules={{  // Toolbar configuration (optional)
                            toolbar: [
                                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                ['clean']
                            ]
                        }}
                    />
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ textAlign: 'right' }}>
                    <button
                        onClick={handleDeleteClick}
                        style={{
                            backgroundColor: '#ff4d4f', // Màu đỏ
                            color: 'white',
                            border: '1px solid #ccc',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f5585a';
                            e.target.style.borderColor = '#f5585a';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#ff4d4f';
                            e.target.style.borderColor = '#ccc';
                        }}
                        onFocus={(e) => {
                            e.target.style.backgroundColor = '#f5585a';
                            e.target.style.borderColor = '#f5585a';
                        }}
                    >
                        <DeleteOutlined style={{ marginRight: '4px' }} />
                        Xóa
                    </button>
                </div>
            </div>
        );
    } else {
        return (
            <div>
                {element.title ? (
                    <ReactQuill
                        value={element.title}
                        readOnly={true}
                        theme={null}
                    />
                ) : (
                    <span>Tiêu đề</span>
                )}
            </div>
        );
    }
}

export default SectionTitleFormElement;