const app = require('./App'); // استدعاء تطبيق Express المطور من ملف App.js

// تحديد المنفذ الافتراضي لمنصة Hugging Face وهو دائماً 7860
const PORT = process.env.PORT || 7860;

// تشغيل السيرفر بشكل مستمر ومستقر
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ تم تشغيل سيرفر شركة The HONOR بنجاح على منصة Hugging Face!`);
    console.log(`🔗 السيرفر يعمل الآن على المنفذ: ${PORT}`);
});
