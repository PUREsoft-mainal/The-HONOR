const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    emp_id: { type: String, unique: true }, // الـ ID الفريد لمنع تشابه الأسماء
    username: { type: String, unique: true, required: true }, // اسم المستخدم للدخول
    password: { type: String, required: true }, // كلمة المرور المشفرة
    role: { type: String, default: 'employee' } // الصلاحية
});

// دالة توليد ID فريد وحصري للشركة تبدأ بـ HONOR-
employeeSchema.statics.generateEmployeeID = function() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HONOR-${rand}`;
};

// دالة توليد كلمة مرور عشوائية مؤلفة من 8 خانات للموظف الجديد
employeeSchema.statics.generateRandomPassword = function() {
    return Math.random().toString(36).slice(-8);
};

module.exports = mongoose.model('Employee', employeeSchema);
