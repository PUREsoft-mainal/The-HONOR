const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const connectDB = require('./config/database');

// استدعاء الموديلات المحدثة لـ MongoDB
const Employee = require('./models/Employee');
const Post = require('./models/Post');

const app = express();

// الاتصال المباشر بقاعدة البيانات السحابية (تستقبل الرابط من متغيرات بيئة Vercel)
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'honor_secret_key_98765',
    resave: false,
    saveUninitialized: false
}));

function checkAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

// العرض الرئيسي للمنشورات والتعليقات بالتوافق السحابي
app.get('/', checkAuth, async (req, res) => {
    try {
        const rawPosts = await Post.find().sort({ created_at: -1 });
        const posts = rawPosts.map(post => ({
            id: post._id,
            content: post.content,
            created_at: post.created_at,
            likes_count: post.likes.length,
            user_liked: post.likes.includes(req.session.user.emp_id),
            comments: post.comments
        }));
        res.render('index', { user: req.session.user, posts });
    } catch (err) {
        res.send('خطأ في جلب بيانات شركة The HONOR السحابية.');
    }
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await Employee.findOne({ username });
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.render('login', { error: 'بيانات الدخول غير صحيحة، راجع الإدارة المستخرجة.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// خاصية: إضافة موظف جديد واستخراج ID خاص به تلقائياً (للآدمن فقط)
app.post('/employees/create', checkAuth, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).json({ success: false });
    
    try {
        const { username } = req.body;
        const empId = Employee.generateEmployeeID();
        const rawPassword = Employee.generateRandomPassword();
        const hashedPassword = bcrypt.hashSync(rawPassword, 10);

        const newEmp = new Employee({ emp_id: empId, username, password: hashedPassword });
        await newEmp.save();

        res.json({ success: true, data: { empId, username, rawPassword } });
    } catch (err) {
        res.json({ success: false, message: 'اسم هذا الموظف مسجل بالفعل بالنظام.' });
    }
});

// خاصية: إنشاء منشور جديد للآدمن فقط
app.post('/posts/create', checkAuth, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/');
    await Post.create({ content: req.body.content });
    res.redirect('/');
});

// خاصية: تعديل منشور
app.post('/posts/edit/:id', checkAuth, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.sendStatus(403);
    await Post.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.sendStatus(200);
});

// خاصية: حذف منشور
app.post('/posts/delete/:id', checkAuth, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.redirect('/');
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

// خاصية: إعجاب بالمنشور (تعتمد على معرف الموظف لمنع خلط تشابه الأسماء)
app.post('/posts/like/:id', checkAuth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    const empId = req.session.user.emp_id;
    if (post.likes.includes(empId)) {
        post.likes = post.likes.filter(id => id !== empId);
    } else {
        post.likes.push(empId);
    }
    await post.save();
    res.redirect('/');
});

// خاصية: إضافة تعليق باسم الموظف الحالي
app.post('/posts/comment/:id', checkAuth, async (req, res) => {
    await Post.findByIdAndUpdate(req.params.id, {
        $push: { comments: { emp_username: req.session.user.username, content: req.body.comment_content } }
    });
    res.redirect('/');
});

// إنشاء حساب الآدمن الافتراضي تلقائياً عند أول تشغيل سحابي
(async () => {
    const adminExist = await Employee.findOne({ role: 'admin' });
    if (!adminExist) {
        const hash = bcrypt.hashSync('Honor2026@Admin', 10);
        await Employee.create({ emp_id: 'HONOR-ADMIN', username: 'Admin_Honor', password: hash, role: 'admin' });
        console.log('⚠️ تم تهيئة حساب مدير نظام The HONOR!');
    }
})();

module.exports = app;
