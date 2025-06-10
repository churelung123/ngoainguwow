import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Form, Input, Button, Radio, Checkbox, message } from 'antd';
import { useFetchWrapper } from '_helpers';

const { TextArea } = Input;

export function TakeTest() {
    const { testId, studentId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const history = useHistory();
    const fetchWrapper = useFetchWrapper();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetchWrapper.get(`/api/tests/${testId}/Student/${studentId}`);
            const data = await response.json();
            setQuestions(data.message); // Giả sử server trả về { questions: [...] }
            setLoading(false);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu bài kiểm tra:', error);
            message.error('Có lỗi xảy ra khi lấy dữ liệu bài kiểm tra.');
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers({ ...answers, [questionId]: value });
    };

    const handleSubmit = async () => {
        try {
            await fetchWrapper.post(
                `/api/tests/${testId}/Student/${studentId}/submit`,
                'application/json',
                { answers }
            );
            message.success('Nộp bài thành công.');
            history.push(`/Student/test-result/<span class="math-inline">\{testId\}/</span>{studentId}`); // Chuyển đến trang kết quả
        } catch (error) {
            console.error('Lỗi khi nộp bài:', error);
            message.error('Có lỗi xảy ra khi nộp bài.');
        }
    };

    if (loading) {
        return <div>Đang tải bài kiểm tra...</div>;
    }

    return (
        <div>
            <h1>Làm Bài Kiểm Tra</h1>
            <Form onFinish={handleSubmit}>
                {questions.map((question) => (
                    <div key={question._id} style={{ marginBottom: 24 }}>
                        <h2>{question.content}</h2>
                        {question.type === 'Trắc nghiệm' && (
                            <Form.Item>
                                <Radio.Group onChange={(e) => handleAnswerChange(question._id, e.target.value)}>
                                    {question.options.map((option, index) => (
                                        <Radio key={index} value={option}>
                                            {option}
                                        </Radio>
                                    ))}
                                </Radio.Group>
                            </Form.Item>
                        )}
                        {question.type === 'Tự luận' && (
                            <Form.Item>
                                <TextArea rows={4} onChange={(e) => handleAnswerChange(question._id, e.target.value)} />
                            </Form.Item>
                        )}
                        {/* Thêm các loại câu hỏi khác */}
                    </div>
                ))}
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Nộp bài
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default TakeTest;