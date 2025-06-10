// IndividualResultModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Spin, Typography, Space, Tag, Alert, InputNumber, Button, message, Card } from 'antd'; // Thêm InputNumber, Button, message
import moment from 'moment';
import DOMPurify from 'dompurify';

const { Title, Text, Paragraph } = Typography;

function IndividualResultModal({ visible, onClose, testId, studentId, fetchWrapper, studentName }) {
    const [resultDetail, setResultDetail] = useState(null);
    const [testDetail, setTestDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scores, setScores] = useState({}); // State để lưu điểm tạm thời của các câu tự luận
    const [isSaving, setIsSaving] = useState(false); // State để kiểm soát trạng thái lưu

    // ... (useEffect hiện có để fetchIndividualResult và testDetail)

    useEffect(() => {
        const fetchIndividualResult = async () => {
            setLoading(true);
            setError(null);
            if (!testId._id || !studentId) {
                setError("Thiếu ID bài kiểm tra hoặc ID học sinh.");
                setLoading(false);
                return;
            }
            try {
                const studentResultResponse = await fetchWrapper.get(`/api/tests/${testId._id}/student/${studentId}/result`);
                const studentResultData = await studentResultResponse.json();

                if (studentResultData.status === "Success" && studentResultData.message) {
                    setResultDetail(studentResultData.message);
                    // Khởi tạo state scores với điểm hiện có
                    const initialScores = {};
                    studentResultData.message.answers.forEach(answer => {
                        // Chỉ lấy điểm của câu hỏi tự luận
                        const question = testDetail?.formElements.find(el => el._id === answer.formElementId);
                        if (question && (question.type === 'short_answer' || question.type === 'paragraph')) {
                            initialScores[answer.formElementId] = answer.score !== undefined ? answer.score : 0;
                        }
                    });
                    setScores(initialScores);

                } else {
                    setError(studentResultData.message || "Không thể tải chi tiết bài làm.");
                }

                // Fetch test details (cần testDetail để biết loại câu hỏi và điểm tối đa)
                const testDetailResponse = await fetchWrapper.get(`/api/tests/${testId._id}/form-elements`);
                const testDetailData = await testDetailResponse.json();

                if (testDetailData.status === "Success" && testDetailData.message) {
                    setTestDetail(testDetailData.message);
                } else {
                    setError(prev => prev ? prev + " " + testDetailData.message : testDetailData.message || "Không thể tải chi tiết bài kiểm tra.");
                }

            } catch (err) {
                console.error("Lỗi khi tải chi tiết bài làm hoặc bài kiểm tra:", err);
                setError("Có lỗi xảy ra khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };

        if (visible && testId && studentId) {
            fetchIndividualResult();
        } else if (!visible) {
            // Reset state khi modal đóng
            setResultDetail(null);
            setTestDetail(null);
            setScores({});
            setError(null);
        }
    }, [visible, testId, studentId, fetchWrapper]); // Thêm testDetail vào dependency array nếu cần

    // Hàm xử lý thay đổi điểm
    const handleScoreChange = (formElementId, value) => {
        setScores(prevScores => ({
            ...prevScores,
            [formElementId]: value,
        }));
    };

    // Hàm lưu điểm
    const handleSaveScore = async (formElementId) => {
        setIsSaving(true);
        try {
            const scoreToSave = scores[formElementId];
            if (scoreToSave === undefined || scoreToSave < 0) {
                message.error("Điểm không hợp lệ. Điểm phải là một số không âm.");
                setIsSaving(false);
                return;
            }

            // Lấy điểm tối đa của câu hỏi
            const question = testDetail?.formElements.find(el => el._id === formElementId);
            if (!question) {
                message.error("Không tìm thấy thông tin câu hỏi.");
                setIsSaving(false);
                return;
            }
            if (scoreToSave > question.score) {
                message.error(`Điểm nhập vào (${scoreToSave}) vượt quá điểm tối đa cho phép của câu hỏi (${question.score}).`);
                setIsSaving(false);
                return;
            }

            const studentResultId = resultDetail._id;
            const response = await fetchWrapper.put(
                `/api/studentresults/${studentResultId}/answers/${formElementId}/score`,
                'application/json',
                { score: scoreToSave }
            );
            const data = await response.json();

            if (data.status === "Success") {
                message.success("Cập nhật điểm thành công!");
                // Cập nhật lại totalScore trong resultDetail sau khi lưu thành công
                // Cách 1: Fetch lại toàn bộ kết quả (đảm bảo tính nhất quán)
                // fetchIndividualResult();
                // Cách 2: Cập nhật state resultDetail cục bộ (nhanh hơn nhưng cần cẩn thận)
                setResultDetail(prev => ({
                    ...prev,
                    totalScore: data.message.updatedResult.totalScore, // Cập nhật tổng điểm từ phản hồi API
                    answers: prev.answers.map(ans =>
                        ans.formElementId.toString() === formElementId
                            ? { ...ans, score: scoreToSave, isCorrect: scoreToSave === question.score }
                            : ans
                    )
                }));

            } else {
                message.error(data.message || "Lỗi khi cập nhật điểm.");
            }
        } catch (err) {
            console.error("Lỗi khi gửi yêu cầu cập nhật điểm:", err);
            message.error("Có lỗi xảy ra khi cập nhật điểm.");
        } finally {
            setIsSaving(false);
        }
    };


    const renderSafeHTML = (htmlString) => {
        if (!htmlString) return null;
        const cleanHtml = DOMPurify.sanitize(htmlString, { USE_PROFILES: { html: true } });
        return <span dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
    };

    // Tính số thứ tự hiển thị câu hỏi (loại bỏ section_title, description)
    const numberedQuestions = testDetail?.formElements
        .filter(el => el.type !== 'section_title' && el.type !== 'description')
        .sort((a, b) => a.order - b.order)
        .map((el, index) => ({
            ...el,
            displayOrder: index + 1
        }));

    const getQuestionDisplayOrder = (elementId) => {
        const item = numberedQuestions?.find(q => q._id === elementId);
        return item ? item.displayOrder : null;
    };

    const renderFormElement = (element, studentAnswers) => {
        const studentAnswer = studentAnswers?.find(ans => ans.formElementId === element._id);
        const isCorrect = studentAnswer?.isCorrect;
        const score = studentAnswer?.score;
        const currentScore = scores[element._id] !== undefined ? scores[element._id] : (studentAnswer?.score || 0);
        const questionDisplayOrder = getQuestionDisplayOrder(element._id);

        switch (element.type) {
            case 'section_title':
                return (
                    <Title key={element._id} level={4} style={{ marginTop: '20px' }}>
                        {renderSafeHTML(element.title)}
                    </Title>
                );
            case 'description':
                return (
                    <Paragraph key={element._id}>
                        {renderSafeHTML(element.description)}
                    </Paragraph>
                );
            case 'multiple_choice':
            case 'checkbox':
                return (
                    <div key={element._id} style={{ marginBottom: '15px', border: '1px solid #f0f0f0', padding: '10px', borderRadius: '5px' }}>
                        <Paragraph>
                            {questionDisplayOrder && <Text strong>Câu {questionDisplayOrder}:</Text>}
                            {element.score !== undefined && <Text strong style={{ marginLeft: '10px' }}> ({element.score} điểm)</Text>}
                            {' '}
                            {renderSafeHTML(element.questionText)}
                        </Paragraph>
                        {element.options.map(option => {
                            const isSelected = studentAnswer?.selectedOptionIds?.includes(option._id);
                            const isOptionCorrect = option.isCorrect;
                            let tagColor = 'default';
                            let tagText = '';

                            if (isSelected) {
                                tagColor = isOptionCorrect ? 'green' : 'red';
                                tagText = isOptionCorrect ? ' (Đã chọn & Đúng)' : ' (Đã chọn & Sai)';
                            } else if (isOptionCorrect) {
                                tagColor = 'blue';
                                tagText = ' (Đáp án đúng)';
                            }

                            return (
                                <Paragraph key={option._id} style={{ marginLeft: '20px' }}>
                                    <Text delete={!isSelected && !isOptionCorrect}>
                                        {renderSafeHTML(option.text)}
                                    </Text>
                                    {tagText && <Tag color={tagColor} style={{ marginLeft: '8px' }}>{tagText}</Tag>}
                                </Paragraph>
                            );
                        })}
                        <Paragraph style={{ marginTop: '5px' }}>
                            <Text strong>Điểm đạt được:</Text> {score}
                        </Paragraph>
                    </div>
                );

            case 'short_answer':
            case 'paragraph':
                return (
                    <div key={element._id} style={{ marginBottom: '15px', border: '1px solid #f0f0f0', padding: '10px', borderRadius: '5px' }}>
                        <Paragraph>
                            {questionDisplayOrder && <Text strong>Câu {questionDisplayOrder}:</Text>}
                            {element.score !== undefined && <Text strong style={{ marginLeft: '10px' }}> ({element.score} điểm)</Text>}
                            {' '}
                            {renderSafeHTML(element.questionText)}
                        </Paragraph>

                        <Paragraph style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                            <Text strong>Câu trả lời của học sinh:</Text><br />
                            {studentAnswer?.answerText
                                ? <div style={{ marginTop: '5px' }}>{renderSafeHTML(studentAnswer.answerText)}</div>
                                : <i>Không có câu trả lời.</i>}
                        </Paragraph>

                        <Space style={{ marginTop: 8 }}>
                            <Text strong>Điểm chấm:</Text>
                            <InputNumber
                                min={0}
                                max={element.score}
                                value={currentScore}
                                onChange={(value) => handleScoreChange(element._id, value)}
                                style={{ width: 100 }}
                            />
                            <Button
                                type="primary"
                                onClick={() => handleSaveScore(element._id)}
                                loading={isSaving}
                            >
                                Lưu điểm
                            </Button>
                        </Space>

                        <Paragraph style={{ marginTop: '8px' }}>
                            <Text strong>Điểm đã chấm:</Text> {score !== undefined ? score : 'Chưa chấm'}
                        </Paragraph>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Modal visible={visible} footer={null} width={800}>
                <Spin size="large" style={{ display: 'block', margin: '50px auto' }}>Đang tải chi tiết bài làm...</Spin>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal visible={visible} onCancel={onClose} footer={null} width={800}>
                <Alert message="Lỗi" description={error} type="error" showIcon />
            </Modal>
        );
    }

    return (
        <Modal
            title={`Chi tiết bài làm của ${studentName} - ${testDetail?.title}`}
            visible={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            bodyStyle={{ maxHeight: '75vh', overflowY: 'auto' }}
        >
            {testDetail && resultDetail ? (
                <div>
                    <Paragraph>
                        <Text strong>Tổng điểm đạt được:</Text> {resultDetail.totalScore}
                    </Paragraph>
                    <Paragraph>
                        <Text strong>Ngày nộp bài:</Text> {moment(resultDetail.submittedAt).format('HH:mm DD-MM-YYYY')}
                    </Paragraph>
                    <hr style={{ margin: '20px 0' }} />
                    <Title level={5}>Chi tiết các câu hỏi:</Title>
                    {testDetail.formElements
                        .sort((a, b) => a.order - b.order)
                        .map(element => renderFormElement(element, resultDetail.answers))}
                </div>
            ) : (
                <Paragraph>Không có dữ liệu chi tiết bài làm.</Paragraph>
            )}
        </Modal>
    );
}

export default IndividualResultModal;