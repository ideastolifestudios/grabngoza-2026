import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([{ role: 'assistant', content: 'Hey! Welcome to Grab & Go. How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const t = input.trim(); if (!t || loading) return;
    setMsgs(p => [...p, { role: 'user', content: t }]); setInput(''); setLoading(true);
    try {
      const r = await fetch('/api/support-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: t, history: msgs.slice(-8) }) });
      const d = await r.json();
      setMsgs(p => [...p, { role: 'assistant', content: d.reply || 'Sorry, something went wrong.' }]);
    } catch { setMsgs(p => [...p, { role: 'assistant', content: 'Connection issue. Email shopgrabngo.online@gmail.com.' }]); }
    finally { setLoading(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} aria-label="Support chat" style={{ position:'fixed',bottom:'24px',right:'24px',zIndex:9999,width:'56px',height:'56px',borderRadius:'50%',background:'#000',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
      <MessageSquare size={24} />
    </button>
  );

  return (
    <div style={{ position:'fixed',bottom:'24px',right:'24px',zIndex:9999,width:'380px',maxWidth:'calc(100vw - 32px)',height:'520px',maxHeight:'calc(100vh - 48px)',background:'#fff',borderRadius:'16px',overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column',fontFamily:"'Helvetica Neue',sans-serif" }}>
      <div style={{ background:'#000',color:'#fff',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <div><div style={{ fontWeight:700,fontSize:'13px',letterSpacing:'1px',textTransform:'uppercase' }}>Grab & Go Support</div><div style={{ fontSize:'10px',color:'#888',marginTop:'2px' }}>AI Assistant</div></div>
        <button onClick={() => setOpen(false)} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer' }}><X size={18} /></button>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'16px',background:'#f9f9f9' }}>
        {msgs.map((m,i) => (
          <div key={i} style={{ display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:'10px' }}>
            <div style={{ maxWidth:'80%',padding:'10px 14px',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:m.role==='user'?'#000':'#fff',color:m.role==='user'?'#fff':'#333',fontSize:'13px',lineHeight:'1.5',boxShadow:m.role==='assistant'?'0 1px 4px rgba(0,0,0,0.08)':'none',whiteSpace:'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ display:'flex',marginBottom:'10px' }}><div style={{ padding:'10px 14px',borderRadius:'14px',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}><Loader2 size={16} className="animate-spin" /></div></div>}
        <div ref={bottom} />
      </div>
      <div style={{ padding:'12px 16px',borderTop:'1px solid #eee',background:'#fff',display:'flex',gap:'8px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()} placeholder="Ask me anything..." style={{ flex:1,border:'1px solid #e0e0e0',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',outline:'none' }} />
        <button onClick={send} disabled={loading||!input.trim()} style={{ background:'#000',color:'#fff',border:'none',borderRadius:'8px',padding:'0 14px',cursor:'pointer',opacity:loading||!input.trim()?0.4:1 }}><Send size={16} /></button>
      </div>
    </div>
  );
}
