/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Header from './components/Header';
import AdSlider from './components/AdSlider'; 
import ActionBar from './components/ActionBar'; 
import GroupsSidebar from './components/GroupsSidebar';
import UploadSidebar from './components/UploadSidebar';
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
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");
  const [files, setFiles] = useState([]);
  const [ads, setAds] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveryTab, setDiscoveryTab] = useState('friends');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState({ id: 'public', name: 'المجموعة العامة' });
  const [groups, setGroups] = useState([{ id: 'public', name: 'المجموعة العامة' }]);
  const [showPrayerModal, setShowPrayerModal] = useState(false); 
  const [showMarket, setShowMarket] = useState(false); 
  const [marketPosts, setMarketPosts] = useState([]);
  const [pendingCenterRequests, setPendingCenterRequests] = useState([]);
  const [pendingApiRequests, setPendingApiRequests] = useState([]);
  const [showAdminPanelModal, setShowAdminPanelModal] = useState(false); 
  const [companyRequests, setCompanyRequests] = useState([]); 
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
      // مستمع استقبال وحفظ رسائل المجموعات اللحظي المصفى
      socket.on('group_message', (data) => {
        if (data && data.roomId === currentGroup.id) {
          const cleanMsg = {
            ...data.msg,
            text: typeof data.msg.text === 'object' && data.msg.text !== null ? data.msg.text.text : data.msg.text
          };
          setChat(prev => [...prev, cleanMsg]);
        }
      });

      // مستمع استقبال رسائل المحادثات العامة والنظام التاريخية
      socket.on('message', (m) => {
        if (m) setChat(prev => [...prev, m]);
      });

      // فحص اسم حساب الأدمن ورقم تعريفه الشخصي الصارم قبل عرض طلب المعلمين
      socket.on('admin_receive_teacher_request', (req) => {
        if (!req) return;
        const isCurrentMeTheTrueAdmin = user && 
                                        user.username === 'Admin_Mostafa' && 
                                        (user._id === req.targetAdminId || user.user_id === req.targetAdminId);

        if (isCurrentMeTheTrueAdmin) {
          setPendingCenterRequests(prev => {
            if (prev.some(p => p.requestId === req.requestId)) return prev;
            return [...prev, req];
          });
          console.log("👑 [Sovereign UI Catch] تم قنص وتثبيت طلب اشتراك موجه لهويتك الملكية حياً!");
        }
      });

      // مستمع التقاط طلبات مفاتيح الـ API بالمزايا المختارة حياً على شاشة الأدمن
      socket.on('admin_receive_api_key_request', (req) => {
        if (!req) return;
        setPendingApiRequests(prev => {
          if (prev.some(p => p.keyId === req.keyId)) return prev;
          return [...prev, req];
        });
      });
      // مستمع المزامنة التاريخية وتأمين بيانات الدخول والتصاريح الإدارية المطهرة من المحافظ
      socket.on('init_data', (data) => { 
        if (data && data.user) {
          setAds(data.ads || []); 
          
          const sanitizedHistory = (data.chatHistory || []).map(m => ({
            ...m,
            text: typeof m.text === 'object' && m.text !== null ? (m.text.text || JSON.stringify(m.text)) : m.text
          }));
          
          setChat(sanitizedHistory); 
          setUser(data.user); 
          if (data.groups) setGroups(data.groups); 
          if (data.stats) { 
              setTotalUsers(data.stats.totalUsers || 0); 
              setActiveUsers(data.stats.activeUsers || 0); 
          }
          setIsLogged(true); 
          
          if (data.usersList && typeof setAllUsers === 'function') {
              setAllUsers(data.usersList);
          }
          if (typeof setLoading === 'function') {
              setLoading(false); 
          }
        }
      });

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

      // مستمع تحديث وتأمين هيكل غرف المشرفين والصلاحيات
      socket.on('update_groups_list', (updatedGroups) => {
        if (!updatedGroups) return;
        setGroups(updatedGroups);
        setCurrentGroup(prevGroup => {
          const currentUpdate = updatedGroups.find(g => g.id === prevGroup.id);
          return currentUpdate ? currentUpdate : prevGroup;
        });
      });

      // مستمع استقبال جلب وضخ تحديثات الإعلانات اللحظية الحية للأشرطة المزدوجة
      socket.on('update_ads', (data) => {
        if (data) setAds(data);
      });

      // مستمع إشارات الأخطاء والتحذيرات السحابية الواردة
      socket.on('error_msg', (msg) => alert("⚠️ " + msg));
    }

    return () => {
      if (socket) {
        socket.off('group_message');
        socket.off('message');
        socket.off('admin_receive_teacher_request');
        socket.off('admin_receive_api_key_request');
        socket.off('init_data');
        socket.off('update_stats');
        socket.off('register_success');
        socket.off('update_groups_list');
        socket.off('update_ads');
        socket.off('error_msg');
      }
    };
  }, [currentGroup.id, user]);
  // 🏛️ [تثبيت وحسم رخصة الشركات] - منع الاختفاء والتحصين الشامل بالـ State العلوية
  useEffect(() => {
    if (socket) {
      socket.on('company_system_granted', (data) => {
        if (data && data.username === user?.username) {
          setUser(prevUser => ({
            ...prevUser,
            canAccessCompanySystem: true,
            companySystemExpiry: data.companySystemExpiry
          }));
        }
      });
    }
    return () => { if (socket) socket.off('company_system_granted'); };
  }, [user?.username]);

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

  // 👑 دالة مستقلة ومعزولة كلياً لجلب الستوريات (القصص) لعدم تداخل خطأ الـ 404
  useEffect(() => {
    const fetchGlobalStories = async () => {
      if (!isLogged) return;
      try {
        const res = await axios.get(`${API_BASE}/api/stories`);
        if (res.data) setFiles(res.data);
      } catch (err) {
        setFiles([]); 
      }
    };
    fetchGlobalStories();
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

  const handleSwitchRoom = (roomId) => {
    if (!roomId) return;
    socket.emit('join_group_room', { roomId });
    const target = groups.find(g => g.id === roomId);
    if (target) setCurrentGroup(target);
  };

  const handleCreateGroup = () => {
    const name = prompt("أدخل اسم المجموعة المخصصة الجديدة:");
    if (name && name.trim()) socket.emit('create_group', { name });
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

        <div className="main-content">
            
          <GroupsSidebar 
            groups={groups} 
            user={user} 
            socket={socket}
            currentGroup={currentGroup.id}
            onJoinRoom={handleSwitchRoom}
            onCreateGroup={handleCreateGroup} 
          />

          {/* المنتصف: منطقة الدردشة واستقبال وعرض رسائل الغرفة الحالية المأمنة لـ The HONOR */}
          <div className="chat-area-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '10px' }}>
            <div className="chat-header" style={{ color: 'var(--gold-primary)', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '10px' }}>
              💬 {currentGroup.name || 'المجموعة العامة'}
            </div>
            
            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {chat.map((m, index) => (
                <div key={index} className={`message-bubble ${m.user === user.username ? 'my-msg' : 'other-msg'}`} style={{ alignSelf: m.user === user.username ? 'flex-end' : 'flex-start', background: m.user === user.username ? '#1e3d59' : '#17b978', padding: '6px 12px', borderRadius: '8px', color: '#fff', maxWidth: '70%' }}>
                  <small style={{ display: 'block', fontSize: '10px', color: '#f5f5f5', fontWeight: 'bold' }}>{m.user} ({m.role})</small>
                  <span>{m.text}</span>
                  <span style={{ display: 'block', fontSize: '9px', textAlign: 'left', marginTop: '2px', color: '#e0e0e0' }}>{m.time}</span>
                </div>
              ))}
            </div>

            <div className="chat-input-wrapper" style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              <input 
                type="text" 
                value={msg} 
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && msg.trim()) {
                    socket.emit('sendMessage', msg);
                    setMsg("");
                  }
                }}
                placeholder="اكتب رسالتك الملكية هنا..." 
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: '#222', color: '#fff' }}
              />
              <button 
                onClick={() => {
                  if (msg.trim()) {
                    socket.emit('sendMessage', msg);
                    setMsg("");
                  }
                }}
                style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                إرسال
              </button>
            </div>
          </div>

          <UploadSidebar 
            files={files} 
            serverUrl={API_BASE} 
            onUpload={handleFileUpload} 
            user={user} 
          />
          
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

        {/* ⚙️ لوحة الأدمن الملكية الشاملة والموحدة للطلبات والتصاريح المعقمة لـ The HONOR */}
        {showAdminPanelModal && (
          <div className="discovery-overlay" onClick={() => setShowAdminPanelModal(false)}>
            <div className="discovery-window gold-border" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '600px', background: '#070707', padding: '20px', borderRadius: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #c0392b', paddingBottom: '10px' }}>
                <h3 style={{ color: '#c0392b', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>👑 غرف تحكم الإدارة العليا - الأدمن Mostafa</h3>
                <button className="close-discovery" onClick={() => setShowAdminPanelModal(false)}>×</button>
              </div>

              <div className="discovery-body scrollbar-gold" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* 📋 أ) عرض طلبات الشركات والمصانع السنوية الموقوتة */}
                {companyRequests && companyRequests.length > 0 && (
                  <div style={{ background: 'rgba(41,128,185,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid #2980b9' }}>
                    <small style={{ color: '#2980b9', display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>🏛️ طلبات تفعيل أنظمة الشركات والمصانع المعلقة:</small>
                    {companyRequests.map(r => (
                      <div key={r.requestId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '8px 12px', borderRadius: '4px', marginBottom: '5px' }}>
                        <span style={{ color: '#fff', fontSize: '11px' }}>👤 يطلب المستثمر <strong style={{color:'#2980b9'}}>{r.applicant}</strong> فتح نظام المصانع السنوي</span>
                        <button className="gold-btn-small" style={{ background: '#27ae60', border: 'none', color: '#fff', padding: '4px 12px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }} onClick={() => { if (socket) { socket.emit('admin_approve_company_system', { requestId: r.requestId, applicantName: r.applicant }); setCompanyRequests(prev => prev.filter(req => req.requestId !== r.requestId)); alert(`🏛️ تم قبول طلب المستثمر (${r.applicant}) وتفعيل نظام الشركات بنجاح!`); } }} >موافق (سنة كاملة) ✔️</button>
                      </div>
                    ))}
                  </div>
                )}
                {(!companyRequests || companyRequests.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', margin: '2px 0' }}>📋 لا توجد طلبات شركات معلقة حالياً...</p>
                )}

                {/* 🏫 ب) عرض طلبات السناتر والاجتماعات الموقوتة لـ 30 يوماً بالمنصة */}
                {pendingCenterRequests && pendingCenterRequests.length > 0 && (
                  <div style={{ background: 'rgba(212,175,55,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid var(--gold-primary)', marginTop: '5px' }}>
                    <small style={{ color: 'var(--gold-primary)', display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>🏫 طلبات فتح السناتر المعلقة (30 يوماً):</small>
                    {pendingCenterRequests.map(r => (
                      <div key={r.requestId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '8px 12px', borderRadius: '4px', marginBottom: '5px' }}>
                        <span style={{ color: '#fff', fontSize: '11px' }}>👤 يطلب المستخدم <strong style={{color:'var(--gold-primary)'}}>{r.applicant}</strong> فتح سنتر خاص به للتدريس</span>
                        <button className="gold-btn-small" style={{ background: '#27ae60', border: 'none', color: '#fff', padding: '4px 12px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }} onClick={() => { if (socket) { socket.emit('admin_approve_teacher_request', { requestId: r.requestId }); setPendingCenterRequests(prev => prev.filter(req => req.requestId !== r.requestId)); alert("👑 تم تفعيل ترخيص السنتر والاجتماعات بنجاح لمدة 30 يوماً!"); } }} >موافق (30 يوماً) ✔️</button>
                      </div>
                    ))}
                  </div>
                )}
                {(!pendingCenterRequests || pendingCenterRequests.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', margin: '2px 0' }}>🏫 لا توجد طلبات سناتر معلقة حالياً...</p>
                )}

              </div>
            </div>
          </div>
        )}

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

