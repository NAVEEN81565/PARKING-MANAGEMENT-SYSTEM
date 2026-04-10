/* EmployeeMgmt – Teal theme */
import { useState } from 'react';
import { UserPlus, Users, Search, Trash2, Mail, Lock, User } from 'lucide-react';
import { useApp } from '../services/AppContext';
import Alert from '../components/Alert';

const inputCls = 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400';

export default function EmployeeMgmt() {
  const { employees, addEmployee, deleteEmployee } = useApp();
  const [form,   setForm]   = useState({ name: '', email: '', password: 'emp123' });
  const [search, setSearch] = useState('');
  const [alert,  setAlert]  = useState(null);

  const showAlert = (type, text) => { setAlert({ type, text }); setTimeout(() => setAlert(null), 4000); };

  const handleAdd = async e => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (form.password.length < 6) { showAlert('error', 'Password must be at least 6 characters.'); return; }
    const r = await addEmployee(form.name.trim(), form.email.trim().toLowerCase(), form.password);
    if (r.success) { showAlert('success', `Employee "${form.name}" added!`); setForm({ name: '', email: '', password: 'emp123' }); }
    else showAlert('error', r.message);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove employee "${name}"?`)) return;
    await deleteEmployee(id);
    showAlert('success', `Employee "${name}" removed.`);
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 fade-in">

      {/* Header */}
      <div className="mb-2">
        <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">Employee Management</h1>
        <p className="text-slate-400 text-sm">Add, search, and manage employee accounts</p>
      </div>

      {alert && <Alert type={alert.type} message={alert.text} onClose={() => setAlert(null)} />}

      {/* Add Employee Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-teal-50 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #0f9b8e0a 0%, #17c3b20a 100%)' }}>
          <span className="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><UserPlus size={16} /></span>
          <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800">Add New Employee</h3>
        </div>
        <div className="p-5">
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={inputCls} placeholder="Full name" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" className={inputCls} placeholder="employee@company.com" value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Initial Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className={inputCls} placeholder="min 6 chars" value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
              </div>
            </div>
            <button type="submit"
              className="w-full md:w-auto h-[44px] px-6 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg,#0f9b8e,#17c3b2)' }}>
              <UserPlus size={16} /> Add Employee
            </button>
          </form>
        </div>
      </div>

      {/* Employee list */}
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-teal-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0f9b8e0a 0%, transparent 100%)' }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><Users size={16} /></span>
            Employees
            <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full ml-1">{filtered.length}</span>
          </h3>
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-500 transition-all placeholder:text-slate-400 shadow-sm"
              placeholder="Search by name/email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-teal-50/60 border-b border-teal-100 text-[11px] uppercase tracking-widest text-teal-700/70">
                <th className="px-5 py-3 font-bold text-center w-10">#</th>
                <th className="px-5 py-3 font-bold">Name</th>
                <th className="px-5 py-3 font-bold">Email</th>
                <th className="px-5 py-3 font-bold">Role</th>
                <th className="px-5 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-400 italic">No employees found.</td></tr>
              ) : filtered.map((emp, i) => (
                <tr key={emp.id} className="hover:bg-teal-50/30 transition-colors group">
                  <td className="px-5 py-4 text-center text-slate-400">{i + 1}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{emp.name}</td>
                  <td className="px-5 py-4 text-slate-500">{emp.email}</td>
                  <td className="px-5 py-4">
                    {emp.role === 'admin'
                      ? <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-teal-100 text-teal-700 tracking-wider">Admin</span>
                      : <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-slate-100 text-slate-600 tracking-wider">Employee</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {emp.role !== 'admin'
                      ? <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          onClick={() => handleDelete(emp.id, emp.name)}>
                          <Trash2 size={13} /> Remove
                        </button>
                      : <span className="text-slate-300 text-xs italic">Protected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
