const { RES_FORM } = require("../../configs/Constants");
const path = require('path')
const { v4: uuidv4 } = require('uuid');
const csv=require('csvtojson/v2')
const {register} = require('../auth-middleware/register');
const { fCreateCourse } = require("../course-middleware/course");
const { fCreateClass } = require("../class-middleware/class");
/** Must call  handleUploadFile before*/
function fHandleUploadFile (req, res) {
    res.status(200);
    res.json(RES_FORM("Success", {link: "/public/data/" + req.fileName}));
}
/** Support upload file to public/data */
function handleUploadFile(req, res, next) {
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);
    let sampleFile;
    let uploadPath;
    var fileName;
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.file;
    fileName = sampleFile.name.split(".");
    var ext = "."
    if (fileName.length > 0) {
        console.log(fileName);
        ext += fileName[fileName.length - 1];
        fileName = uuidv4() + ext;
    }
    else fileName = uuidv4();
    
    uploadPath = path.resolve(__dirname, "..", "..", "public", "data"); 
    console.log(uploadPath)
    uploadPath = uploadPath + "/" + fileName;
    console.log(uploadPath);
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function(err) {
        if (err)
            return res.status(500).send(err);
        req.fileUploadPath = uploadPath;
        req.fileName = fileName;
        next();
    });
}

async function fHandleUploadClass(req, res) {
    let success = [];
    let fail = [];
    const jsonArray = await csv().fromFile(req.fileUploadPath);

    for (const classData of jsonArray) {
        // Tạo một request giả (fakeReq) để truyền dữ liệu từ CSV vào fCreateClass
        class fakeReq {
            constructor(body) {
                this.body = body;
                this.senderInstance = { role: 'admin' }; // Giả định người tải lên là admin
            }
        }
        const fakeReqInstance = new fakeReq(classData);

        // Tạo một response giả (fakeRes) để nhận kết quả từ fCreateClass
        class fakeRes {
            constructor() {
                this.statusCode = null;
                this.responseJson = null;
            }
            status(code) {
                this.statusCode = code;
                return this;
            }
            json(data) {
                this.responseJson = data;
            }
        }
        const fakeResInstance = new fakeRes();

        await fCreateClass(fakeReqInstance, fakeResInstance);

        if (fakeResInstance.statusCode === 201) {
            success.push(fakeResInstance.responseJson.message.data);
        } else {
            fail.push({ className: classData.className, error: fakeResInstance.responseJson?.message || 'Lỗi không xác định' });
        }
    }

    res.status(200).json(RES_FORM("Success", { registered: success, failed: fail }));
}

async function fHandleUploadCourse(req, res) {
    let success = [];
    let fail = [];
    const jsonArray = await csv().fromFile(req.fileUploadPath);
        // let res = await global.DBConnection.Test.insertMany(jsonArray, { ordered: false })
    class fakeRes {
        statusCode = null;
        responseJson = null;
        json = (obj) => {
            this.responseJson = obj;
        };
        status = (status) => {
            this.statusCode = status;
        }
    }
    class fakeReq {
        body = null
        constructor(body) {
            this.body = body;
        }
    }
    
    for (var i of jsonArray) {
        var fakeReqInstance = new fakeReq(i);
        var fakeResInstance = new fakeRes();
        await fCreateCourse(fakeReqInstance, fakeResInstance);
        if (fakeResInstance.statusCode != 200) {
            if (fakeResInstance.responseJson && fakeResInstance.responseJson.message)
                i.error = fakeResInstance.responseJson.message;
            fail.push(i);
        }
        else success.push(i);
    }
    res.status(200);
    res.json(RES_FORM("Success", {registered : success, failed : fail}));
};

/** Must call  handleUploadFile before*/
async function fHandleUploadDSCV(req, res) {
    let success = [];
    let fail = [];
    const jsonArray = await csv().fromFile(req.fileUploadPath);
        // let res = await global.DBConnection.Test.insertMany(jsonArray, { ordered: false })
    class fakeRes {
        statusCode = null;
        responseJson = null;
        json = (obj) => {
            this.responseJson = obj;
        };
        status = (status) => {
            this.statusCode = status;
        }
    }
    class fakeReq {
        body = null
        constructor(body) {
            this.body = body;
        }
    }
    
    for (var i of jsonArray) {
        // i.role = "teacher";
        var fakeReqInstance = new fakeReq(i);
        var fakeResInstance = new fakeRes();
        await register(fakeReqInstance, fakeResInstance);
        if (fakeResInstance.statusCode != 200) {
            if (fakeResInstance.responseJson && fakeResInstance.responseJson.message)
                i.error = fakeResInstance.responseJson.message;
            fail.push(i);
        }
        else success.push(i);
    }
    res.status(200);
    res.json(RES_FORM("Success", {registered : success, failed: fail}));
};

/** Must call  handleUploadFile before*/
async function fHandleUploadDSSV(req, res) {
    let success = [];
    let fail = [];
    const jsonArray = await csv().fromFile(req.fileUploadPath);
        // let res = await global.DBConnection.Test.insertMany(jsonArray, { ordered: false })
    class fakeRes {
        statusCode = null;
        responseJson = null;
        json = (obj) => {
            this.responseJson = obj;
        };
        status = (status) => {
            this.statusCode = status;
        }
    }
    class fakeReq {
        body = null
        constructor(body) {
            this.body = body;
        }
    }
    
    for (var i of jsonArray) {
        // i.role = "Student";
        var fakeReqInstance = new fakeReq(i);
        var fakeResInstance = new fakeRes();
        await register(fakeReqInstance, fakeResInstance);
        if (fakeResInstance.statusCode != 200) {
            if (fakeResInstance.responseJson && fakeResInstance.responseJson.message)
                i.error = fakeResInstance.responseJson.message;
            fail.push(i);
        }
        else success.push(i);
    }
    res.status(200);
    res.json(RES_FORM("Success", {registered : success, failed: fail}));
};

module.exports = {fHandleUploadFile, fHandleUploadDSCV, fHandleUploadDSSV, handleUploadFile, fHandleUploadCourse, fHandleUploadClass}