const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // سيتم جلب الرابط السحابي من إعدادات Vercel Environment Variables
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/honor_db');
        console.log(`تم الاتصال بنجاح بقاعدة بيانات MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error(`خطأ في الاتصال بـ MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// إنشاء الجداول الأساسية
db.serialize(() => {
    // جدول الموظفين
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emp_id TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'employee'
    )`);

    // جدول المنشورات
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // جدول الإعجابات
    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        emp_id TEXT,
        UNIQUE(post_id, emp_id)
    )`);

    // جدول التعليقات
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        emp_username TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = connectDB;

