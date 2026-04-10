/* ProfileModal – Teal theme */
import { useState, useRef, useEffect } from 'react';
import { Camera, X, User } from 'lucide-react';
import { useApp } from '../services/AppContext';

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-500 focus:bg-white transition-all';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useApp();
  const [formData, setFormData] = useState({ name:'', email:'', phone:'', password:'', avatar:'' });
  const [preview,  setPreview]  = useState('');
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({ name:user.name||'', email:user.email||'', phone:user.phone||'', password:'', avatar:user.avatar||'' });
      setPreview(user.avatar||''); setMessage(''); setError('');
    }
  }, [user, isOpen]);

  useEffect(() => {
    const h = e => { if (e.key==='Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleChange = e => {
    setFormData(p => ({...p, [e.target.name]: e.target.value}));
    setMessage(''); setError('');
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500*1024) { setError('Image must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setPreview(reader.result); setFormData(p => ({...p, avatar:reader.result})); };
    reader.readAsDataURL(file);
    setMessage(''); setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) { setError('Name and Email are required.'); return; }
    const payload = { name:formData.name, email:formData.email, phone:formData.phone };
    if (formData.password) payload.password = formData.password;
    if (formData.avatar?.startsWith('data:')) payload.avatar = formData.avatar;
    const result = await updateProfile(payload);
    if (result.success) { setMessage('Profile updated!'); setTimeout(onClose, 1500); }
    else setError(result.message || 'Update failed.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden slide-up flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Teal header */}
        <div className="px-6 py-4 text-white flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f9b8e, #17c3b2)' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-lg flex items-center gap-2">
            <User size={18} /> Profile Settings
          </h2>
          <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-teal-200 shadow-lg bg-teal-100 flex items-center justify-center text-3xl font-bold text-teal-600">
                {preview ? <img src={preview} alt="Avatar" className="h-full w-full object-cover" /> : (formData.name?.charAt(0).toUpperCase() || 'U')}
              </div>
              <button type="button"
                className="absolute bottom-0 right-0 p-1.5 rounded-full text-white shadow-md border-2 border-white transition-colors"
                style={{ background: 'linear-gradient(135deg,#0f9b8e,#17c3b2)' }}
                onClick={() => fileInputRef.current.click()}>
                <Camera size={13} />
              </button>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">User ID</label>
                <input type="text" value={user.id} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
                <input type="text" value={user.role} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed uppercase font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Optional" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password <span className="normal-case font-normal">(optional)</span></label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" className={inputCls} />
            </div>
          </div>

          {error   && <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl">{error}</div>}
          {message && <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium rounded-xl">{message}</div>}

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-[2] py-2.5 rounded-xl text-white font-bold text-sm shadow-md shadow-teal-500/20 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#0f9b8e,#17c3b2)' }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
