import React, { useState } from 'react';
import axios from 'axios';

const FeedSection = ({ posts, setPosts, user, socket, apiBase }) => {
  const [feedText, setFeedText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const handleFeedSubmit = async (e) => {
    e.preventDefault();
    if (!feedText.trim() && !selectedFile) return;

    const fd = new FormData();
    fd.append('author', user.username);
    fd.append('text', feedText);
    if (selectedFile) fd.append('feedImage', selectedFile);

    try {
      const res = await axios.post(`${apiBase}/api/feeds/create`, fd);
      if (res.data.success) {
        setFeedText("");
        setSelectedFile(null);
      }
    } catch (err) { console.error("خطأ إنشاء البث العام:", err); }
  };

  return (
    <div className="facebook-feed-zone" style={{ width: '100%', maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
      
      {/* 📝 صندوق إنشاء منشور بث عام جديد بخلفية شفافة */}
      <form onSubmit={handleFeedSubmit} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px' }}>
        <textarea 
          value={feedText}
          onChange={(e) => setFeedText(e.target.value)}
          placeholder={`ماذا يدور في ذهنك يا ${user.username}؟ انشرها للجميع حياً...`}
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', resize: 'none', fontSize: '14px', minHeight: '60px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          <label style={{ cursor: 'pointer', color: 'var(--gold-primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🖼️ <span>إضافة صورة للمنشور</span>
            <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          {selectedFile && <small style={{ color: '#27ae60' }}>✔️ الصورة جاهزة</small>}
          <button type="submit" style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', padding: '5px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>نشر عام في البث 🚀</button>
        </div>
      </form>

      {/* 🎰 عرض كروت المنشورات بخلفية شفافة تماماً */}
      {posts.map(feed => (
        <div key={feed.id} style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: 'var(--gold-primary)', fontSize: '13px' }}>👑 {feed.author}</strong>
            <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{feed.time}</small>
          </div>

          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{feed.text}</p>
          
          {feed.image && <img src={`${apiBase}${feed.image}`} alt="Feed Attach" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', marginTop: '5px' }} />}

          {/* أشرطة التفاعل باللايكات والتعليقات المنفصلة */}
          <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0', fontSize: '12px' }}>
            <span style={{ cursor: 'pointer', color: feed.likes?.includes(user.username) ? '#3498db' : '#fff', fontWeight: 'bold' }} onClick={() => socket.emit('like_facebook_feed', { feedId: feed.id, username: user.username })}>
              👍 {feed.likes?.length || 0} إعجاب
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>💬 {feed.comments?.length || 0} تعليق</span>
          </div>

          {/* عرض صندوق التعليقات */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
            {feed.comments?.map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>
                <strong style={{ color: 'var(--gold-primary)' }}>{c.user}: </strong><span>{c.text}</span>
              </div>
            ))}
          </div>

          {/* حقل إدخال تعليق جديد وعبر السوكيت */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="text"
              placeholder="اكتب تعليقاً في ساحة البث..."
              value={commentInputs[feed.id] || ''}
              onChange={(e) => setCommentInputs({ ...commentInputs, [feed.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentInputs[feed.id]?.trim()) {
                  socket.emit('comment_facebook_feed', { feedId: feed.id, username: user.username, text: commentInputs[feed.id] });
                  setCommentInputs({ ...commentInputs, [feed.id]: '' });
                }
              }}
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px', outline: 'none' }}
            />
          </div>

        </div>
      ))}
    </div>
  );
};

export default FeedSection;
