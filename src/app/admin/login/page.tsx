'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';

function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push(sp.get('redirect') || '/admin');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(
        msg.includes('invalid-credential') || msg.includes('wrong-password')
          ? 'Invalid email or password'
          : msg.includes('not an admin')
          ? 'This account has no admin access'
          : msg
      );
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width:'100%', background:'#111', border:'1px solid #222', borderRadius:6,
    padding:'10px 14px', color:'#fff', fontSize:13, outline:'none'
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex',
      alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>

          <p style={{ fontSize:9, fontWeight:700, letterSpacing:3, textTransform:'uppercase',
            color:'#18A374', marginBottom:8, fontFamily:'monospace' }}>Grab &amp; Go ZA</p>

          <h1 style={{ fontSize:22, fontWeight:900, color:'#fff' }}>Admin Access</h1>
          <p style={{ color:'#444', fontSize:11, marginTop:4, fontFamily:'monospace' }}>
            Authorised personnel only
          </p>
        </div>
        {sp.get('error') === 'session-expired' && (
          <div style={{ background:'#78350f18', border:'1px solid #78350f', borderRadius:6,

            padding:'10px 14px', color:'#fcd34d', fontSize:11, marginBottom:16, fontFamily:'monospace' }}>
            Session expired — please sign in again

          </div>
        )}
        {sp.get('error') === 'unauthorized' && (

          <div style={{ background:'#7f1d1d18', border:'1px solid #7f1d1d', borderRadius:6,
            padding:'10px 14px', color:'#fca5a5', fontSize:11, marginBottom:16, fontFamily:'monospace' }}>
            This account does not have admin access
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom:16 }}>

            <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:2,
              textTransform:'uppercase', color:'#555', marginBottom:6, fontFamily:'monospace' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" style={inp}/>
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:2,
              textTransform:'uppercase', color:'#555', marginBottom:6, fontFamily:'monospace' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" style={inp}/>
          </div>
          {error && (
            <div style={{ background:'#7f1d1d18', border:'1px solid #7f1d1d', borderRadius:6,
              padding:'10px 14px', color:'#fca5a5', fontSize:11, marginBottom:16, fontFamily:'monospace' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            width:'100%', background: loading ? '#1a3a2a' : '#18A374', border:'none',
            borderRadius:6, padding:12, color:'#fff', fontSize:11, fontWeight:800,
            letterSpacing:2, textTransform:'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily:'monospace'
          }}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:10, color:'#333', fontFamily:'monospace' }}>
          Not an admin?{' '}
          <a href="/" style={{ color:'#18A374', textDecoration:'none' }}>Back to store</a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
