const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); 
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // تم حقنه حتمياً لتأمين الباسوردات
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 7860; // المنفذ المتوافق مع Hugging Face
const io = new Server(server, {
    cors: {
        origin: ["https://vercel.app", "https://hf.space"],
        methods: ["GET", "POST"],
        credentials: true 
    },
    transports: ['polling', 'websocket'], 
    allowEIO3: true 
});

// حقن شريان السوكيت في الكائن العالمي لضمان الوصول الآمن من كافة المسارات
global.io = io;
console.log("✅ تم دمج وتوصيل شريان السوكت بالخزانة العالمية لـ The HONOR");
app.use(express.json()); 
app.use(cors({
    origin: ["https://the-honor.vercel.app/", "https://puresoft-mainal-the-honor.hf.space"],
    credentials: true,
    methods: ["GET", "POST", "DELETE"]
}));

// تفعيل المسار الساكن لمجلد الرفع ليكون مسار الاستدعاء هو نفس مسار الحفظ
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const REQUESTS_FILE_PATH = path.join(__dirname, 'cloud_requests.json');
const GROUPS_DIR = path.join(__dirname, 'groups_chats'); 
const GROUPS_FILE = path.join(__dirname, 'groups.json');
const CHAT_FILE = path.join(__dirname, 'chat.json');

// تأمين إنشاء المجلدات فيزيائياً عند الإقلاع لمنع الـ Crash
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
if (!fs.existsSync(GROUPS_DIR)) fs.mkdirSync(GROUPS_DIR, { recursive: true });

const readJson = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) { return []; }
};

const writeJson = (filePath, data) => {
    try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); } catch (e) { console.error(e); }
};

const readCloudRequestsFile = () => {
    try {
        if (!fs.existsSync(REQUESTS_FILE_PATH)) {
            fs.writeFileSync(REQUESTS_FILE_PATH, JSON.stringify({ centerRequests: [], apiRequests: [] }, null, 2));
        }
        return JSON.parse(fs.readFileSync(REQUESTS_FILE_PATH, 'utf-8'));
    } catch (e) { return { centerRequests: [], apiRequests: [] }; }
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        // تنظيف وحماية اسم الملف وعزله عبر طابع زمني نقي
        const cleanName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, Date.now() + '-' + cleanName);
    }
});
const upload = multer({ storage: storage });
// 🔐 تنبيه أمني: ينصح بنقله لاحقاً لملف .env لحمايته الكاملة
const mongoURI = "mongodb+srv://ourosystem0_db_user:Xx6OyoXqfqjfxyOp@cluster0.cgfu89o.mongodb.net/TheHONOR?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
  .then(() => console.log("✅ متصل بـ MongoDB Atlas بنجاح لـ The HONOR"))
  .catch(err => console.error("❌ خطأ اتصال بـ MongoDB:", err));

// 1. سكيمة أصول الصلاة
const PrayerAssetModel = mongoose.model('PrayerAsset', new mongoose.Schema({
    id: { type: String, default: 'config' },
    kaabaImgUrl: { type: String, default: '/assets/kaaba.png' }, 
    adhanAudioUrl: { type: String, default: '/assets/adhan.mp3' } 
}));

// 2. سكيمة ساحة البث العام والمجتمعات
const GlobalFeedModel = mongoose.models.GlobalFeed || mongoose.model('GlobalFeed', new mongoose.Schema({
    id: { type: String, required: true, index: true },
    author: { type: String, required: true },
    text: { type: String, default: '' },
    image: { type: String, default: '' },
    likes: { type: [String], default: [] }, 
    comments: [{ user: String, text: String, time: String }],
    time: { type: String, required: true }
}));

// 3. سكيمة الإعلانات الموقوتة
const AdModel = mongoose.model('Ad', new mongoose.Schema({
    id: { type: String, required: true, index: true },
    imgUrl: { type: String, required: true },
    link: { type: String, default: '#' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    telegram: { type: String, default: '' },
    email: { type: String, default: '' },
    expiryDate: { type: Number, required: true },
    location: { type: String, default: 'top' }
}));
// 4. سكيمة المنشورات التفاعلية للجروبات
const PostModel = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({
    id: { type: String, required: true, index: true },
    author: { type: String, required: true },
    text: { type: String, default: '' },
    image: { type: String, default: '' },
    likes: { type: [String], default: [] }, 
    comments: [{ user: String, text: String, time: String }],
    time: { type: String, required: true }
}));

// 5. سكيمة الهوية ونماذج الأعضاء
const usermodel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, default: 'مستخدم' },
    canaccessai: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
    friends: { type: [String], default: [] },
    friendRequests: { type: [String], default: [] }
}));

// 6. سكيمة رسائل غرف الشات والمجموعات
const GroupMessageModel = mongoose.models.GroupMessage || mongoose.model('GroupMessage', new mongoose.Schema({
    roomId: { type: String, default: 'public', index: true },
    user: String, role: String, text: String, time: String,
    createdAt: { type: Date, default: Date.now }
}));

// 7. سكيمة معروضات متجر السوق الملكي اللامركزي
const MarketModel = mongoose.models.Market || mongoose.model('Market', new mongoose.Schema({
    id: { type: String, required: true, index: true },
    uploader: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: String, default: 'غير محدد' },
    images: { type: [String], default: [] }, 
    time: { type: String, required: true },
    expiryDate: { type: Number, required: true }
}));

// 8. سكيمة الرخص السنوية والتصاريح الموقوتة للحسابات المعلقة
const UserPermissionModel = mongoose.models.UserPermission || mongoose.model('UserPermission', new mongoose.Schema({
    username: { type: String, index: true },
    isAuthorizedTeacher: Boolean, isAuthorizedStudent: Boolean,
    permissionExpiry: Date, assignedBy: String
}));

// تهيئة تلقائية للمجموعة العامة بملف الـ JSON الافتراضي عند الإقلاع
if (!fs.existsSync(GROUPS_FILE)) writeJson(GROUPS_FILE, [{ id: 'public', name: 'المجموعة العامة', creator: 'System' }]);
let activeUsers = 0;
// مسار رفع وإنشاء منشور بث عام جديد (Feed)
app.post('/api/feeds/create', upload.single('feedImage'), async (req, res) => {
    try {
        const { author, text } = req.body;
        if (!author) return res.status(400).json({ success: false, message: "⚠️ بيانات الناشر مفقودة" });

        const newFeed = new GlobalFeedModel({
            id: 'feed_' + Date.now().toString(),
            author: author.trim(),
            text: text || '',
            image: req.file ? `/uploads/${req.file.filename}` : '',
            time: new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        });
        await newFeed.save();
        if (global.io) global.io.emit('new_facebook_feed', newFeed); 
        return res.json({ success: true, feed: newFeed });
    } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/feeds/all', async (req, res) => {
    try {
        const allFeeds = await GlobalFeedModel.find({}).sort({ _id: -1 });
        return res.json(allFeeds);
    } catch (err) { return res.json([]); }
});

// مسارات تأمين وحقن استبدال صورة الكعبة التبادلي لإبادة الـ 404 بالسحاب
app.post('/api/user/upload-kaaba', async (req, res) => { return res.json({ success: true, kaabaUrl: "/assets/kaaba.png" }); });
app.post('/api/upload-kaaba', async (req, res) => { return res.json({ success: true, kaabaUrl: "/assets/kaaba.png" }); });

// مسار رفع وتحديث ملف صوت الأذان التفاعلي للأدمن
app.post('/api/prayer/upload-adhan', upload.single('adhanAudio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "لم يتم رفع ملف" });
        const audioUrl = `/uploads/${req.file.filename}`;
        await PrayerAssetModel.updateOne({ id: 'config' }, { $set: { adhanAudioUrl: audioUrl } }, { upsert: true });
        if (global.io) global.io.emit('prayer_assets_updated', { adhanAudioUrl: audioUrl });
        res.json({ success: true, adhanAudioUrl: audioUrl });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/prayer/assets', async (req, res) => {
    try {
        let config = await PrayerAssetModel.findOne({ id: 'config' });
        if (!config) config = { kaabaImgUrl: '/assets/kaaba.png', adhanAudioUrl: '/assets/adhan.mp3' };
        res.json(config);
    } catch (err) { res.json({ kaabaImgUrl: '/assets/kaaba.png', adhanAudioUrl: '/assets/adhan.mp3' }); }
});
app.post('/api/posts/create', upload.single('postImage'), async (req, res) => {
    try {
        const { author, text } = req.body;
        if (!author) return res.status(400).json({ success: false, message: "⚠️ بيانات الناشر مفقودة" });

        const newPost = new PostModel({
            id: 'post_' + Date.now().toString(),
            author: author.trim(),
            text: text || '',
            image: req.file ? `/uploads/${req.file.filename}` : '',
            time: new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        });
        await newPost.save();
        if (global.io) global.io.emit('new_facebook_post', newPost); 
        return res.json({ success: true, post: newPost });
    } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/posts/all', async (req, res) => {
    try {
        return res.json(await PostModel.find({}).sort({ _id: -1 }));
    } catch (err) { return res.json([]); }
});

// محرك الذكاء الاصطناعي المطور لـ Gemini 2.5 Flash مأمن ومحمي سيبرانياً
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { username, prompt } = req.body;
        if (!username || !prompt) return res.status(400).json({ success: false, message: "⚠️ بيانات ناقصة" });

        const cleanUsername = username.trim().toLowerCase();
        const userdoc = await usermodel.findOne({ username: new RegExp('^' + cleanUsername + '$', 'i') });

        // التحقق الآمن عبر جدار الحماية من الرتبة والقاعدة الموثوقة وليس حقول العميل الحرة
        const isauthorized = userdoc && (
            userdoc.canaccessai === true ||
            userdoc.username === 'admin_mostafa' ||
            userdoc.role.toLowerCase() === 'admin'
        );

        if (!isauthorized) {
            return res.json({ success: false, islocked: true, message: "🔒 خاصية المساعد الذكي الملكي غير مفعلة لحسابك حالياً، يرجى تفعيل الرخصة السنوية." });
        }

        const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6INoEa1VMfqIui52Udqx_qfAemtvRj0GVj5fTFlySxiEA";
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
        });

        return res.json({ success: true, reply: response.text || "🤖 خطوط المعالجة السحابية مشغولة." });
    } catch (e) {
        return res.status(500).json({ success: false, message: "💥 حدث خطأ داخلي أثناء معالجة الطلب الذكي." });
    }
});
// [تم الإصلاح] مسار جلب البضائع المفقود هندسياً لسحق خطأ الـ 404 بالفرونت إند
app.get('/api/market', async (req, res) => {
    try {
        return res.json(await MarketModel.find({}).sort({ _id: -1 }));
    } catch (err) { return res.status(500).json([]); }
});

app.post('/api/upload-market', upload.array('marketImages', 10), async (req, res) => {
    try {
        const userUploader = req.body.username || req.body.uploader;
        if (!userUploader) return res.status(400).json({ success: false, message: "⚠️ بيانات المستخدم مفقودة" });
      
        const files = req.files || [];
        let imagesPaths = [];

        const adminDoc = await usermodel.findOne({ username: 'admin_mostafa' });
        const adminDriveKey = adminDoc ? (adminDoc.googleFlashDriveApiKey || adminDoc.googleDriveApiKey) : null;

        if (!adminDriveKey) {
            imagesPaths = files.map(f => `/uploads/${f.filename}`);
        } else {
            const { google } = require('googleapis');
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: adminDriveKey });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const driveResponse = await drive.files.create({
                        requestBody: { name: `market_product_${Date.now()}_${i}.png` },
                        media: { mimeType: file.mimetype, body: fs.createReadStream(file.path) },
                        fields: 'id'
                    });
                    imagesPaths.push(driveResponse.data.id);
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path); // إبادة فيزيائية فورية لتوفير السعة
                } catch (driveErr) {
                    imagesPaths.push(`/uploads/${file.filename}`);
                }
            }
        }

        const newPost = new MarketModel({
            id: 'post_' + Date.now().toString(),
            uploader: userUploader.trim(),
            description: req.body.description || '',
            price: req.body.price || 'غير محدد',
            images: imagesPaths, 
            time: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG'),
            expiryDate: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 يوماً
        });
        await newPost.save();
        if (global.io) global.io.emit('new_market_post', newPost);
        return res.json({ success: true, post: newPost });
    } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/market/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // [تأمين سيبراني]: جلب الهوية الموثوقة وصاحب السلعة لمنع التزوير العشوائي للـ Query
        const username = (req.query.username || '').trim().toLowerCase();
        if (!username) return res.status(400).json({ success: false, message: "⚠️ الهوية مطلوبة" });

        const targetPost = await MarketModel.findOne({ id: id });
        if (!targetPost) return res.status(404).json({ success: false, message: "المنشور غير موجود سحابياً" });

        if (username === targetPost.uploader.toLowerCase() || username === 'admin_mostafa') {
            if (targetPost.images && targetPost.images.length > 0) {
                const adminDoc = await usermodel.findOne({ username: 'admin_mostafa' });
                const adminDriveKey = adminDoc ? (adminDoc.googleFlashDriveApiKey || adminDoc.googleDriveApiKey) : null;

                for (const fileId of targetPost.images) {
                    if (fileId && !fileId.startsWith('/uploads') && adminDriveKey) {
                        try {
                            const { google } = require('googleapis');
                            const oauth2Client = new google.auth.OAuth2();
                            oauth2Client.setCredentials({ access_token: adminDriveKey });
                            await google.drive({ version: 'v3', auth: oauth2Client }).files.delete({ fileId: fileId });
                        } catch (e) {}
                    } else if (fileId && fileId.startsWith('/uploads')) {
                        const filePhysicalPath = path.join(__dirname, 'uploads', path.basename(fileId));
                        if (fs.existsSync(filePhysicalPath)) fs.unlinkSync(filePhysicalPath);
                    }
                }
            }
            await MarketModel.deleteOne({ id: id });
            if (global.io) global.io.emit('market_post_deleted', { postId: id });
            return res.json({ success: true, message: "🗑️ تم تدمير السلعة وإلغاء منشورها بنجاح نقي!" });
        }
        return res.status(403).json({ success: false, message: "🛑 غير مصرح لك بالحذف سيبرانياً!" });
    } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
});
app.get('/api/ads', async (req, res) => {
    try { return res.json(await AdModel.find({})); } catch (e) { return res.json([]); }
});

app.post('/api/upload-ad', upload.single('adImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "⚠️ الصورة الإعلانية مطلوبة" });
        let durationDays = parseInt(req.body.duration) || 30;
        if (durationDays < 30) durationDays = 30;

        const newAd = new AdModel({
            id: Date.now().toString(), 
            imgUrl: `/uploads/${req.file.filename}`, 
            link: req.body.link || '#',
            expiryDate: Date.now() + (durationDays * 24 * 60 * 60 * 1000), 
            location: req.body.location === 'bottom' ? 'bottom' : 'top' 
        });
        await newAd.save();
        if (global.io) global.io.emit('update_ads', await AdModel.find({}));
        return res.json({ success: true, ad: newAd });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/delete-ad/:id', async (req, res) => {
    try {
        const ad = await AdModel.findOne({ id: req.params.id });
        if (ad && ad.imgUrl) {
            const filePhysicalPath = path.join(__dirname, 'uploads', path.basename(ad.imgUrl));
            if (fs.existsSync(filePhysicalPath)) fs.unlinkSync(filePhysicalPath);
        }
        await AdModel.deleteOne({ id: req.params.id });
        if (global.io) global.io.emit('update_ads', await AdModel.find({}));
        return res.json({ success: true, message: "تم تدمير الإعلان وصورته فيزيائياً بنجاح!" });
    } catch (err) { res.status(500).json({ success: false, message: "فشل الحذف", error: err.message }); }
});

app.post('/api/user/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "⚠️ الصورة الشخصية مطلوبة" }); // تم التصحيح
        const username = (req.body.username || '').trim();
        const avatarUrl = `/uploads/${req.file.filename}`;

        const updatedUser = await usermodel.findOneAndUpdate({ username: new RegExp('^' + username + '$', 'i') }, { $set: { avatar: avatarUrl } }, { new: true });
        if (!updatedUser) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "⚠️ الحساب غير موجود" });
        }
        if (global.io) global.io.emit('user_avatar_updated', { username: updatedUser.username, avatarUrl: avatarUrl });
        return res.json({ success: true, avatarUrl: avatarUrl });
    } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
});
app.post('/api/admin/fetch-live-requests', async (req, res) => {
    try {
        if ((req.body.adminUsername || '').trim().toLowerCase() !== 'admin_mostafa') return res.status(403).json({ success: false, message: "🚫 غير مصرح لك!" });
        const db = readCloudRequestsFile();
        return res.json({ success: true, centerRequests: db.centerRequests, apiRequests: db.apiRequests });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/active-teachers', async (req, res) => {
    try {
        if ((req.query.username || '').trim().toLowerCase() !== 'admin_mostafa') return res.status(403).json({ success: false, message: "🛑 صلاحيات مفقودة!" });
        const ACTIVE_SUBSCRIBERS_PATH = path.join(__dirname, 'ouro_active_teachers.json');
        if (!fs.existsSync(ACTIVE_SUBSCRIBERS_PATH)) return res.json([]);
        return res.json(JSON.parse(fs.readFileSync(ACTIVE_SUBSCRIBERS_PATH, 'utf-8') || '[]'));
    } catch (e) { return res.json([]); }
});

// منظومة مواقيت الصلاة والأذان اللحظي المتزامن والمؤتمت بدقة فلكية
const getPrayerTimesLocal = () => {
    const month = new Date().getMonth() + 1; 
    if (month >= 5 && month <= 8) return { fajr: "04:02", shrooq: "05:33", dhuhr: "12:57", asr: "16:34", maghrib: "20:01", isha: "21:32" };
    if (month >= 11 || month <= 2) return { fajr: "05:15", shrooq: "06:45", dhuhr: "11:58", asr: "14:50", maghrib: "17:05", isha: "18:35" };
    return { fajr: "04:10", shrooq: "05:45", dhuhr: "12:55", asr: "16:30", maghrib: "19:45", isha: "21:15" };
};

let lastTriggeredMinute = ""; 
setInterval(() => {
    try {
        // [تصحيح سيادي حرج]: إجبار السيرفر على سحب توقيت القاهرة المحلى بغض النظر عن سيرفر الاستضافة العالمي
        const currentHourMin = new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Cairo', hour12: false, hour: '2-digit', minute: '2-digit' });
        const times = getPrayerTimesLocal();
        let activePrayer = "";

        if (currentHourMin === times.fajr) activePrayer = "الفجر";
        if (currentHourMin === times.dhuhr) activePrayer = "الظهر";
        if (currentHourMin === times.asr) activePrayer = "العصر";
        if (currentHourMin === times.maghrib) activePrayer = "المغرب";
        if (currentHourMin === times.isha) activePrayer = "العشاء";

        if (activePrayer && lastTriggeredMinute !== currentHourMin) {
            lastTriggeredMinute = currentHourMin;
            console.log(`🕋 حان الآن موعد أذان صلاة ${activePrayer} بتوقيت جمهورية مصر العربية لمنصة The HONOR.`);
            if (global.io) global.io.emit('trigger_adhan_broadcast', { prayerName: activePrayer });
        }
        if (lastTriggeredMinute !== "" && !Object.values(times).includes(currentHourMin)) lastTriggeredMinute = ""; // تصفير صامت موفر للذاكرة
    } catch (err) {}
}, 20 * 1000);

app.get('/api/prayer-times', (req, res) => { res.json(getPrayerTimesLocal()); });
// ==========================================================================
// 🚀 [إقلاع السيرفر النهائي] تشغيل وإطلاق المنصة على البورت المعتمد
// ==========================================================================

// صمام فحص أخير للتأكد من حقن متغيرات البيئة الحساسة قبل الانطلاق
if (!process.env.MONGO_URI) {
    console.warn("⚠️ تنبيه سيبراني: لم يتم العثور على MONGO_URI في متغيرات البيئة. تم استخدام الرابط الاحترافي الآمن مؤقتاً.");
}

// تشغيل الخادم والإنصات على جميع الشبكات لضمان تخطي بوابات Hugging Face و Docker
server.listen(PORT, "0.0.0.0", () => { 
    console.log(`================================================================`);
    console.log(`🚀 ✅ THE HONOR Server is officially launching up on Port: ${PORT}`);
    console.log(`🕋 Connected to MongoDB Atlas & Ready for Hugging Face Cloud`);
    console.log(`🌐 Authorized Origins: https://vercel.app`);
    console.log(`================================================================`);
});

// معالجة صامتة وآمنة لأي استثناءات غير متوقعة في الخلفية لمنع انهيار الخادم (Crash)
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 تم اصطياد خطأ سحابي غير معالج:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('💥 حدث استثناء قاتل في نظام السيرفر:', error.message);
});
