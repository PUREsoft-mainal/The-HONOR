const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: { type: String, required: true },
    likes: [{ type: String }], // مصفوفة لتخزين الـ emp_id لمنع تكرار الإعجاب
    comments: [{
        emp_username: String,
        content: String,
        created_at: { type: Date, default: Date.now }
    }],
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
