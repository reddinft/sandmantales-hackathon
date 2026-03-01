import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        .star { position: absolute; background: white; border-radius: 50%; animation: twinkle 3s infinite ease-in-out; }
        .star-1 { width: 2px; height: 2px; top: 10%; left: 20%; animation-delay: 0s; }
        .star-2 { width: 3px; height: 3px; top: 20%; left: 80%; animation-delay: 0.5s; }
        .star-3 { width: 1px; height: 1px; top: 60%; left: 10%; animation-delay: 1s; }
        .star-4 { width: 2px; height: 2px; top: 80%; left: 90%; animation-delay: 1.5s; }
      `}</style>
      <div className="star star-1" /><div className="star star-2" /><div className="star star-3" /><div className="star star-4" />
      
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-3xl p-8 border border-amber-200/20 w-full max-w-md relative z-10" style={{boxShadow: '0 0 15px rgba(245,158,11,0.5)'}}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-100">🌙 Sandman Tales</h1>
          <p className="text-amber-200/70 mt-2">Multilingual AI Bedtime Stories</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-amber-100 text-sm font-medium mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="demo@sandmantales.demo"
              className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-amber-200/30 text-white placeholder-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-amber-100 text-sm font-medium mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-amber-200/30 text-white placeholder-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          {error && <div className="p-3 bg-red-900/50 rounded-xl text-red-200 text-sm">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50" style={{boxShadow: '0 0 15px rgba(245,158,11,0.5)'}}>
            {loading ? '✨ Entering dreamland...' : '🌟 Enter'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-amber-200/50 text-xs">Powered by ElevenLabs × Mistral AI</p>
          <div className="mt-2 flex justify-center gap-4 text-amber-200/40 text-xs">
            <span>🌳 Papa Bois</span><span>🕷️ Anansi</span><span>🙏 Devi</span><span>🗣️ Ogma</span><span>🦆 Firefly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
