const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const employeeSchema = new mongoose.Schema({
    emp_id: { type: String, unique: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'employee' }
});

// دالة توليد ID فريد
employeeSchema.statics.generateEmployeeID = function() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HONOR-${rand}`;
};

// دالة توليد كلمة مرور
employeeSchema.statics.generateRandomPassword = function() {
    return Math.random().toString(36).slice(-8);
};
class Employee {
    // توليد معرف فريد للموظف HONOR-XXXX
    static generateEmployeeID() {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `HONOR-${rand}`;
    }

    // توليد كلمة مرور عشوائية مؤلفة من 8 خانات
    static generateRandomPassword() {
        return Math.random().toString(36).slice(-8);
    }

    // إضافة موظف جديد
    static create(username, callback) {
        const empId = this.generateEmployeeID();
        const rawPassword = this.generateRandomPassword();
        const hashedPassword = bcrypt.hashSync(rawPassword, 10);

        const sql = `INSERT INTO employees (emp_id, username, password, role) VALUES (?, ?, ?, 'employee')`;
        db.run(sql, [empId, username, hashedPassword], function(err) {
            if (err) return callback(err, null);
            callback(null, { empId, username, rawPassword });
        });
    }

    // التحقق من تسجيل الدخول
    static login(username, password, callback) {
        const sql = `SELECT * FROM employees WHERE username = ?`;
        db.get(sql, [username], (err, user) => {
            if (err) return callback(err, null);
            if (!user) return callback(null, false);
            
            const isValid = bcrypt.compareSync(password, user.password);
            if (isValid) callback(null, user);
            else callback(null, false);
        });
    }
}

module.exports = mongoose.model('Employee', employeeSchema);

