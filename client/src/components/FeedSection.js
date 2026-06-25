import React, { useState } from 'react';
import axios from 'axios';

const FeedSection = ({ posts, setPosts, user, socket, apiBase }) => {
  const [postText, setPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !selectedFile) return;

    const fd = new FormData();
    fd.append('author', user.username);
    fd.append('text', postText);
    if (selectedFile) fd.append('postImage', selectedFile);

    try {
      const res = await axios.post(`${apiBase}/api/posts/create`, fd);
      if (res.data.success) {
        setPostText("");
        setSelectedFile(null);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="facebook-feed-zone" style={{ width: '100%', maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
      
      {/* 📝 صندوق إنشاء المنشور */}
      <form onSubmit={handlePostSubmit} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px' }}>
        <textarea 
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          placeholder={`ماذا يدور في ذهنك يا ${user.username}؟`}
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', resize: 'none', fontSize: '14px', minHeight: '60px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          <label style={{ cursor: 'pointer', color: 'var(--gold-primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🖼️ <span>إضافة صورة</span>
            <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          {selectedFile && <small style={{ color: '#27ae60' }}>✔️ جاهز: {selectedFile.name.substring(0,10)}...</small>}
          <button type="submit" style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', padding: '5px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>نشر عام 🚀</button>
        </div>
      </form>

      {/* 🎰 خلاصة البث وعرض الكروت الشفافة تماماً */}
      {posts.map(post => (
        <div key={post.id} style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: 'var(--gold-primary)', fontSize: '13px' }}>👑 {post.author}</strong>
            <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{post.time}</small>
          </div>

          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{post.text}</p>
          
          {post.image && <img src={`${apiBase}${post.image}`} alt="Post Attach" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', marginTop: '5px' }} />}

          {/* أشرطة التفاعل باللايكات */}
          <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0', fontSize: '12px' }}>
            <span style={{ cursor: 'pointer', color: post.likes.includes(user.username) ? '#2980b9' : '#fff', fontWeight: 'bold' }} onClick={() => socket.emit('like_facebook_post', { postId: post.id, username: user.username })}>
              👍 {post.likes.length} إعجاب
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>💬 {post.comments.length} تعليق</span>
          </div>

          {/* صندوق التعليقات الداخلي */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
            {post.comments.map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>
                <strong style={{ color: 'var(--gold-primary)' }}>{c.user}: </strong><span>{c.text}</span>
              </div>
            ))}
          </div>

          {/* حقل ضخ تعليق جديد */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="text"
              placeholder="اكتب تعليقاً عاماً..."
              value={commentInputs[post.id] || ''}
              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentInputs[post.id]?.trim()) {
                  socket.emit('comment_facebook_post', { postId: post.id, username: user.username, text: commentInputs[post.id] });
                  setCommentInputs({ ...commentInputs, [post.id]: '' });
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
