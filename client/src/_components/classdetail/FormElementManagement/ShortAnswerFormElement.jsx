// components/FormElementManagement/ShortAnswerFormElement.jsx
import React from 'react';
import { Form, Input, InputNumber, Button, Divider } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

function ShortAnswerFormElement({
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
                <Form.Item label="Câu hỏi" style={{ marginBottom: 12 }}>
                    <ReactQuill
                        size="large"
                        placeholder="Nhập câu hỏi..."
                        value={element.questionText || ''}
                        onChange={(e) =>
                            onChange(index, [{ name: ['questionText'], value: e }])
                        }
                    />
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                <Form.Item label="Điểm" style={{ marginBottom: 12 }}>
                    <InputNumber
                        min={0}
                        value={element.score || 0}
                        onChange={(value) => onChange(index, [{ name: ['score'], value }])}
                    />
                </Form.Item>

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
                {element.questionText ? (
                    <ReactQuill
                        value={element.questionText}
                        readOnly={true}
                        theme={null}
                    />
                ) : (
                    <span>Câu hỏi tự luận</span>
                )}
            </div>
        );
    }
}

export default ShortAnswerFormElement;