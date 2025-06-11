var express = require('express');
var app = express();
var cookieParser = require('cookie-parser')
var router = express.Router();
var fileUpload = require('express-fileupload')
var cors = require('cors');
var tempFileDir = "/public/data";
var json2xls = require('json2xls');
if (process.platform == "darwin") {
  tempFileDir = "." + tempFileDir
}

const allowedOrigins = [
    'http://localhost:3000', // Cho phát triển cục bộ (React Dev Server)
    'http://localhost:8081',
    'http://localhost:8081/',
    'http://localhost:5000',
    process.env.CLIENT_URL, // Khi chạy local, giá trị này có thể không liên quan
    'https://ngoainguwow-1mc31dcrz-huynh-thanh-nguyens-projects.vercel.app'
];
console.log('Backend allowedOrigins (at startup):', allowedOrigins);
console.log('Value of process.env.CLIENT_URL (at startup):', process.env.CLIENT_URL);

app.use(cors({
    origin: function (origin, callback) {
      console.log('Incoming request origin:', origin); 
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : tempFileDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  createParentPath: true,
  debug: true
}));
app.use(json2xls.middleware)
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(cookieParser());
const authRouter = require('./routers/auth');
const userRouter = require('./routers/user');
const registerRouter = require('./routers/register');
const classRouter = require('./routers/class');
const uploadRouter = require('./routers/upload');
const publicRoute = require('./routers/public')
const DBConnection = require('./module/DBModule/DBConnection');
const IOConnection = require('./module/IOModule/IOConnection');
const adminRouter = require('./routers/admin');
const courseRoutes = require('./routers/course');
const testRouter = require('./routers/test');
const notificationRoutes = require('./routers/notification');
const questionRoute = require('./routers/question');
const studentResultRouter = require('./routers/studentresult');
const postRouter = require('./routers/post');
const attendanceRouter = require('./routers/attendance');
var serverWS = require('http').createServer(app);

app.use((req, res, next) => {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log(`New request \n\tTYPE: ${req.method} \n\t URL: ${fullUrl} \n\tParam: ${JSON.stringify(req.params)} \n\tBody: ${JSON.stringify(req.body)} \n\tCookies: ${JSON.stringify(req.cookies)}`)
  next();
})
app.use(userRouter);
app.use(authRouter);
app.use(registerRouter);
app.use(classRouter);
app.use(uploadRouter);
app.use(publicRoute);
app.use(adminRouter);
app.use(courseRoutes);
app.use(testRouter);
app.use(notificationRoutes);
app.use(questionRoute);
app.use(studentResultRouter);
app.use(postRouter);
app.use(attendanceRouter);
(async () => {
  await DBConnection.Init();

  const PORT = process.env.PORT || 8081; // Sử dụng biến môi trường PORT, hoặc 8081 nếu chạy local

  var server = app.listen(PORT, function () { // Lắng nghe trên PORT
    var host = server.address().address
    var port = server.address().port
    console.log("Ung dung Node.js dang lang nghe tai dia chi: http://%s:%s", host, port)
  });

  var chatConnection = new IOConnection(server); // Đảm bảo IOConnection nhận server chính
})()