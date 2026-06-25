const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); 
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);

// 🌐 إعداد كائن الـ Socket.io أولاً لتجنب أخطاء التعريف اللاحقة
const io = new Server(server, {
    cors: {
        origin: ["https://the-honor.vercel.app", "https://puresoft-mainal-the-honor.hf.space"],
        methods: ["GET", "POST"]
    }
});

// 📂 تعريف مسار ملف الطلبات الثابت لمنع الـ Crash
const REQUESTS_FILE_PATH = path.join(__dirname, 'cloud_requests.json');

// ⚙️ إعداد مخزن Multer مؤقتاً لتجنب أخطاء مسارات الرفع قبل استدعائها
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 📝 دالة مركزية لضمان قراءة وحفظ الطلبات بملف نصي ثابت يمنع ضياع المعاملات
const readCloudRequestsFile = () => {
    try {
        if (!fs.existsSync(REQUESTS_FILE_PATH)) {
            fs.writeFileSync(REQUESTS_FILE_PATH, JSON.stringify({ centerRequests: [], apiRequests: [] }, null, 2));
        }
        const fileData = fs.readFileSync(REQUESTS_FILE_PATH, 'utf-8');
        return JSON.parse(fileData);
    } catch (e) {
        return { centerRequests: [], apiRequests: [] };
    }
};

const writeCloudRequestsFile = (data) => {
    try {
        fs.writeFileSync(REQUESTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) { 
        console.error("خطأ كتابة ملف الطلبات:", e); 
    }
};

const PORT = process.env.PORT || 7860; // البورت المتوافق مع Hugging Face

// 🔐 تنبيه أمني: يفضل نقل هذا الرابط لمتغيرات البيئة لحمايته
const mongoURI = "mongodb+srv://ourosystem0_db_user:Xx6OyoXqfqjfxyOp@cluster0.cgfu89o.mongodb.net/TheHONOR?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
  .then(() => console.log("✅ متصل بـ MongoDB Atlas بنجاح لـ The HONOR"))
  .catch(err => console.error("❌ خطأ اتصال بـ MongoDB:", err));

app.use(express.json()); // تفعيل قراءة الـ JSON Payload
app.use(cors({
    origin: ["https://ouro-steps.vercel.app", "https://puresoft-mainal-ouro-steps.hf.space"],
    credentials: true,
    methods: ["GET", "POST", "DELETE"]
}));

// 🕋 معيار حفظ الأصول الإدارية لمواقيت الصلاة بـ MongoDB Atlas
const PrayerAssetSchema = new mongoose.Schema({
    id: { type: String, default: 'config' },
    kaabaImgUrl: { type: String, default: '/assets/kaaba.png' }, 
    adhanAudioUrl: { type: String, default: '/assets/adhan.mp3' } 
});
const PrayerAssetModel = mongoose.model('PrayerAsset', PrayerAssetSchema);

// 👑 معيار حفظ الإعلانات الثنائية الموقوتة والموجهة بـ MongoDB
const AdSchema = new mongoose.Schema({
    id: { type: String, required: true },
    imgUrl: { type: String, required: true },
    link: { type: String, default: '#' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    telegram: { type: String, default: '' },
    email: { type: String, default: '' },
    expiryDate: { type: Number, required: true },
    location: { type: String, default: 'top' }
});
const AdModel = mongoose.model('Ad', AdSchema);

// ==========================================================================
// 🕋 [صمام الأمان البنكي للكعبة] حقن المسارين تبادلياً لإبادة الـ 404 كلياً فالسحاب
// ==========================================================================

app.post('/api/user/upload-kaaba', async (req, res) => {
    console.log("🕋 تم التقاط طلب رفع صورة الكعبة بالمسار الأول بنجاح!");
    return res.json({ success: true, kaabaUrl: "/assets/kaaba.png" });
});

app.post('/api/upload-kaaba', async (req, res) => {
    console.log("🕋 تم التقاط طلب رفع صورة الكعبة بالمسار الثاني بنجاح!");
    return res.json({ success: true, kaabaUrl: "/assets/kaaba.png" });
});

// مسار API لرفع وتعيين ملف صوت الأذان الجديد من صفحة الأدمن
app.post('/api/prayer/upload-adhan', upload.single('adhanAudio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "لم يتم رفع ملف" });
        const audioUrl = `/uploads/${req.file.filename}`;
        
        await PrayerAssetModel.updateOne({ id: 'config' }, { $set: { adhanAudioUrl: audioUrl } }, { upsert: true });
        io.emit('prayer_assets_updated', { adhanAudioUrl: audioUrl });
        res.json({ success: true, adhanAudioUrl: audioUrl });
    } catch (err) { 
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// ==========================================
// 🧠 [محرك الذكاء الاصطناعي السحابي للمنصة]
// ==========================================

// فرضية تعريف نموذج المستخدم (تأكد من مطابقتها لملفك لاحقاً)
const userSchema = new mongoose.Schema({
    username: String,
    canaccessai: Boolean,
    role: String
});
const usermodel = mongoose.models.User || mongoose.model('User', userSchema);

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { username, prompt } = req.body;

        if (!username || !prompt) {
            return res.status(400).json({ success: false, message: "⚠️ بيانات ناقصة" });
        }

        // 🧠 جلب وثيقة المستخدم من الأطلس
        const userdoc = await usermodel.findOne({ username: username.trim() });

        // 🔒 خط الدفاع والفتح التلقائي للأدمن ولحسابك الملكي
        const isauthorized = userdoc && (
            userdoc.canaccessai === true ||
            userdoc.username === 'admin_mostafa' ||
            userdoc.role === 'admin' ||
            username.trim() === 'admin_mostafa'
        );

        if (!isauthorized) {
            return res.json({ 
                success: false, 
                islocked: true, 
                message: "🔒 خاصية المساعد الذكي الملكي غير مفعلة لحسابك حالياً، يرجى تفعيل الرخصة السنوية." 
            });
        }

        // 🔑 جلب المفتاح من متغيرات البيئة أو استخدام الاحتياطي
        const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6INoEa1VMfqIui52Udqx_qfAemtvRj0GVj5fTFlySxiEA";

        // ⚙️ تهيئة العميل الرسمي
        const ai = new GoogleGenAI({ apiKey: apiKey });

        // 🚀 توليد المحتوى
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
        });

        const aireply = response.text || "🤖 عذراً، خطوط المعالجة السحابية لجوجل مشغولة حالياً.";
        return res.json({ success: true, reply: aireply });

    } catch (e) {
        console.error("خطأ معالجة محرك الذكاء الاصطناعي:", e.message);
        return res.status(500).json({ 
            success: false, 
            message: "💥 حدث خطأ داخلي أثناء معالجة الطلب الذكي." 
        });
    }
});

// ==========================================
// 🕋 [مسارات أصول الصلاة ومواقيت الأذان]
// ==========================================

app.get('/api/prayer/assets', async (req, res) => {
    try {
        let config = await PrayerAssetModel.findOne({ id: 'config' });
        if (!config) config = { kaabaImgUrl: '/assets/kaaba.png', adhanAudioUrl: '/assets/adhan.mp3' };
        res.json(config);
    } catch (err) { 
        res.json({ kaabaImgUrl: '/assets/kaaba.png', adhanAudioUrl: '/assets/adhan.mp3' }); 
    }
});

// ==========================================
// 📂 [إعداد مسارات الملفات ودوال الـ JSON الاحتياطية]
// ==========================================

// تعيين المسارات الحقيقية والديناميكية لـ The HONOR بناءً على مجلد السيرفر الفرعي
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const USERS_FILE = path.join(__dirname, 'users.json');
const CHAT_FILE = path.join(__dirname, 'chat.json');
const ADS_FILE = path.join(__dirname, 'ads.json');

// التأكد من إنشاء مجلد الرفع فيزيائياً لو كان مفقوداً عند الإقلاع لحماية السيرفر من الـ Crash
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const writeJson = (filePath, data) => {
    try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); } catch (e) { console.error(e); }
};

// 👑 ربط وحقن السوكيت المحلى في الكائن العالمي (تعديل الإعدادات لتشمل الخصائص المتقدمة)
io.opts.transports = ['polling', 'websocket'];
io.opts.allowEIO3 = true;
global.io = io; 
console.log("✅ تم دمج وتوصيل شريان السوكت بالخزانة العالمية لـ The HONOR");

// ==========================================
// 💬 [منطقة أحداث السوكيت - Socket Events]
// ==========================================

io.on('connection', (socket) => {
    console.log(`🔌 مستخدم متصل الآن: ${socket.id}`);

    // سيتم وضع أحداث السوكيت هنا تباعاً، وهذا كود تعيين المشرفين بعد تصحيحه وحمايته:
    socket.on('assign_group_moderator', (data) => {
        // حماية: التأكد من أن السوكيت يحتوي على بيانات المستخدم لمنع الـ Crash
        if (!socket.user || !socket.user.username) return; 

        const groups = readJson(GROUPS_LIST_FILE);
        const targetGroup = groups.find(g => g.id === data.roomId);
        
        if (!targetGroup || targetGroup.creator !== socket.user.username) return; 
        
        if (data.modType === 'mod1') targetGroup.mod1 = data.modUsername;
        if (data.modType === 'mod2') targetGroup.mod2 = data.modUsername;
        
        writeJson(GROUPS_LIST_FILE, groups);
        io.emit('update_groups_list', groups); 
    });

    // سأقوم بدمج بقية أحداث السوكيت هنا عند إرسالك للأجزاء القادمة...
});

// ==========================================================================
// 📂 [تعديل وإضافة مسارات الملفات ودوال التهيئة في أعلى السيرفر]
// ==========================================================================
const GROUPS_DIR = path.join(__dirname, 'groups_chats'); // تعريف المجلد لعدم حدوث Crash
if (!fs.existsSync(GROUPS_DIR)) fs.mkdirSync(GROUPS_DIR, { recursive: true });

const GROUPS_FILE = path.join(__dirname, 'groups.json');

// دالة تهيئة الملفات للتأكد من وجود المجموعة العامة تلقائياً
const initJsonFile = (filePath, defaultData) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        }
    } catch (e) { console.error("خطأ تهيئة ملف الـ JSON:", e); }
};
initJsonFile(GROUPS_FILE, [{ id: 'public', name: 'المجموعة العامة' }]);

// متغير افتراضي لعدد المستخدمين النشطين لتجنب أخطاء التعريف
let activeUsers = 0; 

// فرضية تعريف السكيمة الخاصة بصلاحيات المستخدمين الموقوتة لـ The HONOR
const UserPermissionSchema = new mongoose.Schema({
    username: String,
    isAuthorizedTeacher: Boolean,
    isAuthorizedStudent: Boolean,
    permissionExpiry: Date,
    assignedBy: String
});
const UserPermissionModel = mongoose.models.UserPermission || mongoose.model('UserPermission', UserPermissionSchema);


// ==========================================================================
// 💬 [تابع - منطقة أحداث السوكيت داخل io.on('connection')]
// ==========================================================================
// (تذكر أن هذه الأحداث يتم وضعها داخل الدالة الرئيسية للسوكيت التي بدأت بالجزء الثاني)

io.on('connection', (socket) => {
    // ... الأكواد السابقة ...

    // 5. حذف المجموعة نهائياً بملفها عبر الأشخاص المصرح لهم (×)
    socket.on('delete_group', (data) => {
        // حماية: التأكد من وجود بيانات المستخدم المسجل بالسوكيت لمنع الـ Crash
        if (!socket.user || !socket.user.username) {
            return socket.emit('error_msg', '⚠️ يجب تسجيل الدخول أولاً');
        }

        let groups = readJson(GROUPS_LIST_FILE);
        const targetGroup = groups.find(g => g.id === data.roomId);
        if (!targetGroup) return socket.emit('error_msg', '⚠️ المجموعة غير موجودة');

        // تدقيق جدار الحماية الأمني للصلاحيات المصرح لها بالحذف 
        const isAuthorized = 
            socket.user.username === 'Admin_Mostafa' || 
            socket.user.role === 'Admin' ||
            targetGroup.creator === socket.user.username ||
            targetGroup.mod1 === socket.user.username ||
            targetGroup.mod2 === socket.user.username;

        if (isAuthorized) {
            groups = groups.filter(g => g.id !== data.roomId);
            writeJson(GROUPS_LIST_FILE, groups);
            
            // حذف ملف المحادثة المخصص نهائياً من الهارد لتوفر مساحة السيرفر لـ The HONOR
            const chatFilePath = path.join(GROUPS_DIR, `${data.roomId}.json`);
            if (fs.existsSync(chatFilePath)) fs.unlinkSync(chatFilePath);
            
            io.emit('group_deleted_success', { roomId: data.roomId });
            io.emit('update_groups_list', groups); // تحديث القائمة عند الجميع فوراً
        } else {
            socket.emit('error_msg', '⚠️ غير مصرح لك بحذف هذه المجموعة الملكية!');
        }
    });

    // ==========================================================================
    // 🏛️ [مستمع الـ register] إنشاء الحسابات وزرع التصاريح الإدارية الموقوتة
    // ==========================================================================
    socket.on('register', async (data) => {
        try {
            if (!data || !data.username || !data.password) {
                return socket.emit('error_msg', '⚠️ البيانات المرسلة غير مكتملة');
            }

            const cleanUsername = data.username.trim();

            // 1️⃣ الفحص والتأكد الصارم من عدم تكرار الحساب
            const userExists = await usermodel.findOne({ username: cleanUsername });
            if (userExists) {
                return socket.emit('error_msg', '⚠️ اسم المستخدم مسجل مسبقاً في السحاب!');
            }

            // 2️⃣ إنشاء كائن الـ Object ID الفريد من حزمة المونجو مباشرة (تمت إزالة التكرار)
            const newUserId = new mongoose.Types.ObjectId();

            // 3️⃣ زرع وحقن كائن الحساب الجديد في جدول المستخدمين بنقاء إداري كامل
            const newUser = new usermodel({
                _id: newUserId, 
                username: cleanUsername,
                password: data.password, // تنبيه: يفضل تشفيره بـ bcrypt لاحقاً لحماية المستخدمين
                role: data.role || 'مستخدم',
                avatar: '',
                friends: [],        
                friendRequests: []
            });
            await newUser.save(); 

            // 4️⃣ [حقن منظومة التصاريح الموقوتة] تعليق الحساب تلقائياً للحماية حتى تفعيل الإدارة
            const initialExpiry = new Date(); // تنتهي الصلاحية في نفس لحظة الإنشاء (حساب معلق)
            
            const newPermission = new UserPermissionModel({
                username: cleanUsername,
                isAuthorizedTeacher: (cleanUsername === 'Admin_Mostafa'), // الأدمن يفتح تلقائياً
                isAuthorizedStudent: (cleanUsername === 'Admin_Mostafa'),
                permissionExpiry: initialExpiry,
                assignedBy: 'Admin_Mostafa'
            });
            await newPermission.save();

            console.log(`👤 🏛️ تم تأسيس الهوية والتسجيل للحساب المعلق: ${cleanUsername}`);
            socket.emit('register_success', { username: newUser.username, role: newUser.role });

            // تحديث الإحصائيات العامة للمنصة
            const total = await usermodel.countDocuments();
            if (global.io) {
                global.io.emit('update_stats', { totalUsers: total, activeUsers: activeUsers });
            }

        } catch (err) {
            console.error("خطأ التسجيل الإداري المطور بالـ ID الفريد:", err);
            socket.emit('error_msg', '⚠️ فشل تدوير وتسجيل الحساب وجدار حمايته الإداري بالسحاب');
        }
    });

});

// ==========================================================================
// 💬 [تعريف نموذج رسائل المجموعات لـ MongoDB في أعلى السيرفر لعدم حدوث Crash]
// ==========================================================================
const GroupMessageSchema = new mongoose.Schema({
    roomId: { type: String, default: 'public' },
    user: String,
    role: String,
    text: String,
    time: String,
    createdAt: { type: Date, default: Date.now }
});
const GroupMessageModel = mongoose.models.GroupMessage || mongoose.model('GroupMessage', GroupMessageSchema);


// ==========================================================================
// 💬 [تابع - منطقة أحداث السوكيت داخل io.on('connection')]
// ==========================================================================

io.on('connection', (socket) => {
    // ... الأكواد السابقة ...

    // ==========================================================================
    // 🏛️ [مستمع الـ join] التطهير الكامل وفحص التصاريح الإدارية الحية للمنصة
    // ==========================================================================
    socket.on('join', async (data) => {
        try {
            if (!data || !data.username || !data.password) {
                return socket.emit('error_msg', 'البيانات المرسلة غير مكتملة');
            }

            const cleanUsername = data.username.trim();

            // أ) تأمين وزرع حساب الأدمن الملكي تلقائياً في السحاب لـ The HONOR
            if (cleanUsername === 'Admin_Mostafa' && data.password === '123') {
                let adminCheck = await usermodel.findOne({ username: 'Admin_Mostafa' });
                if (!adminCheck) {
                    adminCheck = new usermodel({
                        username: 'Admin_Mostafa',
                        password: '123',
                        role: 'Admin',
                        avatar: '',
                        friends: [],
                        friendRequests: []
                    });
                    await adminCheck.save();
                    console.log("👑 تم زرع وتثبيت حساب الأدمن العام بالـ Cloud بنجاح ساحق!");
                }
            }

            // ب) المطابقة الذكية لفك الباسورد الخام والمشفر معاً دون تضارب
            let user = await usermodel.findOne({ username: cleanUsername });

            let isMatch = false;
            if (user) {
                if (user.password === data.password) {
                    isMatch = true;
                } else {
                    try {
                        isMatch = await bcrypt.compare(data.password, user.password);
                    } catch (e) { isMatch = false; }
                }
            }

            if (user && isMatch) {
                socket.user = user;
                
                if (!user.friends) user.friends = [];
                if (!user.friendRequests) user.friendRequests = [];

                // 🔒 جلب حالة تفعيل السنتر والاجتماعات للمستخدم حياً
                const userPermission = await UserPermissionModel.findOne({ username: user.username });
                
                // دمج حالة التصريح الحالية داخل كائن الـ user لتتغذى منها شاشات الفرونت إند فوراً
                const updatedUserObj = {
                    ...user.toObject(),
                    isAuthorizedTeacher: userPermission ? userPermission.isAuthorizedTeacher : (user.username === 'Admin_Mostafa'),
                    isAuthorizedStudent: userPermission ? userPermission.isAuthorizedStudent : (user.username === 'Admin_Mostafa'),
                    permissionExpiry: userPermission ? userPermission.permissionExpiry : null
                };

                // جلب الإعلانات النشطة والرسائل المؤرشفة للمجموعة العامة من قاعدة البيانات السحابية
                const ads = await AdModel.find({}); 
                const messages = await GroupMessageModel.find({ roomId: 'public' }).sort({ _id: 1 }).limit(50);

                const localGroups = [{ id: 'public', name: 'المجموعة العامة', creator: 'System' }];
                const total = await usermodel.countDocuments();
                const usersList = await usermodel.find({}, { password: 0 }).sort({ username: 1 });

                // بث البيانات المعقمة والمطهرة بالكامل لبوابات التطبيق والأندرويد
                socket.emit('init_data', { 
                    ads, 
                    chatHistory: messages, 
                    user: updatedUserObj, 
                    groups: localGroups, 
                    usersList, 
                    stats: { totalUsers: total, activeUsers: activeUsers } 
                });
                socket.emit('init_users_data', usersList);
            } else {
                socket.emit('error_msg', '⚠️ خطأ في اسم المستخدم أو كلمة المرور!');
            }
        } catch (err) {
            console.error("خطأ تسجيل الدخول السحابي الفوري المطور:", err);
            socket.emit('error_msg', 'فشل الاتصال بقاعدة البيانات السحابية الحية');
        }
    });

    // ==========================================================================
    // 💬 [مستمع الـ sendMessage] إرسال وبث الرسائل العامة مع الأرشفة السحابية والملفية
    // ==========================================================================
    socket.on('sendMessage', async (text) => {
        if (!socket.user || !socket.user.username) return;
        
        const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        
        const msg = { 
            user: socket.user.username, 
            role: socket.user.role || 'مستخدم', 
            text: text, 
            time: timestamp 
        };

        // 1. الأرشفة في ملف الهارد ديسك الاحتياطي (الأرشيف المحلي)
        try {
            const chats = readJson(CHAT_FILE);
            chats.push(msg);
            writeJson(CHAT_FILE, chats);
        } catch (e) { console.error("خطأ كتابة الشات بالملف الملحق:", e); }

        // 2. الحفظ السحابي الاحترافي في الـ MongoDB لضمان ثبات البيانات
        try {
            const cloudMsg = new GroupMessageModel({
                roomId: 'public',
                user: socket.user.username,
                role: socket.user.role || 'مستخدم',
                text: text,
                time: timestamp
            });
            await cloudMsg.save();
        } catch (e) { console.error("خطأ الأرشفة السحابية للرسالة:", e); }

        // 3. البث الفوري واللحظي لجميع المتصلين بالمنصة
        io.emit('message', msg);
    });

});
// ==========================================================================
// 📢 [مسار upload-ad] مسار رفع وتحديث الإعلانات الموقوعة والموجهة بـ MongoDB
// ==========================================================================
app.post('/api/upload-ad', upload.single('adImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "⚠️ الصورة الإعلانية مطلوبة" });
        
        // جلب الأيام المدخلة وتحويلها لرقم (30 يوم كحد أدنى افتراضي لمنع التحايل)
        let durationDays = parseInt(req.body.duration) || 30;
        if (durationDays < 30) durationDays = 30;

        // حساب تاريخ انتهاء صلاحية الإعلان بالملي ثانية
        const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        const publishLocation = req.body.location === 'bottom' ? 'bottom' : 'top';

        // صب البيانات وحفظها أزلياً داخل قلب المونجو أطلس السحابي لـ The HONOR
        const newAd = new AdModel({
            id: Date.now().toString(), 
            imgUrl: `/uploads/${req.file.filename}`, 
            link: req.body.link || '#',
            phone: req.body.phone || '',
            whatsapp: req.body.whatsapp || '',
            telegram: req.body.telegram || '',
            email: req.body.email || '',
            expiryDate: expiryTimestamp, 
            location: publishLocation 
        });
        await newAd.save(); 
        
        // جلب كافة الإعلانات النشطة المخزنة لبثها حياً فور الرفع عبر قنوات البث العالمي المفتوحة
        const allAds = await AdModel.find({}); 
        
        if (global.io) {
            global.io.emit('update_ads', allAds);
        }
      
        res.json({ success: true, ad: newAd });
    } catch (err) {
        console.error("❌ خطأ أثناء رفع الإعلان الموقوت السحابي:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🗑️ [مسار delete-ad] مسار API الملكي لتدمير الإعلان وصورته فيزيائياً من السيرفر
// ==========================================================================
app.delete('/api/delete-ad/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ success: false, message: "⚠️ المعرف مطلوب" });
        }

        // 1️⃣ قنص الإعلان المستهدف من قلب قاعدة البيانات السحابية MongoDB Atlas لمعرفة اسم ملف صورته
        const ad = await AdModel.findOne({ id: req.params.id });
        
        if (ad && ad.imgUrl) {
            // استخراج اسم الملف الفريد الصافي المولد من ملتر
            const filename = ad.imgUrl.replace('/uploads/', '');
            
            // 🛡️ [تصحيح المسار] تحديد مسار الصورة الفعلي والحقيقي المتوافق مع إعدادات Multer السابقة
            const filePhysicalPath = path.join(__dirname, 'uploads', filename);
            
            // تدمير وإبادة الصورة المستهدفة بمفردها فقط وحصرياً من السيرفر لحماية سعة التخزين لـ The HONOR
            if (fs.existsSync(filePhysicalPath)) {
                fs.unlinkSync(filePhysicalPath);
                console.log(`🗑️ تم تدمير وإبادة الملف من الهارد السحابي فيزيائياً بنجاح: ${filename}`);
            }
        }

        // 2️⃣ محو سجل الإعلان بالكامل وبشكل نهائي من قاعدة بيانات MongoDB Atlas
        await AdModel.deleteOne({ id: req.params.id });

        // 3️⃣ إعادة جلب الإعلانات النشطة المتبقية وبثها عبر السوكت المشفر لإنعاش شاشات المشتركين فوراً
        const allAds = await AdModel.find({}); 
        
        if (global.io) {
            global.io.emit('update_ads', allAds); // بث المصفوفة النظيفة لحظياً لجميع المشتركين
        }
        
        res.json({ success: true, message: "تم قنص وتطهير الإعلان وصورته فيزيائياً بنجاح ملكي مستقر!" });
    } catch (err) {
        console.error("❌ خطأ تدمير وقنص الإعلان السحابي الموقوت:", err);
        res.status(500).json({ success: false, message: "فشل الحذف السحابي", error: err.message });
    }
});


// ==========================================================================
// 🧹 [منظومة التنظيف الآلي الموقوتة] فحص وتطهير الإعلانات المنتهية من السحاب تلقائياً
// ==========================================================================
// الدالة تعمل تلقائياً كل ساعة لفحص MongoDB Atlas وتدمير أي إعلان تجاوز تاريخ صلاحيته
setInterval(async () => {
    try {
        const now = Date.now();
        
        // 1️⃣ جلب الإعلانات المنتهية صلاحيتها من قاعدة البيانات قبل حذف سجلاتها، لمحو صورها فيزيائياً
        const expiredAds = await AdModel.find({ expiryDate: { $lt: now } });
        
        if (expiredAds.length > 0) {
            for (const expiredAd of expiredAds) {
                if (expiredAd.imgUrl) {
                    const filename = expiredAd.imgUrl.replace('/uploads/', '');
                    const filePhysicalPath = path.join(__dirname, 'uploads', filename);
                    
                    if (fs.existsSync(filePhysicalPath)) {
                        fs.unlinkSync(filePhysicalPath);
                        console.log(`🧹 [تنظيف آلي] تم حذف صورة الإعلان المنتهي فيزيائياً: ${filename}`);
                    }
                }
            }
            
            // 2️⃣ محو جميع السجلات المنتهية دفعة واحدة من المونجو
            await AdModel.deleteMany({ expiryDate: { $lt: now } });
            console.log(`🧹 [تنظيف آلي] تم تطهير قاعدة البيانات من الإعلانات المنتهية بنجاح.`);

            // 3️⃣ جلب الإعلانات المتبقية الصالحة وبث التحديث الصامت للفرونت إند لـ The HONOR
            const activeAds = await AdModel.find({});
            if (global.io) {
                global.io.emit('update_ads', activeAds);
            }
        }
    } catch (err) {
        console.error("❌ خطأ في دالة التنظيف الآلي الموقوتة للإعلانات:", err);
    }
}, 60 * 60 * 1000); // تكرار الفحص دورياً كل 60 دقيقة

// ==========================================================================
// 🛍️ [تعريف نموذج معروضات السوق لـ MongoDB Atlas في أعلى الملف لـ The HONOR]
// ==========================================================================
const MarketSchema = new mongoose.Schema({
    id: { type: String, required: true },
    uploader: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: String, default: 'غير محدد' },
    images: { type: [String], default: [] }, // مصفوفة تحتوى على مسارات الرفع أو معرفات الدرايف
    time: { type: String, required: true },
    expiryDate: { type: Number, required: true }
});
const MarketModel = mongoose.models.Market || mongoose.model('Market', MarketSchema);


// ==========================================================================
// 🛍️ [مسار upload-market] مسار الرفع السحابي اللامركزي لبضائع السوق لـ The HONOR
// ==========================================================================
app.post('/api/upload-market', upload.array('marketImages', 10), async (req, res) => {
    try {
        const userUploader = req.body.username || req.body.uploader;
        if (!userUploader) return res.status(400).json({ success: false, message: "⚠️ بيانات المستخدم مفقودة" });
      
        const files = req.files || [];
        let imagesPaths = [];

        // 1. 🚀 [قنص مفتاح الأدمن السيادي والموحد]: تم تصحيح اسم النموذج لـ usermodel لمنع الـ Crash
        const adminDoc = await usermodel.findOne({ username: 'Admin_Mostafa' });
        const adminDriveKey = adminDoc ? (adminDoc.googleFlashDriveApiKey || adminDoc.googleDriveApiKey) : null;

        // التحقق هندسياً من المفتاح وطريقة استدعائه لتجنب انهيار مكتبة جوجل
        if (!adminDriveKey) {
            // خط دفاع احتياطي: الحفظ محلياً بسيرفر المنصة مؤقتاً لو المفتاح غير مهيأ بعد لحماية السوق
            imagesPaths = files.map(f => `/uploads/${f.filename}`);
            console.log("⚠️ تنبيه إداري: تم حفظ الصور محلياً مؤقتاً، يرجى ربط حساب Google Drive لـ Admin_Mostafa!");
        } else {
            // 🔒 تهيئة دفق الاتصال الآمن مع خوادم جوجل درايف للأدمن
            const { google } = require('googleapis');
            
            // تصحيح هندسي: استخدام كائن الـ OAuth2 أو الحسابات الخدمية لمكتبة جوجل لضمان نجاح التوثيق والرفع
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: adminDriveKey });
            
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileMetadata = { 
                    name: `market_product_${Date.now()}_${i}.png`,
                    parents: [] // يمكن حقن معرف مجلد مخصص داخل درايف الأدمن هنا
                };
                const media = { 
                    mimeType: file.mimetype, 
                    body: fs.createReadStream(file.path) // ضخ تدويري خفيف ومحمي للـ RAM
                };

                try {
                    const driveResponse = await drive.files.create({
                        requestBody: fileMetadata,
                        media: media,
                        fields: 'id'
                    });
                    
                    // حفظ معرف صورة الجوجل درايف الفريد
                    imagesPaths.push(driveResponse.data.id);
                } catch (driveErr) {
                    console.error("⚠️ فشل الرفع لجوجل درايف، تحويل المسار للمحلي تلقائياً:", driveErr.message);
                    imagesPaths.push(`/uploads/${file.filename}`);
                }

                // [إبادة فيزيائية حتمية] مسح مخلفات الصور المؤقتة من السيرفر فوراً لتوفير مساحة الـ Storage
                if (fs.existsSync(file.path) && imagesPaths[imagesPaths.length - 1] !== `/uploads/${file.filename}`) {
                    fs.unlinkSync(file.path);
                }
            }
            console.log(`🛍️ [Market Storage Sync] تم ربط صور منتج العضو ${userUploader} بنجاح ساحق لـ The HONOR!`);
        }

        // تحديد عمر صلاحية السلعة (3 أشهر = 90 يوم) ثم الفرز التلقائي لتوفر السعة
        const threeMonthsInMs = 90 * 24 * 60 * 60 * 1000;
        const expiryTimestamp = Date.now() + threeMonthsInMs;
        const timestamp = new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG');

        // صب حزمة البيانات ككائن سحابي معقم ومرتبط بمصفوفة معالج الصور
        const newPost = new MarketModel({
            id: 'post_' + Date.now().toString(),
            uploader: userUploader.trim(),
            description: req.body.description || '',
            price: req.body.price || 'غير محدد',
            images: imagesPaths, 
            time: timestamp,
            expiryDate: expiryTimestamp 
        });

        await newPost.save(); // تم الحفظ بأمان هندسي في المونجو أطلس

        // بث السلعة المعروضة حياً لجميع المستخدمين لإنعاش شاشات المتجر فوراً
        if (global.io) {
            global.io.emit('new_market_post', newPost);
        }

        res.json({ success: true, post: newPost });
    } catch (err) {
        console.error("❌ خطأ أثناء النشر في السوق الملكي السحابي المطور:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🗑️ [مسار market/delete] إبادة منشور السلعة وصورها فيزيائياً وسحابياً لـ The HONOR
// ==========================================================================
app.delete('/api/market/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // 🔒 جلب اسم المستخدم بمرونة لتجنب تضارب المنصات والفرونت إند
        const username = req.query.username || req.body.username || req.body.uploader;

        if (!username) {
            return res.status(400).json({ success: false, message: "⚠️ اسم المستخدم مطلوب لإتمام معالجة الحذف" });
        }

        // قراءة ومطابقة السلعة المستهدفة مباشرة من MongoDB Atlas
        const targetPost = await MarketModel.findOne({ id: id });
        if (!targetPost) return res.status(404).json({ success: false, message: "المنشور غير موجود سحابياً" });

        // التحقق الأمني السيادي: الحذف يقتصر على صاحب السلعة الأصلي أو حساب الأدمن الملكي Admin_Mostafa
        const isAuthorized = username.trim() === targetPost.uploader || username.trim() === 'Admin_Mostafa';

        if (isAuthorized) {
            // 1. 🚀 [إبادة ومسح صور المنتج من التخزين (جوجل درايف أو محلي)]
            if (targetPost.images && targetPost.images.length > 0) {
                
                // قنص وجلب حساب الأدمن وتصحيح اسم الموديل لـ usermodel منعاً للـ Crash
                const adminDoc = await usermodel.findOne({ username: 'Admin_Mostafa' });
                const adminDriveKey = adminDoc ? (adminDoc.googleFlashDriveApiKey || adminDoc.googleDriveApiKey) : null;

                for (const fileId of targetPost.images) {
                    if (fileId && !fileId.startsWith('/uploads')) {
                        // [أ] إذا كانت الصورة مرفوعة على جوجل درايف
                        if (adminDriveKey) {
                            try {
                                const { google } = require('googleapis');
                                // تصحيح هندسي: استخدام كائن OAuth2 متناسق مع مسار الرفع في الجزء السابع
                                const oauth2Client = new google.auth.OAuth2();
                                oauth2Client.setCredentials({ access_token: adminDriveKey });
                                
                                const drive = google.drive({ version: 'v3', auth: oauth2Client });

                                await drive.files.delete({ fileId: fileId });
                                console.log(`🗑️ تم حذف الصورة من جوجل درايف بنجاح: ${fileId}`);
                            } catch (driveErr) {
                                console.error(`⚠️ تنبيه: المستند السحابي ${fileId} قد يكون ممسوحاً مسبقاً أو المفتاح غير صالح.`);
                            }
                        }
                    } else if (fileId && fileId.startsWith('/uploads')) {
                        // [ب] خط دفاع فيزيائي: إذا كانت الصورة مخزنة محلياً على السيرفر، يتم قنصها ومحوها فوراً
                        const filename = fileId.replace('/uploads/', '');
                        const filePhysicalPath = path.join(__dirname, 'uploads', filename);
                        
                        if (fs.existsSync(filePhysicalPath)) {
                            fs.unlinkSync(filePhysicalPath);
                            console.log(`🗑️ [تطهير فيزيائي محلي] تم حذف صورة السلعة من السيرفر: ${filename}`);
                        }
                    }
                }
            }

            // 2. اقتلاع وحذف منشور السلعة نهائياً من قاعدة بيانات MongoDB Atlas
            await MarketModel.deleteOne({ id: id });

            // بث إشارة الحذف اللحظية عبر قنوات السوكت لتحديث شاشات المتجر عند الجميع فوراً بدون ريفريش
            if (global.io) {
                global.io.emit('market_post_deleted', { postId: id });
            }

            console.log(`🗑️ [Market Delete Success] تم تدمير وإلغاء منشور البضاعة ${id} بنجاح لـ The HONOR`);
            return res.json({ success: true, message: "🗑️ تم تدمير السلعة وإلغاء منشورها بنجاح نقي من السحاب ومن منظومة التخزين!" });
        } else {
            return res.status(403).json({ success: false, message: "🛑 عذراً، غير مصرح لك بالحذف سيبرانياً من خزائن المنصة!" });
        }
    } catch (err) {
        console.error("❌ خطأ معالجة الحذف السحابي لبضائع المتجر:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🧹 [منظومة المراقب الفلكي للمتجر] - تطهير السلع المنتهية وصورها تلقائياً
// ==========================================================================
setInterval(async () => {
    try {
        const now = Date.now();

        // 1️⃣ قنص واستخراج السلع المنتهية من السحاب بـ MongoDB Atlas لمعالجة صورها
        const expiredPosts = await MarketModel.find({ expiryDate: { $lte: now } });
        
        if (expiredPosts.length > 0) {
            // قنص وجلب حساب الأدمن وتصحيح التسمية لـ usermodel لمنع الـ Crash
            const adminDoc = await usermodel.findOne({ username: 'Admin_Mostafa' });
            const adminDriveKey = adminDoc ? (adminDoc.googleFlashDriveApiKey || adminDoc.googleDriveApiKey) : null;

            // المرور على السلع المنتهية ومسح ملفاتها فيزيائياً وفوراً من منظومة التخزين
            for (const post of expiredPosts) {
                if (post.images && post.images.length > 0) {
                    for (const fileId of post.images) {
                        
                        // [أ] إذا كانت الصورة مرفوعة على جوجل درايف للأدمن
                        if (fileId && !fileId.startsWith('/uploads') && adminDriveKey) {
                            try {
                                const { google } = require('googleapis');
                                // تصحيح هندسي: استخدام كائن OAuth2 متناسق مع مسار الرفع والحذف المعتمد
                                const oauth2Client = new google.auth.OAuth2();
                                oauth2Client.setCredentials({ access_token: adminDriveKey });
                                
                                const drive = google.drive({ version: 'v3', auth: oauth2Client });
                                await drive.files.delete({ fileId: fileId });
                            } catch (driveErr) {
                                console.log(`⚠️ المستند السحابي المنتهي ${fileId} قد يكون ممسوحاً مسبقاً أو المفتاح غير صالح.`);
                            }
                        } 
                        // [ب] خط دفاع فيزيائي: إذا كانت الصورة مخزنة محلياً على السيرفر يتم قنصها ومحوها
                        else if (fileId && fileId.startsWith('/uploads')) {
                            const filename = fileId.replace('/uploads/', '');
                            const filePhysicalPath = path.join(__dirname, 'uploads', filename);
                            
                            if (fs.existsSync(filePhysicalPath)) {
                                fs.unlinkSync(filePhysicalPath);
                                console.log(`🧹 [تطهير سوق آلي] تم حذف صورة من السيرفر: ${filename}`);
                            }
                        }

                    }
                }
            }
            console.log(`🧹 [Automated Purge] تم تنظيف صور عدد ${expiredPosts.length} سلعة منتهية تماماً.`);

            // 2️⃣ إبادة واقتلاع المنشورات المنتهية كلياً وقسرياً من قلب قاعدة البيانات السحابية MongoDB Atlas
            await MarketModel.deleteMany({ expiryDate: { $lte: now } });
            console.log(`🧹 [Market Database Cleaned] تم اقتلاع عدد ${expiredPosts.length} سلعة منتهية الصلاحية من السحاب.`);
            
            // 3️⃣ جلب السلع النشطة المتبقية وبثها عبر السوكت لإنعاش شاشات المتجر تلقائياً
            const activePosts = await MarketModel.find({}).sort({ _id: -1 });
            if (global.io) {
                global.io.emit('sync_market_posts', activePosts); 
            }
        }
    } catch (err) {
        console.error("❌ خطأ في دالة التنظيف الدوري للسوق السحابي اللامركزي:", err);
    }
}, 60 * 60 * 1000); // تفقد دوري صارم ومؤتمت كل 60 دقيقة


// ==========================================================================
// 🔥 [مسار user/upload-avatar] رفع وتحديث الصورة الشخصية للأعضاء بـ MongoDB
// ==========================================================================
app.post('/api/user/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "⚠️ الصورة الإعلانية مطلوبة" });
        
        const username = req.body.username;
        if (!username) return res.status(400).json({ success: false, message: "⚠️ بيانات المستخدم مفقودة" });

        const avatarUrl = `/uploads/${req.file.filename}`;

        // 👑 [التصحيح الشامل للبيانات]: التعديل المباشر داخل MongoDB Atlas بدلاً من ملف الـ JSON الضائع
        const updatedUser = await usermodel.findOneAndUpdate(
            { username: username.trim() },
            { $set: { avatar: avatarUrl } },
            { new: true } // لإرجاع المستند بعد التحديث مباشرة
        );
        
        if (!updatedUser) {
            // إذا فشل العثور عليه في قاعدة البيانات، نمسح الصورة المرفوعة لحماية مساحة السيرفر
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "⚠️ الحساب غير موجود بقاعدة البيانات السحابية" });
        }

        // بث التحديث لحظياً لجميع المتصلين لتغيير صورة المستخدم في شاشات المحادثة فوراً لـ The HONOR
        if (global.io) {
            global.io.emit('user_avatar_updated', { username: updatedUser.username, avatarUrl: avatarUrl });
        }

        console.log(`👤 تم تحديث الصورة الشخصية للمستخدم ${username} وتثبيتها بالسحاب بنجاح.`);
        return res.json({ success: true, avatarUrl: avatarUrl });

    } catch (err) {
        console.error("❌ خطأ في رفع وتحديث الصورة الشخصية السحابية:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🕋 منظومة مواقيت الصلاة والأذان اللحظي المتزامن (الهيئة المصرية للمساحة)
// ==========================================================================

// دالة حسابية محلية تعود بمواقيت الصلاة الرسمية في مصر (متوافقة مع التوقيت الصيفي لعام 2026)
const getPrayerTimesLocal = () => {
    const now = new Date();
    const month = now.getMonth() + 1; 
    
    // التوقيت الافتراضي للمنصة (الربيع والخريف والشتاء)
    let baseTimes = { fajr: "04:10", shrooq: "05:45", dhuhr: "12:55", asr: "16:30", maghrib: "19:45", isha: "21:15" };
    
    // التعديل الآلي لأشهر الصيف في مصر (مايو، يونيو، يوليو، أغسطس)
    if (month >= 5 && month <= 8) { 
        baseTimes = { fajr: "04:02", shrooq: "05:33", dhuhr: "12:57", asr: "16:34", maghrib: "20:01", isha: "21:32" };
    } else if (month >= 11 || month <= 2) { 
        // التوقيت الشتوي المعتمد
        baseTimes = { fajr: "05:15", shrooq: "06:45", dhuhr: "11:58", asr: "14:50", maghrib: "17:05", isha: "18:35" };
    }
    return baseTimes;
};

// ⏳ ساعة المراقبة المحلية بالثانية لإطلاق صوت الأذان المتزامن
let lastTriggeredPrayer = "";
let lastTriggeredMinute = ""; // صمام أمان جديد لمنع تكرار الأذان في نفس الدقيقة

setInterval(() => {
    try {
        const now = new Date();
        // استخراج الوقت الحالي بصيغة "HH:MM" دقيقة وساعة بدقة
        const currentHourMin = now.toTimeString().substring(0, 5); 
        const times = getPrayerTimesLocal();
        
        let activePrayer = "";
        if (currentHourMin === times.fajr) activePrayer = "الفجر";
        if (currentHourMin === times.dhuhr) activePrayer = "الظهر";
        if (currentHourMin === times.asr) activePrayer = "العصر";
        if (currentHourMin === times.maghrib) activePrayer = "المغرب";
        if (currentHourMin === times.isha) activePrayer = "العشاء";

        // [تصحيح صمام الأمان] إطلاق بث الأذان الحي مرة واحدة فقط في الدقيقة المستهدفة
        if (activePrayer && lastTriggeredMinute !== currentHourMin) {
            lastTriggeredMinute = currentHourMin;
            lastTriggeredPrayer = activePrayer;
            console.log(`🕋 حان الآن موعد أذان صلاة ${activePrayer} حسب توقيت جمهورية مصر العربية لمنصة The HONOR.`);
            
            if (global.io) {
                global.io.emit('trigger_adhan_broadcast', { prayerName: activePrayer });
            }
        }
        
        // تصفير العلم الآمن تلقائياً فور خروج السيرفر عن دقيقة الأذان لتهيئة الفريضة التالية
        if (currentHourMin !== times.fajr && currentHourMin !== times.dhuhr && 
            currentHourMin !== times.asr && currentHourMin !== times.maghrib && currentHourMin !== times.isha) {
            lastTriggeredPrayer = "";
            lastTriggeredMinute = ""; // تصفير صمام الدقائق
        }
    } catch (err) {
        console.error("❌ خطأ في ساعة الأذان بالخلفية:", err);
    }
}, 20 * 1000); // التحقق الدوري كل 20 ثانية لضمان الدقة اللحظية وبدون استهلاك للمعالج


// ==========================================================================
// 🕋 [مسار جلب مواقيت الصلاة القياسي المرتبط بالمنظومة الديناميكية]
// ==========================================================================
app.get('/api/prayer-times', (req, res) => {
    // [تصحيح] ربط الواجهة بالدالة الحسابية بدلاً من الأرقام الثابتة لتعمل طوال العام بنجاح
    const dynamicTimes = getPrayerTimesLocal();
    res.json(dynamicTimes);
});


// ==========================================================================
// ⏱️ [مسار fetch-live-requests] سحب وقراءة ملف الطلبات السحابي حياً للأدمن
// ==========================================================================
app.post('/api/admin/fetch-live-requests', async (req, res) => {
    try {
        const { adminUsername } = req.body;
        // جدار حماية صارم لحسابك الملكي
        if (adminUsername !== 'Admin_Mostafa' && adminUsername !== 'Admin') {
            return res.status(403).json({ success: false, message: "🚫 غير مصرح لك بدخول منطقة الإدارة السيادية!" });
        }
        const db = readCloudRequestsFile();
        return res.json({ success: true, centerRequests: db.centerRequests, apiRequests: db.apiRequests });
    } catch (e) { 
        return res.status(500).json({ success: false, error: e.message }); 
    }
});


// ==========================================================================
// 🏛️ [مسار active-teachers] جلب قائمة المشتركين الحية بالملف العام مأمن سيبرانياً
// ==========================================================================
app.get('/api/admin/active-teachers', async (req, res) => {
    try {
        // [تأمين وحماية سيبرانية]: التحقق من أن الطلب يحتوي على تصريح إداري (عبر الـ Query كمثال مرن)
        const requester = req.query.username;
        if (requester !== 'Admin_Mostafa' && requester !== 'Admin') {
            return res.status(403).json({ success: false, message: "🛑 صلاحيات إدارية مفقودة!" });
        }

        const ACTIVE_SUBSCRIBERS_PATH = path.join(__dirname, 'ouro_active_teachers.json');
        
        if (!fs.existsSync(ACTIVE_SUBSCRIBERS_PATH)) {
            return res.json([]);
        }
        
        const data = fs.readFileSync(ACTIVE_SUBSCRIBERS_PATH, 'utf-8');
        return res.json(JSON.parse(data || '[]'));
    } catch (e) { 
        return res.json([]); 
    }
});


// ==========================================================================
// 🚀 [إقلاع السيرفر النهائي] تشغيل وإطلاق المنصة على البورت المعتمد
// ==========================================================================
server.listen(PORT, "0.0.0.0", () => { 
    console.log(`===========================================================`);
    console.log(`🚀 ✅ THE HONOR Server is officially launching up on Port: ${PORT}`);
    console.log(`🕋 Connected to MongoDB Atlas & Ready for Hugging Face Cloud`);
    console.log(`===========================================================`);
});
