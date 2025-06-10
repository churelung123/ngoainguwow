import React, { useState, useEffect } from 'react';
import { Radio, Typography } from 'antd';
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

const MultipleChoiceStudent = ({ question, onAnswerChange, label, selectedAnswer, readOnly }) => {
    const [localSelectedAnswer, setLocalSelectedAnswer] = useState(null);
    const [shuffledOptions, setShuffledOptions] = useState([]);

    useEffect(() => {
        const shuffled = shuffleArray([...question.options]);
        setShuffledOptions(shuffled);
        if (readOnly && selectedAnswer) {
            setLocalSelectedAnswer(selectedAnswer);
        }
    }, [question, readOnly, selectedAnswer]);

    const handleOptionChange = (value) => {
        if (!readOnly) {
            setLocalSelectedAnswer(value);
            onAnswerChange(value);
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
            {shuffledOptions.map((option) => (
                <div key={option._id}>
                    <Radio
                        value={option._id}
                        checked={readOnly ? selectedAnswer === option._id : localSelectedAnswer === option._id}
                        onChange={() => handleOptionChange(option._id)}
                        tabIndex={-1}
                        onKeyDown={e => e.preventDefault()}
                        disabled={readOnly}
                    >
                        <div style={{ pointerEvents: 'none' }}>
                            <ReactQuill value={option.text} readOnly={true} theme={null} />
                        </div>
                    </Radio>
                </div>
            ))}
        </div>
    );
};

MultipleChoiceStudent.defaultProps = {
    readOnly: false,
};

export default MultipleChoiceStudent;