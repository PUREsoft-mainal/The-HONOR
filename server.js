let app;
try {
    app = require('./app'); // المحاولة الأولى بالحرف الصغير
} catch (e) {
    try {
        app = require('./App'); // المحاولة الثانية البديلة بالحرف الكبير
    } catch (err) {
        console.error("خطأ حرج: لم يتم العثور على ملف app.js أو App.js في المجلد الرئيسي!");
        process.exit(1);
    }
}

const PORT = process.env.PORT || 7860;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ تم تشغيل سيرفر شركة The HONOR بنجاح على منصة Hugging Face!`);
});
