import React from 'react';
import '../App.css'; // استدعاء ملف التنسيق الشامل ليعمل على هذا الصندوق فوراً

const LoginBox = ({ isSignUp, setIsSignUp, user, setUser, password, setPassword, handleAction }) => {
  
  // دالة وسيطة للتأكد من أن الضغط يعمل واختبار المدخلات محلياً
  const onFormSubmit = (e) => {
    e.preventDefault();
    console.log("🚀 تم الضغط على زر الدخول لـ The HONOR! المستخدم المستهدف:", user?.username);
    handleAction(e); // استدعاء الدالة الأصلية من App.js لتوجيه إشارة السوكيت
  };

  return (
    <div className="login-box-wrapper">
      {/* 👑 [تأمين وتصحيح مسار اللوجو]: استدعاء مباشر من مجلد الأصول العام مأمن من الـ Crash لـ The HONOR */}
      <img 
        src="/assets/logo.png" 
        className="main-logo" 
        alt="The HONOR Logo" 
        style={{ width: '320px', height: 'auto', display: 'block', margin: '0 auto 20px' }} 
        onError={(e) => {
          // خط دفاع احتياطي: لو الصورة مفقودة أو مسارها تالف لا تكسر الصفحة بل تضع نصوصاً بديلة
          e.target.style.display = 'none';
          console.log("⚠️ تنبيه: ملف logo.png غير موجود في مجلد public/assets/");
        }}
      />      
      
      <h2 className="login-title">{isSignUp ? "إنشاء حساب ملكي جديد" : "دخول منصة The HONOR"}</h2>
      
      <form onSubmit={onFormSubmit}>
        <div className="login-fields-container">
            <input 
              type="text"
              placeholder="اسم المستخدم" 
              value={user?.username || ''}
              onChange={e => setUser({...user, username: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password || ''}
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            
            {isSignUp && (
              <select 
                value={user?.role || ''} 
                onChange={e => setUser({...user, role: e.target.value})} 
                required
              >
                <option value="">اختر التخصص الإداري</option>
                <option value="مبرمج">💻 مبرمج</option>
                <option value="تاجر">💰 تاجر</option>
                <option value="مستخدم">✍️ مستخدم عام</option>
              </select>
            )}

            <button 
              type="submit" 
              className="login-btn"
            >
              {isSignUp ? "تأكيد التسجيل السحابي" : "دخول آمن للمنصة الملكية"}
            </button>
        </div>
      </form>

      <p onClick={() => setIsSignUp(!isSignUp)} className="login-toggle-text" style={{ cursor: 'pointer', textAlign: 'center', marginTop: '15px' }}>
        {isSignUp ? "لديك حساب بالفعل؟ سجل دخولك من هنا" : "ليس لديك حساب؟ أنشئ هويتك الملكية الآن"}
      </p>
    </div>
  );
};

export default LoginBox;
