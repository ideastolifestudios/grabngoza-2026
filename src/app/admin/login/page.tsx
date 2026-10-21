'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../../firebase';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();

  const handleSession = async (user: any) => {
    const idToken = await user.getIdToken(true);
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    router.push(sp.get('redirect') || '/admin');
    router.refresh();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await handleSession(cred.user);
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

  const handleGoogleSignIn = async () => {
    setLoading(true); setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleSession(result.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      setError(
        msg.includes('popup-closed-by-user')
          ? 'Sign in popup was closed.'
          : msg.includes('not an admin')
          ? 'This Google account has no admin access'
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
      <div style={{ width:'100%', maxWidth:340 }}>
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
            Session expired - please sign in again
          </div>
        )}
        {sp.get('error') === 'unauthorized' && (
          <div style={{ background:'#7f1d1d18', border:'1px solid #7f1d1d', borderRadius:6,
            padding:'10px 14px', color:'#fca5a5', fontSize:11, marginBottom:16, fontFamily:'monospace' }}>
            This account does not have admin access
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 20,
            fontFamily: 'sans-serif'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign in with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: '#222' }} />
          <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#222' }} />
        </div>

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
          }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:10, color:'#333', fontFamily:'monospace' }}>
          Not an admin?{' '}
          <Link href="/" style={{ color:'#18A374', textDecoration:'none' }}>Back to store</Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
