const Configs = require('./../../configs/Constants');

// Tạo bài kiểm tra mới
async function createTest(req, res) {
    try {
        const {
            classId,
            title,
            description,
            type,
            testDate,
            duration,
            formElements,
            isPublish,
            maxAttempts,
        } = req.body;


        // Xác thực dữ liệu đầu vào
        if (
            !classId ||
            !title ||
            !type ||
            !testDate ||
            !duration
        ) {
            return res
                .status(400)
                .json(Configs.RES_FORM("Error", "Dữ liệu đầu vào không hợp lệ."));
        }

        // Xác thực chi tiết của từng formElement
        for (const element of formElements) {
            if (!element.type || !element.order) {
                return res
                    .status(400)
                    .json(Configs.RES_FORM("Error", "Dữ liệu formElement không hợp lệ."));
            }
            if (
                element.type === "multiple_choice" ||
                element.type === "checkbox"
            ) {
                if (!element.questionText || !element.options) {
                    return res
                        .status(400)
                        .json(
                            Configs.RES_FORM(
                                "Error",
                                "Dữ liệu câu hỏi trắc nghiệm/checkbox không hợp lệ."
                            )
                        );
                }
            }
            // Thêm xác thực cho các loại formElement khác nếu cần
        }

        const createdBy = req.senderInstance._id;

        const testLesson = new global.DBConnection.TestLesson({
            title,
            description,
            type,
            testDate,
            duration,
            createdBy,
            formElements,
            isPublish,
            maxAttempts,
        });

        const savedTestLesson = await testLesson.save();

        // Cập nhật ClassSchema
        await global.DBConnection.Class.findByIdAndUpdate(
            classId,
            { $push: { tests: savedTestLesson._id } },
            { new: true }
        );


        res.status(201).json(Configs.RES_FORM("Success", savedTestLesson));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(Configs.RES_FORM("Error", "Lỗi khi tạo bài kiểm tra: " + error.message));
    }
}


// Lấy thông tin chi tiết của một bài kiểm tra
async function getTestDetail(req, res) {
    try {
        const testLesson = await global.DBConnection.TestLesson.findById(req.params.testId)
            .populate("createdBy", "_id");
        if (!testLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }


        // Nếu cần populate testLessons trong Class
        // await testLesson.populate('classId.testLessons');


        res.status(200).json(Configs.RES_FORM("Success", testLesson));
    } catch (error) {
        console.error("Lỗi khi lấy thông tin bài kiểm tra:", error);
        res
            .status(500)
            .json(
                Configs.RES_FORM(
                    "Error",
                    "Lỗi khi lấy thông tin bài kiểm tra: " + error.message
                )
            );
    }
}


// Cập nhật thông tin của một bài kiểm tra
async function updateTest(req, res) {
    console.log("Thông tin: ",req.body);
    try {
        const {
            title,
            description,
            type,
            testDate,
            duration,
            formElements,
            isPublish,
            maxAttempts,
        } = req.body;


        // Xác thực dữ liệu đầu vào
        if (
            !title ||
            !type ||
            !testDate ||
            !duration
        ) {
            return res
                .status(400)
                .json(Configs.RES_FORM("Error", "Dữ liệu đầu vào không hợp lệ."));
        }

        const updatedTestLesson = await global.DBConnection.TestLesson.findByIdAndUpdate(
            req.params.testId,
            { title, description, type, testDate, duration, formElements, isPublish, maxAttempts }, // Cập nhật formElements
            { new: true, runValidators: true }
        );


        if (!updatedTestLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }
        res.status(200).json(Configs.RES_FORM("Success", updatedTestLesson));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(Configs.RES_FORM("Error", "Lỗi khi cập nhật bài kiểm tra: " + error.message));
    }
}


async function updateFormElement(req, res) {
    try {
        const {
            formElements,
        } = req.body;

        // Xác thực chi tiết của từng formElement khi cập nhật
        for (const element of formElements) {
            if (!element.type || !element.order) {
                return res
                    .status(400)
                    .json(Configs.RES_FORM("Error", "Dữ liệu formElement không hợp lệ."));
            }
        }


        const updatedTestLesson = await global.DBConnection.TestLesson.findByIdAndUpdate(
            req.params.testId,
            { formElements }, // Cập nhật formElements
            { new: true, runValidators: true }
        );


        if (!updatedTestLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }
        res.status(200).json(Configs.RES_FORM("Success", updatedTestLesson));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(Configs.RES_FORM("Error", "Lỗi khi cập nhật bài kiểm tra: " + error.message));
    }
}


// Xóa một bài kiểm tra
async function deleteTest(req, res) {
    classId = req.params.classId;
    try {
        const testLesson = await global.DBConnection.TestLesson.findById(
            req.params.testId
        );
        if (!testLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }

        const deletedTestLesson =
            await global.DBConnection.TestLesson.findByIdAndDelete(
                req.params.testId
            );
        if (!deletedTestLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }


        // Cập nhật ClassSchema
        await global.DBConnection.Class.findByIdAndUpdate(
            classId,
            { $pull: { tests: req.params.testId } },
            { new: true }
        );


        // Xóa các dữ liệu liên quan (nếu cần)
        await global.DBConnection.StudentResult.deleteMany({
            testId: req.params.testId,
        });

        res.status(200).json(Configs.RES_FORM("Success", "Bài kiểm tra đã được xóa"));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(Configs.RES_FORM("Error", "Lỗi khi xóa bài kiểm tra: " + error.message));
    }
}


// Lấy danh sách các bài kiểm tra của một lớp học
async function getAllClassTests(req, res) {
    try {
        const testIds = await global.DBConnection.Class.findOne({ _id: req.params.classId }, { tests: 1 });
        const tests = await global.DBConnection.TestLesson.find({ _id: { $in: testIds.tests } }, { formElements: 0 });
        
        res.status(200).json(Configs.RES_FORM("Success", tests));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(
                Configs.RES_FORM(
                    "Error",
                    "Lỗi khi lấy danh sách bài kiểm tra: " + error.message
                )
            );
    }
}


// Công khai hoặc ẩn bài kiểm tra
async function publishTest(req, res) {
    try {
        const updatedTestLesson =
            await global.DBConnection.TestLesson.findByIdAndUpdate(
                req.params.testId,
                { isPublished: req.body.isPublished },
                { new: true }
            );
        if (!updatedTestLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }
        res.status(200).json(Configs.RES_FORM("Success", updatedTestLesson));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(
                Configs.RES_FORM(
                    "Error",
                    "Lỗi khi công khai/ẩn bài kiểm tra: " + error.message
                )
            );
    }
}


// Các middleware quản lý câu hỏi đã được tích hợp vào các middleware trên
// và không còn cần thiết nữa


// Làm bài kiểm tra (Student)


// Lấy thông tin bài kiểm tra (đã công khai) cho học sinh
async function getTestForStudent(req, res) {
    try {
        const testLesson = await global.DBConnection.TestLesson.findById(req.params.testId)

        if (!testLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }

        if (!testLesson.isPublish) {
            return res
                .status(403)
                .json(Configs.RES_FORM("Error", "Bài kiểm tra chưa được công khai"));
        }

        res.status(200).json(Configs.RES_FORM("Success", testLesson));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(
                Configs.RES_FORM(
                    "Error",
                    "Lỗi khi lấy thông tin bài kiểm tra cho học sinh: " +
                    error.message
                )
            );
    }
}


// Nộp bài kiểm tra
async function submitTest(req, res) {
    try {
        // Kiểm tra xem bài kiểm tra có tồn tại không
        const testLesson = await global.DBConnection.TestLesson.findById(
            req.params.testId
        );
        if (!testLesson) {
            return res
                .status(404)
                .json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra"));
        }

        const { answers } = req.body;

        // Xác thực dữ liệu đầu vào (câu trả lời)
        if (!answers || typeof answers !== "object" || Object.keys(answers).length === 0) {
            return res
                .status(400)
                .json(Configs.RES_FORM("Error", "Câu trả lời không hợp lệ."));
        }


        // Xử lý và đánh giá câu trả lời

        const studentTestResult = new global.DBConnection.StudentResult({
            testId: req.params.testId,
            studentId: req.params.studentId,
            answers: answers,
            totalScore: req.body.totalScore,
        });


        await studentTestResult.save();


        res.status(201).json(Configs.RES_FORM("Success", studentTestResult));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(Configs.RES_FORM("Error", "Lỗi khi nộp bài kiểm tra: " + error.message));
    }
}
// Lấy kết quả (Teacher/Student)


// Lấy kết quả bài kiểm tra của tất cả học sinh
async function getAllTestResults(req, res) {
    try {
        const results = await global.DBConnection.StudentResult.find({
            testId: req.params.testId,
        }).populate('studentId', 'name vnu_id').populate('testId', 'title');
        res.status(200).json(Configs.RES_FORM("Success", results));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(
                Configs.RES_FORM(
                    "Error",
                    "Lỗi khi lấy kết quả bài kiểm tra của tất cả học sinh: " +
                    error.message
                )
            );
    }
}


// Lấy kết quả bài kiểm tra của một học sinh
async function getStudentTestResult(req, res) {
    console.log("thông tin cần biết: ",req.params);
    try {
        const studentTestResult = await global.DBConnection.StudentResult.findOne({
            testId: req.params.testId,
            studentId: req.params.studentId,
        }).populate("studentId", "name");
        if (!studentTestResult) {
            return res
                .status(404)
                .json(
                    Configs.RES_FORM(
                        "Error",
                        "Không tìm thấy kết quả bài kiểm tra của học sinh"
                    )
                );
        }
        res.status(200).json(Configs.RES_FORM("Success", studentTestResult));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(
                Configs.RES_FORM(
                    "Error",
                    "Lỗi khi lấy kết quả bài kiểm tra của học sinh: " +
                    error.message
                )
            );
    }
}

async function getAttempt (req, res) {
    try {
        const { testId, studentId } = req.params;

        // Tìm thông tin bài kiểm tra để lấy maxAttempts
        const test = await global.DBConnection.TestLesson.findById(testId); // Sử dụng global.DBConnection
        if (!test) {
            return res.status(404).json(Configs.RES_FORM("Error", "Không tìm thấy bài kiểm tra.")); // Sử dụng RES_FORM
        }

        // Đếm số lần học sinh đã nộp bài này
        const submittedAttempts = await global.DBConnection.StudentResult.countDocuments({ // Sử dụng global.DBConnection
            testId: testId,
            studentId: studentId
        });

        const maxAttempts = test.maxAttempts;
        const attemptsRemaining = maxAttempts - submittedAttempts;

        res.status(200).json(Configs.RES_FORM("Success", { attemptsRemaining, maxAttempts, submittedAttempts })); // Sử dụng RES_FORM và trả về object
    } catch (error) {
        console.error('Lỗi khi kiểm tra số lần làm bài:', error);
        res.status(500).json(Configs.RES_FORM("Error", "Lỗi server khi kiểm tra số lần làm bài: " + error.message)); // Sử dụng RES_FORM
    }
};


module.exports = {
    createTest,
    getTestDetail,
    updateTest,
    deleteTest,
    getAllClassTests,
    publishTest,
    getTestForStudent,
    submitTest,
    getAllTestResults,
    getStudentTestResult,
    updateFormElement,
    getAttempt,
};