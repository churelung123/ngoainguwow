const mongoose = require('mongoose');
// Import hàm khởi tạo từ DBConnection
const initializeDBConnection = require('./module/DBModule/DBConnection'); 

async function migrateUsersToStudents() {
  // Gọi hàm initializeDBConnection để lấy các model đã khởi tạo
  const DBConnection = await initializeDBConnection(); 

  // Bây giờ DBConnection chứa tất cả các model đã định nghĩa
  const users = await DBConnection.User.find({
    role: 'Student',
    __t: { $exists: false }
  });

  for (const user of users) {
    const raw = user.toObject();
    delete raw._id;
    delete raw.__v;

    const Student = new DBConnection.Student({ // Đảm bảo DBConnection.Student cũng được truy cập đúng
      ...raw,
      _id: user._id,
      paymentStatus: raw.paymentStatus || []
    });

    // Cần đảm bảo rằng Student.toObject() là một đối tượng hợp lệ để thay thế
    await DBConnection.User.replaceOne({ _id: user._id }, Student.toObject());
    console.log(`✅ Migrated user ${user._id} (${user.name})`);
  }

  console.log('🎉 Tất cả học sinh đã được migrate!');
  // Đảm bảo đóng kết nối Mongoose một cách rõ ràng sau khi hoàn thành
  await mongoose.disconnect(); 
  process.exit(0); // Thoát với mã 0 báo hiệu thành công
}

migrateUsersToStudents().catch(async err => { // Thêm async ở đây để await mongoose.disconnect()
  console.error('❌ Lỗi khi migrate:', err);
  // Đảm bảo đóng kết nối ngay cả khi có lỗi
  await mongoose.disconnect(); 
  process.exit(1);
});