const db = require('../config/database');

class Comment {
    static add(postId, username, content, callback) {
        db.run(`INSERT INTO comments (post_id, emp_username, content) VALUES (?, ?, ?)`, 
        [postId, username, content], callback);
    }

    static getByPost(postId, callback) {
        db.all(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC`, [postId], callback);
    }
}

module.exports = Comment;

