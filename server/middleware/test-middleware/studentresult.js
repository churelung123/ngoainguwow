const Configs = require('./../../configs/Constants');

// Create a new Student result
async function createNewResult(req, res) {
    try {
        const { testId, studentId, answers, totalScore } = req.body;

        // Validation - ensure required fields are present
        if (!testId || !studentId || !answers || !totalScore) {
            return res.status(400).json(Configs.RES_FORM("Error", "Missing required fields"));
        }

        const newResult = new global.DBConnection.StudentResult({
            testId: testId,
            studentId: studentId,
            answers: answers,
            totalScore: totalScore,
        });

        const savedResult = await newResult.save();
        res.status(201).json(Configs.RES_FORM("Success", savedResult));

    } catch (error) {
        console.error("Error creating Student result:", error);
        res.status(500).json(Configs.RES_FORM("Error", "Could not create Student result: " + error.message));
    }
}

// Get a single Student's result for a test
async function getResult(req, res) {
    try {
        const { testId, studentId } = req.params; // Use req.params to get route parameters

        const result = await global.DBConnection.StudentResult.findOne({
            testId: testId,
            studentId: studentId
        })
            .populate('testId') // Populate toàn bộ thông tin của testId để có formElements
            .populate('studentId', 'name vnu_id'); // Populate thông tin học sinh

        if (!result) {
            return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy kết quả bài kiểm tra của học sinh."));
        }

        res.status(200).json(Configs.RES_FORM("Success", result));

    } catch (error) {
        console.error("Error getting single Student result:", error);
        res.status(500).json(Configs.RES_FORM("Error", "Không thể lấy kết quả bài kiểm tra của học sinh: " + error.message));
    }
}

// Delete a Student's result for a test (Potentially for admin use)
async function deleteResult(req, res) {
    try {
        const { testId, studentId } = req.params;

        const deletedResult = await global.DBConnection.StudentResult.findOneAndDelete({
            testId: testId,
            studentId: studentId
        });

        if (!deletedResult) {
            return res.status(404).json(Configs.RES_FORM("Error", "Result not found, cannot delete"));
        }

        res.status(200).json(Configs.RES_FORM("Success", "Result deleted successfully"));

    } catch (error) {
        console.error("Error deleting result:", error);
        res.status(500).json(Configs.RES_FORM("Error", "Could not delete result: " + error.message));
    }
}

async function getStudentResultsInClass(req, res) {
    try {
        const { classId, studentId } = req.params;

        // 1. Tìm lớp học để lấy danh sách các testId thuộc lớp này
        const classDetails = await global.DBConnection.Class.findOne({ _id: classId }).select('tests').lean(); //
        if (!classDetails) {
            return res.status(404).json({ status: "Error", message: "Class not found." });
        }

        const classTestIds = classDetails.tests.map(test => test.toString());

        // 2. Tìm tất cả kết quả của học sinh đó
        const studentResults = await global.DBConnection.StudentResult.find({ studentId: studentId }) //
            .populate({
                path: 'testId', //
                select: 'title type duration testDate' // Chọn các trường bạn muốn hiển thị từ TestLessonSchema
            })
            .lean();

        // 3. Lọc kết quả để chỉ lấy những kết quả thuộc về các bài kiểm tra của lớp này
        const filteredResults = studentResults.filter(result =>
            result.testId && classTestIds.includes(result.testId._id.toString())
        );

        return res.status(200).json({ status: "Success", message: filteredResults });

    } catch (error) {
        console.error("Error fetching Student results in class:", error);
        return res.status(500).json({ status: "Error", message: "Internal server error." });
    }
};

async function getAllResults(req, res) {
    try {
        const { testId } = req.params; // Lấy testId từ params

        const results = await global.DBConnection.StudentResult.find({
            testId: testId
        }).populate('studentId', 'name vnu_id').populate('testId', 'title');
        res.status(200).json(Configs.RES_FORM("Success", results));


    } catch (error) {
        console.error("Error getting all results:", error);
        res.status(500).json(Configs.RES_FORM("Error", "Could not get all results: " + error.message));
    }
};

async function updateShortAnswerScore(req, res) {
    try {
        const { studentResultId, formElementId } = req.params;
        const { score } = req.body;

        if (score === undefined || score < 0) {
            return res.status(400).json(Configs.RES_FORM("Error", "Điểm không hợp lệ. Điểm phải là một số không âm."));
        }

        const studentResult = await global.DBConnection.StudentResult.findById(studentResultId);

        if (!studentResult) {
            return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy kết quả bài làm của học sinh."));
        }

        // Tìm câu trả lời tương ứng trong mảng answers
        const answerIndex = studentResult.answers.findIndex(
            (answer) => answer.formElementId.toString() === formElementId
        );

        if (answerIndex === -1) {
            return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy câu trả lời cho câu hỏi này trong bài làm."));
        }

        // Lấy điểm hiện tại của câu hỏi tự luận từ testDetail (TestLessonSchema)
        const testDetail = await global.DBConnection.TestLesson.findById(studentResult.testId);
        if (!testDetail) {
            return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy chi tiết bài kiểm tra."));
        }

        const question = testDetail.formElements.find(
            (element) => element._id.toString() === formElementId
        );

        if (!question || (question.type !== 'short_answer' && question.type !== 'paragraph')) {
            return res.status(400).json(Configs.RES_FORM("Error", "Câu hỏi này không phải là câu hỏi tự luận hoặc không tồn tại."));
        }

        // Đảm bảo điểm nhập vào không vượt quá điểm tối đa của câu hỏi
        if (score > question.score) {
            return res.status(400).json(Configs.RES_FORM("Error", `Điểm nhập vào (${score}) vượt quá điểm tối đa cho phép của câu hỏi (${question.score}).`));
        }

        // Cập nhật điểm cho câu trả lời tự luận
        studentResult.answers[answerIndex].score = score;
        studentResult.answers[answerIndex].isCorrect = score === question.score; // Đặt isCorrect dựa trên điểm tuyệt đối

        // Cập nhật tổng điểm (totalScore)
        // Tính lại totalScore từ đầu để đảm bảo chính xác
        let newTotalScore = 0;
        for (const answer of studentResult.answers) {
            newTotalScore += answer.score || 0; // Cộng điểm của từng câu trả lời (nếu có, nếu không thì là 0)
        }
        studentResult.totalScore = newTotalScore;

        await studentResult.save();

        res.status(200).json(Configs.RES_FORM("Success", {
            message: "Cập nhật điểm tự luận thành công.",
            updatedResult: studentResult
        }));

    } catch (error) {
        console.error("Error updating short answer score:", error);
        res.status(500).json(Configs.RES_FORM("Error", "Không thể cập nhật điểm tự luận: " + error.message));
    }
}

module.exports = {
    createNewResult,
    getResult,
    getAllResults,
    deleteResult,
    getStudentResultsInClass,
    updateShortAnswerScore,
};