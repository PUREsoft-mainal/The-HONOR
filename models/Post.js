const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: { type: String, required: true },
    likes: [{ type: String }], // مصفوفة تحتوي على الـ emp_id للموظفين الذين ضغطوا إعجاب
    comments: [{
        emp_username: String,
        content: String,
        created_at: { type: Date, default: Date.now }
    }],
    created_at: { type: Date, default: Date.now }
});

    static getAll(empId, callback) {
        // جلب المنشورات مع حساب عدد الإعجابات ومعرفة هل المستخدم الحالي ضغط إعجاب أم لا
        const sql = `
            SELECT p.*, 
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND emp_id = ?) as user_liked
            FROM posts p ORDER BY p.created_at DESC`;
        db.all(sql, [empId], (err, rows) => {
            callback(err, rows);
        });
    }

    static update(id, content, callback) {
        db.run(`UPDATE posts SET content = ? WHERE id = ?`, [content, id], callback);
    }

    static delete(id, callback) {
        db.run(`DELETE FROM posts WHERE id = ?`, [id], (err) => {
            if (err) return callback(err);
            db.run(`DELETE FROM likes WHERE post_id = ?`, [id], (err2) => {
                db.run(`DELETE FROM comments WHERE post_id = ?`, [id], callback);
            });
        });
    }

    static toggleLike(postId, empId, callback) {
        db.get(`SELECT id FROM likes WHERE post_id = ? AND emp_id = ?`, [postId, empId], (err, row) => {
            if (row) {
                db.run(`DELETE FROM likes WHERE post_id = ? AND emp_id = ?`, [postId, empId], callback);
            } else {
                db.run(`INSERT INTO likes (post_id, emp_id) VALUES (?, ?)`, [postId, empId], callback);
            }
        });
    }
}

module.exports = mongoose.model('Post', postSchema);

