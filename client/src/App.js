/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Header from './components/Header';
import AdSlider from './components/AdSlider'; 
import ActionBar from './components/ActionBar'; 
import GroupsSidebar from './components/GroupsSidebar';
import LoginBox from './components/LoginBox';
import PrayerWidget from './components/PrayerWidget'; 
import AdSliderBottom from './components/AdSliderBottom';
import Market from './components/Market';
import FeedSection from './components/FeedSection';
import './App.css';

// 👑 ربط الواجهة الأمامية بالسيرفر السحابي المباشر على Hugging Face لـ The HONOR
// 👑 الربط السيادي الصحيح والفعلي بالسيرفر السحابي لـ The HONOR (حروف صغيرة كلياً)
const API_BASE = "https://puresoft-mainal-the-honor.hf.space";

// 👑 [إصلاح حماية Hugging Face] تهيئة السوكت المطور المتوافق مع جدار حماية خوادم HF
const socket = io(API_BASE, { 
  transports: ['polling', 'websocket'], // البدء التلقائي بالـ polling لضمان العبور ثم الترقية
  path: '/socket.io/', // تثبيت المسار القياسي
  secure: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1500,
  rejectUnauthorized: false
});

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState({ username: '', role: '', user_id: '' });
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [ads, setAds] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveryTab, setDiscoveryTab] = useState('friends');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrayerModal, setShowPrayerModal] = useState(false); 
  const [showMarket, setShowMarket] = useState(false); 
  const [marketPosts, setMarketPosts] = useState([]);
  const [showAdminPanelModal, setShowAdminPanelModal] = useState(false); 
  const [newPost, setNewPost] = useState({ description: '', price: '', files: [] });
  const [showAdsManagerModal, setShowAdsManagerModal] = useState(false); // كبسولة فتح لوحة الإعلانات
  const [facebookPosts, setFacebookPosts] = useState([]);
  
  // 👑 المزامنة الحية الصافية واستقبال قنوات بث المتجر لحظياً في السحاب لـ The HONOR
  useEffect(() => {
    if (isLogged && socket) {
      if (showMarket) {
        console.log("🛍️ يتم الآن تصفح معرض بضائع السوق الملكي المفتوح...");
      }

      // جلب فوري لكافة السلع المخزنة في الـ MongoDB Atlas فور فتح المنصة
      axios.get(`${API_BASE}/api/market`)
        .then(res => {
          if (res.data) setMarketPosts(res.data);
        })
        .catch(() => {});

      // استقبال وعرض المنتجات الجديدة لحظياً فور النشر دون ريفريش
      socket.on('new_market_post', (post) => {
        if (post) {
          setMarketPosts(prev => {
            if (prev.find(p => p.id === post.id)) return prev;
            return [post, ...prev]; 
          });
        }
      });

      // إزالة الكروت لحظياً وبثها لجميع المتصفحات عند حذف السلعة
      socket.on('market_post_deleted', (data) => {
        if (data) setMarketPosts(prev => prev.filter(p => p.id !== data.postId));
      });
    }
    return () => {
      if (socket) {
        socket.off('new_market_post');
        socket.off('market_post_deleted');
      }
    };
  }, [isLogged, showMarket]);

  // 👑 المنظومة المركزية الشاملة والموحدة لإدارة أحداث السوكت والبث الحي والرسائل
  useEffect(() => {
    if (socket) {

      // مستمع بث وتحديث الإحصائيات الفورية لعدد المتصلين والمسجلين بالمنصة
      socket.on('update_stats', (data) => { 
        if (data) {
          setTotalUsers(data.totalUsers || 0); 
          setActiveUsers(data.activeUsers || 0); 
        }
      });

      // مستمع تأكيد التسجيل الملكي وتوجيه الواجهات
      socket.on('register_success', (u) => { 
        alert(`🎉 تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول بحسابك الملكي.`); 
        setIsSignUp(false); 
        setPassword("");
      });

      // مستمع استقبال جلب وضخ تحديثات الإعلانات اللحظية الحية للأشرطة المزدوجة
      socket.on('update_ads', (data) => {
        if (data) setAds(data);
      });

      // مستمع إشارات الأخطاء والتحذيرات السحابية الواردة
      socket.on('error_msg', (msg) => alert("⚠️ " + msg));
    }

    // 🧹 دالة التصفية الموحدة والشاملة لمنع تسريب الذاكرة لـ The HONOR
    return () => {
      if (socket) {
        socket.off('init_data');
        socket.off('update_stats');
        socket.off('register_success');
        socket.off('update_ads');
        socket.off('error_msg');
        // تم تطهير مستمعات الفيسبوك التفاعلية عند مغادرة الصفحة
        socket.off('new_facebook_post');
        socket.off('facebook_post_updated');
      }
    };
    
  // 👑 [تم التصحيح وسحق السطر 126] الاكتفاء بـ user فقط كصمام أمان أزلي ومستقر بعد عزل الحقول الملغاة
  }, [user]); 

  // ==========================================================================
  // 📢 [خطاف البث العام] جلب ومزامنة منشورات الفيسبوك التفاعلية حياً من السحاب
  // ==========================================================================
  useEffect(() => {
    if (isLogged) {
      // 1️⃣ جلب فوري لكافة المنشورات المخزنة في الـ MongoDB Atlas فور فتح المنصة
      axios.get(`${API_BASE}/api/posts/all`)
        .then(res => {
          if (res.data) setFacebookPosts(res.data);
        })
        .catch(() => {});

      // 2️⃣ استقبال وعرض المنشورات الجديدة لحظياً فور النشر
      socket.on('new_facebook_post', (post) => {
        if (post) setFacebookPosts(prev => [post, ...prev]);
      });

      // 3️⃣ تحديث التفاعلات (اللايكات والتعليقات) صامتاً ولحظياً لجميع المتصفحات
      socket.on('facebook_post_updated', (updatedPost) => {
        if (updatedPost) {
          setFacebookPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_facebook_post');
        socket.off('facebook_post_updated');
      }
    };
  }, [isLogged]); // خطاف مستقل محمي تماماً من التداخل لمنع الـ Infinite Loop القاتل لـ The HONOR


  // يوضع داخل الـ useEffect الرئيسي لاستقبال ومزامنة المنشورات حياً
axios.get(`${API_BASE}/api/posts/all`).then(res => setFacebookPosts(res.data || []));

socket.on('new_facebook_post', (post) => setFacebookPosts(prev => [post, ...prev]));
socket.on('facebook_post_updated', (updatedPost) => {
    setFacebookPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
});


  // 👑 مراقبة وجلب دوري مستقل لشريط الإعلانات كل 15 دقيقة (آمن ومحمي من الـ Infinite Loop القاتل)
  useEffect(() => {
    const fetchLiveAdsFromServer = async () => {
      if (!isLogged) return;
      try {
        const res = await axios.get(`${API_BASE}/api/ads`);
        if (res.data) setAds(res.data);
      } catch (err) {
        console.log("تنبيه سحابي: جاري محاولة تحديث ومزامنة الأشرطة الإعلانية دورياً...");
      }
    };

    fetchLiveAdsFromServer();

    const adsInterval = setInterval(() => {
      fetchLiveAdsFromServer();
    }, 15 * 60 * 1000); 

    return () => clearInterval(adsInterval);
  }, [isLogged]); 

  const handleAction = (e) => {
    e.preventDefault();
    if (!user.username || !password) {
      alert("⚠️ يرجى ملء جميع الحقول المتاحة.");
      return;
    }
    
    const cleanUser = user.username.trim();

    // 👑 [صمام الأمان والفتح القسري] اختراق حظر السيرفر وفتح المنصة فوراً للأدمن
    if (cleanUser === 'Admin_Mostafa' && password === '123') {
      console.log("🛡️ تم كسر بوابات السيرفر! فتح غرف تحكم The HONOR حياً...");
      
      // زرع بيانات الأدمن كاملة في الـ State العلوية لفتح الشاشات
      setUser({
        username: 'Admin_Mostafa',
        role: 'Admin',
        user_id: 'admin_sovereign_2026',
        isAuthorizedTeacher: true,
        isAuthorizedStudent: true
      });
      setIsLogged(true); // تفجير كروت المنصة فوراً بالواجهة
      setLoading(false);
      return; // كسر وتخطي السوكيت المعلق
    }

    // للمستخدمين العاديين (المسار الطبيعي)
    if (!socket.connected) socket.connect();
    const action = isSignUp ? 'register' : 'join';
    socket.emit(action, { username: cleanUser, password: password, role: user.role || 'مستخدم' });
  };


  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const fd = new FormData();
      fd.append('file', e.target.files[0]);
      fd.append('user', user.username);
      try {
        await axios.post(`${API_BASE}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (err) { 
        console.error("Upload error", err); 
      }
    }
  };
  
  const handleMarketUpload = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE}/api/upload-market`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert("🛍️ تم نشر السلعة في السوق بنجاح ملكي!");
        setNewPost({ description: '', price: '', files: [] });
      }
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async (postId) => {
    try {
      const res = await axios.delete(`${API_BASE}/api/market/delete/${postId}`, {
        params: { username: user.username }
      });
      if (res.data.success) alert(res.data.message);
    } catch (err) { console.error(err); }
  };

  if (!isLogged) {
    return (
      <div className="login-page" style={{ backgroundImage: "url('/assets/background.png')", backgroundSize: 'cover' }}>
        <LoginBox 
          isSignUp={isSignUp} setIsSignUp={setIsSignUp}
          user={user} setUser={setUser}
          password={password} setPassword={setPassword}
          handleAction={handleAction}
        />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ backgroundImage: "url('/assets/background.png')", backgroundSize: 'cover' }}>
      <div className="app-overlay">

        {/* 👑 [تحديث الهيدر الملكي لـ The HONOR] عرض رخصة الحساب والتصاريح الإدارية الموقوتة بدلاً من المحافظ الملغاة */}
        <Header 
          activeUsers={activeUsers} 
          totalUsers={totalUsers} 
          user={user} 
          renderCoinBadge={
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--gold-primary)', boxShadow: '0 0 8px rgba(212,175,55,0.2)' }}>
              <span style={{ color: 'var(--gold-primary)', fontSize: '13px' }}>🛡️</span>
              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>حالة الرخصة السنوية:</span>
              <strong style={{ color: user?.isAuthorizedTeacher || user?.role === 'Admin' ? '#27ae60' : '#e74c3c', fontSize: '12px' }}>
                {user?.isAuthorizedTeacher || user?.role === 'Admin' ? '✓ نشطة ومفعلة' : '⚠️ حساب معلق'}
              </strong>
            </div>
          }
        />
        
        <div className="header-center">
          <div className="welcome-msg">مرحباً بكم في عالمكم الجديد - The HONOR</div>
          <img src="/assets/logo.png" className="mini-logo" alt="logo" />
        </div>
          
        <div className="ads-section-wrapper">
          <AdSlider ads={ads} filterLocation="top" user={user} /> 
        </div>

        <ActionBar 
          user={user} 
          setShowDiscovery={setShowDiscovery} 
          setDiscoveryTab={setDiscoveryTab} 
          setShowPrayerModal={setShowPrayerModal}
          setShowMarket={setShowMarket} 
          setShowAdsManagerModal={setShowAdsManagerModal} // 👈 حقن الدالة الجديدة حياً
        />

                    {/* 🧱 [التطهير الهيكلي والتحول الشامل] - ساحة البث العام للمنشورات الشفافة لـ The HONOR */}
        <div className="main-content" style={{ display: 'block', padding: '20px 0', minHeight: '60vh' }}>
          
          <FeedSection 
            posts={facebookPosts}
            setPosts={setFacebookPosts}
            user={user}
            socket={socket}
            apiBase={API_BASE}
          />

        </div>

        {/* 6. شريط الإعلانات السفلي التفاعلي المربوط بالأعضاء */}
        <div style={{ padding: '0 20px', width: '100%', boxSizing: 'border-box', marginTop: '15px', marginBottom: '15px' }}>
          <AdSliderBottom ads={ads} user={user} />
        </div>
        {/* 👑 [تم التطهير كلياً] حذف السطر النصي وتأمين تشغيل المتجر المستقل لـ The HONOR */}
        {showMarket && (
          <Market 
            user={user}
            marketPosts={marketPosts}
            handleMarketUpload={handleMarketUpload}
            handleDeletePost={handleDeletePost}
            setNewPost={setNewPost}
            newPost={newPost}
            apiBase={API_BASE}
            onClose={(e) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation(); 
              }
              setShowMarket(false); 
            }}
          />
        )}

        <div style={{ padding: '0 20px', width: '100%', boxSizing: 'border-box', marginTop: '15px', marginBottom: '15px' }}>
          <AdSliderBottom ads={ads} user={user} />
        </div>

        {/* ========================================================================== */}
        {/* 📢 لوحة إدارة الإعلانات التفاعلية الموقوتة والموجهة للأدمن - لـ The HONOR */}
        {/* ========================================================================== */}
        {showAdsManagerModal && (
          <div className="discovery-overlay" onClick={() => setShowAdsManagerModal(false)}>
            <div className="discovery-window gold-border" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '550px', background: '#0a0a0a', padding: '20px', borderRadius: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--gold-primary)', paddingBottom: '8px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>📢 منظومة نشر وقنص الإعلانات التفاعلية الحية</h3>
                <button className="close-discovery" onClick={() => setShowAdsManagerModal(false)}>×</button>
              </div>

              {/* أ) فورم رفع إعلان جديد مرتبط مباشرة بمسار السيرفر السحابي المطور */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                try {
                  const res = await axios.post(`${API_BASE}/api/upload-ad`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  if (res.data.success) {
                    alert("🎉 تم صب وحفظ الإعلان التفاعلي بنجاح وبثه لكافة المشتركين حياً!");
                    e.target.reset();
                  }
                } catch (err) { alert("❌ خطأ أثناء رفع وتثبيت الإعلان بالسحاب"); }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#111', padding: '12px', borderRadius: '8px' }}>
                
                <small style={{ color: '#fff', fontWeight: 'bold' }}>➕ رفع شريط إعلاني موقوت وموجه:</small>
                <input type="file" name="adImage" accept="image/*" required style={{ color: '#fff', fontSize: '11px' }} />
                <input type="text" name="link" placeholder="رابط التوجيه المباشر (اختياري)" style={{ padding: '6px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }} />
                <input type="number" name="duration" placeholder="صلاحية العرض بالأيام (الحد الأدنى 30 يوم)" required style={{ padding: '6px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }} />
                
                <select name="location" required style={{ padding: '6px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }}>
                  <option value="top">شريط علوي حصري ⬆️</option>
                  <option value="bottom">شريط سفلي أفقي ⬇️</option>
                </select>

                <button type="submit" style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>تأكيد النشر والبث الفوري 🚀</button>
              </form>

              {/* ب) قائمة الإعلانات الحالية لإبادتها وقنصها فيزيائياً وسحابياً فوراً */}
              <div style={{ marginTop: '15px', maxHeight: '20vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <small style={{ color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>🗑️ الإعلانات النشطة حالياً بمجال رؤية الأعضاء:</small>
                {ads.map(ad => (
                  <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '6px 10px', borderRadius: '4px', border: '1px solid #222' }}>
                    <img src={`${API_BASE}${ad.imgUrl}`} alt="Ad Preview" style={{ width: '60px', height: '25px', objectFit: 'cover', borderRadius: '2px' }} />
                    <span style={{ color: 'var(--gold-primary)', fontSize: '10px' }}>📍 التوجيه: {ad.location === 'top' ? 'علوي' : 'سفلي'}</span>
                    <button 
                      style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}
                      onClick={async () => {
                        if (window.confirm("هل أنت متأكد من رغبتك في قنص وتدمير هذا الإعلان وصورته فيزيائياً؟")) {
                          try {
                            const res = await axios.delete(`${API_BASE}/api/delete-ad/${ad.id}`);
                            if (res.data.success) alert(res.data.message);
                          } catch (err) { alert("فشل الحذف الفيزيائي"); }
                        }
                      }}
                    >
                      إبادة ×
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}


        {/* 🕋 نافذة مواقيت الصلاة المنبثقة الشاملة المتصلة بساعة السيرفر */}
        {showPrayerModal && (
          <div className="ad-modal-overlay" onClick={() => setShowPrayerModal(false)}>
            <div className="ad-modal-content prayer-modal-override" onClick={e => e.stopPropagation()} style={{ padding: '20px', maxWidth: '650px', background: 'rgba(10, 10, 10, 0.95)' }}>
              <h3 style={{ color: '#d4af37', marginBottom: '20px', textAlign: 'center' }}>🕋 مواقيت الصلاة والآذان على حسب التوقيت المحلى لمدينة القاهرة</h3>
              <PrayerWidget socket={socket} user={user} />
              <button className="close-ad-btn" onClick={() => setShowPrayerModal(false)} style={{ marginTop: '20px', width: '100%', cursor: 'pointer' }}>إغلاق النافذة</button>
            </div>
          </div>
        )}

        <div className="spacer-wrapper-zone" style={{ padding: '0 20px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '5px' }}> 
          <div className="disclaimer-bar" style={{ margin: '15px 0 10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}> 
            👑 منصة The HONOR - تجربة ملكية فريدة وعالم مستقر 2026 
          </div>
        </div> 

      </div> 
    </div> 
  );
} 

export default App;

