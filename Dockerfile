# 1️⃣ استخدام إصدار نود مستقر ومناسب
FROM node:20

# 2️⃣ إنشاء مجلد العمل بداخل الحاوية
WORKDIR /App

# 3️⃣ نسخ ملفات حزم السيرفر من داخل مجلد server الفرعي
COPY server/package*.json ./

# 4️⃣ تثبيت الحزم المطلوبة للسيرفر فقط دون حزم التطوير
RUN npm install --omit=dev

# 5️⃣ نسخ محتويات مجلد server بالكامل إلى مجلد العمل بداخل الحاوية
COPY server/ .

# 6️⃣ فتح المنفذ الإجباري لـ Hugging Face Spaces
EXPOSE 7860
ENV PORT=7860

# 7️⃣ إقلاع وتشغيل السيرفر الرئيسي بنجاح لـ The HONOR
CMD ["node", "server.js"]
