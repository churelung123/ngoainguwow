// StudentTest.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Card, Button, message, Modal, Radio, Input, Checkbox } from 'antd';
import { useSetRecoilState } from 'recoil'; 
import { isTakingTestAtom } from '_state'; 

import MultipleChoiceStudent from './TestForm/MultipleChoiceStudent';
import ShortAnswerStudent from './TestForm/ShortAnswerStudent';
import ParagraphStudent from './TestForm/ParagraphStudent';
import CheckboxStudent from './TestForm/CheckboxStudent';
import SectionTitleStudent from './TestForm/SectionTitleStudent';
import DescriptionStudent from './TestForm/DescriptionStudent';
import { ClockCircleOutlined, FlagOutlined, FlagFilled } from '@ant-design/icons';

export function StudentTest() {
    const { classId, testId, studentId } = useParams();
    const [testData, setTestData] = useState(null);
    const [studentAnswers, setStudentAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const history = useHistory();
    const [isFirstRender, setIsFirstRender] = useState(true);
    const questionRefs = useRef([]);
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [isTestSubmitted, setIsTestSubmitted] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [testResult, setTestResult] = useState(null);
    // [KHÔNG CẦN NỮA] const [hasAttemptsRemaining, setHasAttemptsRemaining] = useState(true);
    // [KHÔNG CẦN NỮA] const [attemptsInfo, setAttemptsInfo] = useState(null);
    // [KHÔNG CẦN NỮA] const [isLoading, setIsLoading] = useState(true); 

    const [colorIndex, setColorIndex] = useState(0);
    const colors = ['#f5585a', 'black'];

    const setIsTakingTest = useSetRecoilState(isTakingTestAtom);

    useEffect(() => {
        setIsTakingTest(true);
        return () => {
            setIsTakingTest(false);
        };
    }, []);

    const isAnswered = (answer) => {
        if (answer == null) return false;
        if (typeof answer === 'string') return answer.trim() !== '';
        if (Array.isArray(answer)) return answer.length > 0;
        if (typeof answer === 'object') return Object.keys(answer).length > 0;
        return false;
    };

    useEffect(() => {
        const fetchTestData = async () => {
            // [Đã hoàn nguyên] Xóa logic kiểm tra lượt làm bài ở đây
            // vì việc kiểm tra đã được thực hiện ở TestManagement.jsx

            try {
                const response = await fetch(`/api/tests/${testId}/Student/${studentId}`);
                const data = await response.json();
                if (data.status === "Success") {
                    setTestData(data.message);
                    setTimeLeft(data.message.duration * 60);
                    setIsFirstRender(false);
                } else {
                    // Nếu có lỗi tải bài kiểm tra, quay lại trang trước
                    message.error(data.message || 'Không thể tải bài kiểm tra. Vui lòng thử lại.');
                    history.goBack(); // Hoặc history.push(`/class/${classId}`)
                }
            } catch (error) {
                console.error('Lỗi lấy dữ liệu:', error);
                message.error('Không thể tải bài kiểm tra.');
                history.goBack(); // Hoặc history.push(`/class/${classId}`)
            }
        };

        fetchTestData();

    }, [classId, testId, studentId, history]); // Thêm history vào dependencies

    useEffect(() => {
        // Chỉ chạy timer nếu chưa nộp bài VÀ dữ liệu đã được tải
        if (!isFirstRender && !isTestSubmitted && testData) { // Loại bỏ hasAttemptsRemaining khỏi điều kiện
            const timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    const newTime = prevTime - 1;
                    if (newTime <= 0) {
                        clearInterval(timer);
                        handleSubmitTest();
                    }
                    return newTime;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isFirstRender, isTestSubmitted, testData]);

    useEffect(() => {
        const colorChangeInterval = setInterval(() => {
            setColorIndex(prevIndex => (prevIndex + 1) % colors.length);
        }, 500);

        return () => clearInterval(colorChangeInterval);
    }, []);

    const handleAnswerChange = (elementId, answer) => {
        // Chỉ cho phép thay đổi nếu chưa nộp bài (không cần kiểm tra hasAttemptsRemaining ở đây nữa)
        if (!isTestSubmitted) { 
            setStudentAnswers(prevAnswers => ({
                ...prevAnswers,
                [elementId]: answer,
            }));
        }
    };

    const handleSubmitTest = async () => {
        if (isTestSubmitted) return; // Ngăn nộp nhiều lần
        // [Đã hoàn nguyên] Loại bỏ kiểm tra !hasAttemptsRemaining ở đây
        // if (!hasAttemptsRemaining) { 
        //     message.error('Bạn đã hết lượt làm bài cho bài kiểm tra này.');
        //     return;
        // }

        let totalScore = 0;
        const detailedAnswers = [];

        testData.formElements.forEach((element) => {
            const studentAnswer = studentAnswers[element._id];

            if (['section_title', 'description'].includes(element.type)) {
                return;
            }

            let questionScore = 0;

            const correctAnswerIds = element.options?.filter(opt => opt.isCorrect)?.map(opt => opt._id.toString()) || [];

            if (element.type === 'multiple_choice') {
                const selectedId = Array.isArray(studentAnswer)
                    ? studentAnswer[0]
                    : studentAnswer;

                if (correctAnswerIds.includes(selectedId?.toString())) {
                    questionScore = element.score || 1;
                } else {
                    questionScore = 0;
                }
            } else if (element.type === 'checkbox') {
                const selected = studentAnswer || [];
                const options = element.options || [];
                const totalOptions = options.length;
                const pointPerOption = (element.score || 1) / totalOptions;

                let tempScore = 0;

                options.forEach(option => {
                    const isCorrect = option.isCorrect;
                    const isSelected = selected.includes(option._id.toString());

                    if ((isCorrect && isSelected) || (!isCorrect && !isSelected)) {
                        tempScore += pointPerOption;
                    }
                });

                questionScore = Math.round(tempScore * 100) / 100;
            } else if (element.type === 'short_answer' || element.type === 'paragraph') {
                questionScore = null;
            }

            totalScore += questionScore;

            const answerObject = {
                formElementId: element._id,
                score: questionScore,
            };

            if (element.type === 'multiple_choice' || element.type === 'checkbox') {
                answerObject.selectedOptionIds = studentAnswer;
            } else if (element.type === 'short_answer' || element.type === 'paragraph') {
                answerObject.answerText = studentAnswer;
            }

            detailedAnswers.push(answerObject);
        });

        const resultData = {
            studentId: studentId,
            testId: testId,
            answers: detailedAnswers,
            totalScore: totalScore,
        };

        try {
            const response = await fetch(`/api/tests/${testId}/Student/${studentId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resultData),
            });

            if (response.ok) {
                message.success('Nộp bài thành công!');
                setIsTestSubmitted(true);
                setTestResult(resultData);
                setShowResultModal(true);
                setIsTakingTest(false);
                // [Đã hoàn nguyên] Loại bỏ việc fetch lại trạng thái lượt làm bài ở đây
                // const attemptsResponse = await fetch(`/api/tests/${testId}/student/${studentId}/attempts`);
                // const attemptsData = await attemptsResponse.json();
                // if (attemptsData.status === "Success") {
                //     setAttemptsInfo(attemptsData.message);
                //     if (attemptsData.message.attemptsRemaining <= 0 && attemptsData.message.maxAttempts > 0) {
                //         setHasAttemptsRemaining(false);
                //     }
                // }
            } else {
                message.error('Lỗi khi nộp bài.');
            }
        } catch (error) {
            console.error('Lỗi nộp bài:', error);
            message.error('Không thể nộp bài.');
        }
    };

    const formatTime = (time) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;

        return [hours, minutes, seconds]
            .map(unit => String(unit).padStart(2, '0'))
            .join(':');
    };

    // [Đã hoàn nguyên] Loại bỏ phần hiển thị loading và thông báo hết lượt ở đây
    // if (isLoading) {
    //     return <div>Đang tải...</div>;
    // }
    // if (!hasAttemptsRemaining && attemptsInfo && attemptsInfo.maxAttempts > 0) {
    //     return (
    //         <div style={{ padding: '20px', textAlign: 'center' }}>
    //             <Card style={{ margin: 'auto', maxWidth: '600px', borderColor: '#ff4d4f', borderStyle: 'dashed', borderWidth: '2px' }}>
    //                 <h2 style={{ color: '#ff4d4f' }}>Bạn đã hết lượt làm bài!</h2>
    //                 <p>Bạn đã hết {attemptsInfo.maxAttempts} lượt làm bài cho bài kiểm tra này.</p>
    //                 <p>Bạn không thể làm hoặc nộp bài kiểm tra này nữa.</p>
    //                 <Button type="primary" onClick={() => history.push(`/class/${classId}`)} style={{ marginTop: '20px' }}>
    //                     Quay lại lớp học
    //                 </Button>
    //             </Card>
    //         </div>
    //     );
    // }
    // Nếu không còn dữ liệu bài kiểm tra (ví dụ: lỗi tải bài kiểm tra)
    if (!testData) {
        return <div>Đang tải bài kiểm tra...</div>; // Vẫn giữ loading nếu testData chưa có
    }


    const navigableQuestions = testData.formElements
        .map((element, index) => {
            if (element.type === 'multiple_choice' || element.type === 'checkbox' || element.type === 'short_answer' || element.type === 'paragraph') {
                return { index, elementId: element._id };
            }
            return null;
        })
        .filter(Boolean)
        .map((item, i) => ({ ...item, label: i + 1 }));

    const handleFlagQuestion = (elementId) => {
        setFlaggedQuestions(prevFlagged => ({
            ...prevFlagged,
            [elementId]: !prevFlagged[elementId],
        }));
    };

    const navigableElements = testData.formElements
        .map((element, index) => {
            if (element.type === 'multiple_choice' || element.type === 'checkbox' || element.type === 'short_answer' || element.type === 'paragraph') {
                return { index, elementId: element._id, label: index + 1 };
            }
            return null;
        })
        .filter(Boolean);


    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                    <div style={{ width: '100%', maxWidth: 600 }}>
                        <h1 style={{ textAlign: 'center' }}>{testData.title}</h1>
                        {/* [Đã hoàn nguyên] Loại bỏ phần hiển thị thông báo đã hết lượt */}
                        {testData.formElements.map((element, index) => {
                            const isFlagged = flaggedQuestions[element._id];
                            const navQuestion = navigableQuestions.find(nav => nav.index === index);
                            const label = navQuestion ? navQuestion.label : null;
                            const navElement = navigableElements.find(nav => nav.index === index);
                            return (
                                <Card key={element._id} style={{ marginBottom: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', borderRadius: '10px', borderLeft: isFlagged ? '5px solid #ff4d4f' : undefined, transition: '0.3s ease-in-out', }} ref={el => (questionRefs.current[index] = el)}>
                                    {element.type === 'multiple_choice' && (
                                        <MultipleChoiceStudent
                                            question={element}
                                            label={label}
                                            onAnswerChange={answer => handleAnswerChange(element._id, answer)}
                                            selectedAnswer={isTestSubmitted ? testResult?.answers.find(ans => ans.formElementId === element._id)?.selectedOptionIds : null}
                                            readOnly={isTestSubmitted}
                                        />
                                    )}
                                    {element.type === 'short_answer' && (
                                        <ShortAnswerStudent
                                            question={element}
                                            label={label}
                                            onAnswerChange={answer => handleAnswerChange(element._id, answer)}
                                            answerText={isTestSubmitted ? testResult?.answers.find(ans => ans.formElementId === element._id)?.answerText : ''}
                                            readOnly={isTestSubmitted}
                                        />
                                    )}
                                    {element.type === 'paragraph' && (
                                        <ParagraphStudent
                                            question={element}
                                            label={label}
                                            onAnswerChange={answer => handleAnswerChange(element._id, answer)}
                                            answerText={isTestSubmitted ? testResult?.answers.find(ans => ans.formElementId === element._id)?.answerText : ''}
                                            readOnly={isTestSubmitted}
                                        />
                                    )}
                                    {element.type === 'checkbox' && (
                                        <CheckboxStudent
                                            question={element}
                                            label={label}
                                            onAnswerChange={answer => handleAnswerChange(element._id, answer)}
                                            selectedAnswers={isTestSubmitted ? testResult?.answers.find(ans => ans.formElementId === element._id)?.selectedOptionIds : []}
                                            readOnly={isTestSubmitted}
                                        />
                                    )}
                                    {element.type === 'section_title' && (
                                        <SectionTitleStudent question={element} />
                                    )}
                                    {element.type === 'description' && (
                                        <DescriptionStudent question={element} />
                                    )}
                                    {navElement && (
                                        <Button
                                            icon={isFlagged ? <FlagFilled style={{ color: '#ff4d4f' }} /> : <FlagOutlined />}
                                            onClick={() => handleFlagQuestion(element._id)}
                                            type="text"
                                            disabled={isTestSubmitted}
                                        >
                                            Đánh dấu
                                        </Button>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
                <div
                    style={{
                        position: 'sticky',
                        top: 80,
                        alignSelf: 'flex-start',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(20px, 1fr))',
                            gridGap: '12px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            maxWidth: '200px'
                        }}>
                            {navigableQuestions.map(({ index, label, elementId }) => {
                                const navElement = navigableElements.find(nav => nav.elementId === elementId);
                                const isFlagged = flaggedQuestions[elementId];
                                const answered = isAnswered(studentAnswers[elementId]);

                                return (
                                    <Button
                                        key={index}
                                        onClick={() =>
                                            questionRefs.current[navElement.index]?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'center',
                                            })
                                        }
                                        style={{
                                            margin: '2px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            fontSize: '13px',
                                            minHeight: '22px',
                                            minWidth: '22px',
                                            borderRadius: '5px',
                                            borderBottom: isFlagged ? '3px solid #ff4d4f' : '',
                                            backgroundColor: answered ? '#b7eb8f' : 'white',
                                            color: answered || isFlagged ? 'black' : 'black',
                                            transition: '0.3s ease-in-out',
                                        }}
                                        disabled={isTestSubmitted}
                                    >
                                        {label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                    {/* [Đã hoàn nguyên] Loại bỏ hiển thị thông tin lượt làm bài */}
                    <p style={{
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                        color: timeLeft <= 55 ? colors[colorIndex] : '#f5585a',
                        backgroundColor: '#eae7d6',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '2px solid black',
                        textAlign: 'center',
                    }}>
                        <ClockCircleOutlined /> {formatTime(timeLeft)}</p>
                    {isTestSubmitted ? (
                        <Button type="primary" onClick={() => history.push(`/class/${classId}`)} style={{ borderRadius: '5px' }}>
                            Thoát
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            onClick={handleSubmitTest}
                            style={{ borderRadius: '5px' }}
                            // [Đã hoàn nguyên] Loại bỏ disabled theo hasAttemptsRemaining
                            // disabled={!hasAttemptsRemaining} 
                        >
                            Nộp bài
                        </Button>
                    )}
                    {isTestSubmitted && (
                        <Button type="default" onClick={() => setShowResultModal(true)} style={{ borderRadius: '5px', marginTop: '10px' }}>
                            Xem điểm
                        </Button>
                    )}
                </div>
            </div>
            <Modal
                title="Kết quả bài kiểm tra"
                visible={showResultModal}
                onCancel={() => setShowResultModal(false)}
                footer={[
                    <Button key="backToClass" type="primary" onClick={() => history.push(`/class/${classId}`)}>
                        Về lớp
                    </Button>,
                ]}
            >
                {testResult && (
                    <div>
                        <p>
                            Tổng điểm: {testResult.totalScore}
                        </p>
                        {testData.formElements.some(element => element.type === 'short_answer' || element.type === 'paragraph') && (
                            <p>Phần tự luận sẽ được giáo viên chấm sau.</p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentTest;