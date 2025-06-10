const Configs = require('../../configs/Constants');


const getQuestionsByTestId = async (req, res) => {
    try {
        const testId = req.params.testId;
        const questions = await global.DBConnection.Question.find({ testId });

        res.status(200).json(Configs.RES_FORM("Success", questions));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách câu hỏi' });
    }
};

const createQuestion = async (req, res) => {
    try {
        const {
            section,
            type,
            content,
            image,
            audio,
            video,
            options,
            correctAnswer,
            correctOrder,
            matrix,
            partialScores,
            negativeMarking,
            maxScore,
            group,
        } = req.body;

        const newQuestion = new global.DBConnection.Question({
            section,
            type,
            content,
            image,
            audio,
            video,
            options: options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                image: opt.image,
            })),
            correctAnswer,
            correctOrder,
            matrix,
            partialScores,
            negativeMarking,
            maxScore,
            group,
        });

        const savedQuestion = await newQuestion.save();
        res.status(201).json({ success: true, data: savedQuestion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo câu hỏi' });
    }
};

const getQuestionById = async (req, res) => {
    try {
        const questionId = req.params.questionId;
        const question = await global.DBConnection.Question.findById(questionId);

        if (!question) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }

        res.json({ success: true, data: question });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin câu hỏi' });
    }
};

const updateQuestion = async (req, res) => {
    try {
        const {
            testId,
            section,
            type,
            content,
            image,
            audio,
            video,
            options,
            correctAnswer,
            correctOrder,
            matrix,
            partialScores,
            negativeMarking,
            maxScore,
            group,
        } = req.body;
        const questionId = req.params.questionId;

        const updatedQuestion = await global.DBConnection.Question.findByIdAndUpdate(
            questionId,
            {
                testId,
                section,
                type,
                content,
                image,
                audio,
                video,
                options: options.map((opt) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    image: opt.image,
                })),
                correctAnswer,
                correctOrder,
                matrix,
                partialScores,
                negativeMarking,
                maxScore,
                group,
            },
            { new: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }

        res.json({ success: true, data: updatedQuestion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật câu hỏi' });
    }
};

const deleteQuestion = async (req, res) => {
    try {
        const questionId = req.params.questionId;
        const deletedQuestion = await global.DBConnection.Question.findByIdAndDelete(questionId);

        if (!deletedQuestion) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }

        res.json({ success: true, message: 'Xóa câu hỏi thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa câu hỏi' });
    }
};


module.exports = {
    getQuestionsByTestId,
    createQuestion,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
};