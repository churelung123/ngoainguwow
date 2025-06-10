import React, { useState, useEffect } from 'react';
import { Checkbox, Typography } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const CheckboxStudent = ({ question, onAnswerChange, label, selectedAnswers, readOnly }) => {
    const [localSelectedAnswers, setLocalSelectedAnswers] = useState([]);
    const [shuffledOptions, setShuffledOptions] = useState([]);

    useEffect(() => {
        if (question.options) {
            const shuffled = shuffleArray([...question.options]);
            setShuffledOptions(shuffled);
        }
        if (readOnly && selectedAnswers) {
            setLocalSelectedAnswers(selectedAnswers);
        }
    }, [question]);

    const handleCheckboxChange = (optionId, isChecked) => {
        if (!readOnly) {
            setLocalSelectedAnswers(prev => {
                let updated;
                if (isChecked) {
                    updated = [...prev, optionId];
                } else {
                    updated = prev.filter(id => id !== optionId);
                }
                onAnswerChange(updated);
                return updated;
            });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Typography.Title level={5} style={{ marginRight: '8px', marginBottom: '4px' }}>
                    Câu {label}:
                </Typography.Title>
                <div style={{ flex: 1 }}>
                    <ReactQuill value={question.questionText} readOnly={true} theme={null} />
                </div>
            </div>
            {shuffledOptions.map((option) => (
                <div key={option._id}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                        <Checkbox
                            checked={readOnly ? selectedAnswers?.includes(option._id) : localSelectedAnswers.includes(option._id)}
                            onChange={e => handleCheckboxChange(option._id, e.target.checked)}
                            style={{ marginTop: 5 }}
                            disabled={readOnly}
                        >
                            <div style={{ marginLeft: 8, flex: 1 }}>
                                <ReactQuill value={option.text} readOnly={true} theme={null} />
                            </div>
                        </Checkbox>
                    </div>
                </div>
            ))}
        </div>
    );
};

CheckboxStudent.defaultProps = {
    readOnly: false,
};

export default CheckboxStudent;