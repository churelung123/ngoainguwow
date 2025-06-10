// components/FormElementManagement/MultipleChoiceFormElement.jsx
import React, { useState } from 'react';
import { Form, Input, Checkbox, Radio, Button, Space, Divider, InputNumber, Row, Col } from 'antd';
import { DeleteOutlined, PlusOutlined, RetweetOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function MultipleChoiceFormElement({
    index,
    element,
    onChange,
    onDelete,
    isSelected,
}) {
    const [useCheckbox, setUseCheckbox] = useState(element.type === 'checkbox'); // Initialize based on element type

    const handleOptionChange = (optionIndex, key, value) => {
        const updatedOptions = [...(element.options || [])];
        if (!updatedOptions[optionIndex]) {
            updatedOptions[optionIndex] = {};
        }
        updatedOptions[optionIndex][key] = value;

        if (!useCheckbox && key === 'isCorrect' && value) {
            // If using radio buttons, unselect other options
            updatedOptions.forEach((opt, idx) => {
                if (idx !== optionIndex) {
                    opt.isCorrect = false;
                }
            });
        }

        onChange(index, [{ name: ['options'], value: updatedOptions }]);
    };

    const handleAddOption = () => {
        const updatedOptions = [...(element.options || [])];
        updatedOptions.push({ text: '', isCorrect: false });
        onChange(index, [{ name: ['options'], value: updatedOptions }]);
    };

    const handleDeleteOption = (optionIndex) => {
        const updatedOptions = (element.options || []).filter(
            (_, idx) => idx !== optionIndex
        );
        onChange(index, [{ name: ['options'], value: updatedOptions }]);
    };

    const handleDeleteClick = (event) => {
        event.stopPropagation();
        onDelete(index);
    };

    const handleToggleCheckbox = () => {
        const nextUseCheckbox = !useCheckbox;
        // When toggling, reset all isCorrect values to false
        const updatedOptions = (element.options || []).map(option => ({
            ...option,
            isCorrect: false
        }));
        onChange(index, [
            { name: ['options'], value: updatedOptions },
            { name: ['type'], value: nextUseCheckbox ? 'checkbox' : 'multiple_choice' },
        ]);
        setUseCheckbox(nextUseCheckbox);
    };


    if (isSelected) {
        // Display editing tools
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

                <div style={{ marginBottom: 12 }}>
                    {element.options &&
                        element.options.map((option, optionIndex) => (
                            <Space key={optionIndex} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                {useCheckbox ? (
                                    <Checkbox
                                        checked={option.isCorrect || false}
                                        onChange={(e) =>
                                            handleOptionChange(optionIndex, 'isCorrect', e.target.checked)
                                        }
                                    />
                                ) : (
                                    <Radio
                                        checked={option.isCorrect || false}
                                        onChange={(e) =>
                                            handleOptionChange(optionIndex, 'isCorrect', e.target.checked)
                                        }
                                    />
                                )}
                                <ReactQuill
                                    placeholder={`Lựa chọn ${optionIndex + 1}`}
                                    value={option.text || ''}
                                    onChange={(e) =>
                                        handleOptionChange(optionIndex, 'text', e)
                                    }
                                    style={{ flex: 1 }}
                                />
                                <DeleteOutlined
                                    onClick={() => handleDeleteOption(optionIndex)}
                                    style={{ color: 'red', cursor: 'pointer', marginTop: 6 }}
                                />
                            </Space>
                        ))}
                    <Button
                        type="dashed"
                        onClick={handleAddOption}
                        icon={<PlusOutlined />}
                        block
                        style={{ marginTop: 8 }}
                    >
                        Thêm lựa chọn
                    </Button>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <Form.Item label="Điểm" style={{ marginBottom: 12 }}>
                    <InputNumber
                        min={0}
                        value={element.score || 0}
                        onChange={(value) => onChange(index, [{ name: ['score'], value }])}
                    />
                </Form.Item>


                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                    <button
                        onClick={handleToggleCheckbox}
                        onMouseDown={(e) => e.preventDefault()} // prevent selected black border
                        style={{
                            backgroundColor: '#40a9ff',
                            color: 'white',
                            border: '1px solid #40a9ff',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#69c0ff';
                            e.target.style.borderColor = '#69c0ff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#40a9ff';
                            e.target.style.borderColor = '#40a9ff';
                        }}
                        onFocus={(e) => {
                            e.target.style.backgroundColor = '#69c0ff';
                            e.target.style.borderColor = '#69c0ff';
                        }}
                    >
                        <RetweetOutlined style={{ marginRight: '4px' }} />
                        {useCheckbox ? "Chuyển sang Radio" : "Chuyển sang Checkbox"}
                    </button>

                    <button
                        onClick={handleDeleteClick}
                        style={{
                            backgroundColor: '#f5585a',
                            color: 'white',
                            border: '1px solid #f5585a',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
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
        // Display simple version
        return (
            <div>
                {element.questionText ? (
                    <ReactQuill
                        value={element.questionText}
                        readOnly={true}
                        theme={null}
                    />
                ) : (
                    <span>Câu hỏi trắc nghiệm</span>
                )}
                {element.options && (
                    <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                        {element.options.map((option, optionIndex) => (
                            <li key={optionIndex} style={{ display: 'flex', alignItems: 'center' }}>
                                {useCheckbox ? (
                                    <Checkbox
                                        checked={option.isCorrect || false}
                                        readOnly
                                    />
                                ) : (
                                    <Radio
                                        checked={option.isCorrect || false}
                                        readOnly
                                    />
                                )}
                                <div style={{ marginLeft: 8, flex: 1 }}>
                                    <ReactQuill
                                        placeholder={`Lựa chọn ${optionIndex + 1}`}
                                        value={option.text}
                                        readOnly={true}
                                        theme={null}
                                        style={{ height: 'auto' }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }
}

export default MultipleChoiceFormElement;