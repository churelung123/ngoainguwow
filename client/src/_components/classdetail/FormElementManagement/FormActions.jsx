import React from 'react';
import { Button, Space } from 'antd';

function FormActions({ onSave, onCancel }) {
    return (
        <Space style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
                onClick={onSave}
                style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    marginRight: '8px',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease-in-out',
                    outline: 'none', // Loại bỏ viền mặc định
                    fontFamily: 'Arial, sans-serif', // Chọn font chữ
                    fontSize: '14px', // Kích thước chữ
                    fontWeight: 'bold', // Độ đậm của chữ
                    lineHeight: '1.5', // Khoảng cách dòng
                    boxSizing: 'border-box', // Đảm bảo padding không làm tăng kích thước
                    height: '36px', // Chiều cao cố định
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#40a9ff';
                    e.target.style.borderColor = '#40a9ff';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#1890ff';
                    e.target.style.borderColor = '#ccc';
                }}
                onFocus={(e) => {
                    e.target.style.backgroundColor = '#40a9ff';
                    e.target.style.borderColor = '#40a9ff';
                }}
            >
                Lưu
            </button>
            <button
                onClick={onCancel}
                style={{
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
                    outline: 'none', // Loại bỏ viền mặc định
                    fontFamily: 'Arial, sans-serif', // Chọn font chữ
                    fontWeight: 'bold',
                    fontSize: '14px', // Kích thước chữ
                    lineHeight: '1.5', // Khoảng cách dòng
                    boxSizing: 'border-box', // Đảm bảo padding không làm tăng kích thước
                    height: '36px', // Chiều cao cố định
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
                Hủy
            </button>
        </Space>
    );
}

export default FormActions;