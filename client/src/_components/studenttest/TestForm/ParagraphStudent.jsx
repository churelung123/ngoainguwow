import React, { useState, useEffect } from 'react';
import { Input, Typography } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ParagraphStudent = ({ question, onAnswerChange, label, answerText, readOnly }) => {
    const [localAnswer, setLocalAnswer] = useState('');

    useEffect(() => {
        if (readOnly && answerText) {
            setLocalAnswer(answerText);
        }
    }, [readOnly, answerText]);

    const handleAnswerChange = (e) => {
        if (!readOnly) {
            setLocalAnswer(e.target.value);
            onAnswerChange(e.target.value);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Typography.Title level={5} style={{ marginRight: '8px', marginBottom: '4px' }}>
                    Câu {label}:
                </Typography.Title>
                <div style={{ flex: 1 }}>
                    <ReactQuill
                        value={question.questionText}
                        readOnly={true}
                        theme={null}
                    />
                </div>
            </div>
            <Input.TextArea
                value={localAnswer}
                onChange={handleAnswerChange}
                readOnly={readOnly}
            />
        </div>
    );
};

ParagraphStudent.defaultProps = {
    readOnly: false,
};

export default ParagraphStudent;