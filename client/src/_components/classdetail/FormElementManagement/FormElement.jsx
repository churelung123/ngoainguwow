// components/FormElementManagement/FormElement.jsx
import React from 'react';
import { Card } from 'antd';
import MultipleChoiceFormElement from './MultipleChoiceFormElement';
import ShortAnswerFormElement from './ShortAnswerFormElement';
import ParagraphFormElement from './ParagraphFormElement';
import SectionTitleFormElement from './SectionTitleFormElement';
import DescriptionFormElement from './DescriptionFormElement';

function FormElement({ element, index, onChange, onDelete, isSelected, onClick }) {

    const handleClick = (event) => {
        event.stopPropagation(); // Ngăn chặn sự kiện lan truyền lên trên
        onClick();
    };

    return (
        <div style={{ display: 'flex' }}>
        <Card
            style={{
                marginBottom: 16,
                borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                borderLeft: isSelected ? '7px solid #1890ff' : '1px solid #e8e8e8',
                width: '100%',
                marginBottom: '10px',
                transition: '0.3s ease-in-out',
            }}
            onClick={handleClick}
        >
            {(element.type === 'multiple_choice' || element.type === 'checkbox') && (
                <MultipleChoiceFormElement
                    index={index}
                    element={element}
                    onChange={onChange}
                    onDelete={onDelete}
                    isSelected={isSelected}
                />
            )}
            {element.type === 'short_answer' && (
                <ShortAnswerFormElement
                    index={index}
                    element={element}
                    onChange={onChange}
                    onDelete={onDelete}
                    isSelected={isSelected}
                />
            )}
            {element.type === 'paragraph' && (
                <ParagraphFormElement
                    index={index}
                    element={element}
                    onChange={onChange}
                    onDelete={onDelete}
                    isSelected={isSelected}
                />
            )}
            {element.type === 'section_title' && (
                <SectionTitleFormElement
                    index={index}
                    element={element}
                    onChange={onChange}
                    onDelete={onDelete}
                    isSelected={isSelected}
                />
            )}
            {element.type === 'description' && (
                <DescriptionFormElement
                    index={index}
                    element={element}
                    onChange={onChange}
                    onDelete={onDelete}
                    isSelected={isSelected}
                />
            )}
            {/* Thêm các loại formElement khác */}
        </Card>
        </div>
    );
}

export default FormElement;