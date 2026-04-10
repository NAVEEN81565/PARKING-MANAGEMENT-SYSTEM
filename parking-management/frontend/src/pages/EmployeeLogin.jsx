/* EmployeeLogin – Teal theme */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../services/AppContext';

const inputCls = 'w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-500 focus:bg-white transition-all text-sm';

export default function EmployeeLogin() {
  const { login } = useApp();
  const navigate  = useNavigate();
  const emailRef  = useRef(null);

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('All fields are required.'); return; }
    setLoading(true); setError('');
    const result = await login(form.email.trim().toLowerCase(), form.password);
    setLoading(false);
    if (result.success) {
      if (result.role === 'admin') navigate('/dashboard');
      else navigate('/employee/dashboard');
    } else {
      setError(result.message || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left teal panel */}
      <div className="md:w-[42%] flex flex-col justify-center p-10 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #17c3b2 0%, #0f9b8e 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <User size={32} strokeWidth={2} />
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-3xl font-black mb-3">Employee Portal</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Book parking slots, track your active bookings, and manage your vehicle history — all in one place.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-600 mb-8 transition-colors font-medium">
            <ArrowLeft size={16} /> Back to login
          </button>

          <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-bold text-slate-800 mb-1">Employee Sign In</h2>
          <p className="text-slate-400 text-sm mb-8">Enter your credentials to access your dashboard</p>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2">
              <div className="h-2 w-2 bg-rose-500 rounded-full shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input ref={emailRef} type="email" className={inputCls} placeholder="you@company.com"
                value={form.email} onChange={e => { setForm(f => ({...f, email: e.target.value})); setError(''); }} required />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPwd ? 'text' : 'password'} className={`${inputCls} pr-12`} placeholder="••••••••"
                value={form.password} onChange={e => { setForm(f => ({...f, password: e.target.value})); setError(''); }} required />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #17c3b2, #0f9b8e)' }}>
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <User size={18} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-teal-600 font-semibold hover:underline">Register</button>
          </p>
        </div>
      </div>
    </div>
  );
}
