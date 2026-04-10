/* Login – Split panel: teal left hero + white right role-picker */
import { useNavigate } from 'react-router-dom';
import { ParkingSquare, ShieldCheck, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left hero panel */}
      <div className="hidden md:flex md:w-[45%] flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f9b8e 0%, #17c3b2 60%, #0b7a70 100%)' }}>
        {/* decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ParkingSquare size={22} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-xl">ParkSys</span>
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-4xl font-black leading-tight mb-4">
            Smart<br />Parking<br />Management
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            A modern, real-time parking management system for organisations — streamline slot booking, tracking, and fine management.
          </p>
        </div>

        <div className="relative">
          {['Real-time slot availability', 'Instant QR booking pass', 'Automated fine tracking'].map((f, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
              <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <div className="h-2 w-2 bg-white rounded-full" />
              </div>
              <p className="text-white/80 text-sm font-medium">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: role picker */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#0f9b8e,#17c3b2)' }}>
              <ParkingSquare size={19} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-xl text-slate-800">ParkSys</span>
          </div>

          <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-3xl font-bold text-slate-800 mb-2">Welcome back</h2>
          <p className="text-slate-500 mb-10 text-sm">Select your account type to continue</p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/admin-login')}
              className="group w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 transition-all duration-200 hover:shadow-md hover:shadow-teal-100 text-left"
            >
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-teal-600 bg-teal-100 group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg,#0f9b8e22,#17c3b222)' }}>
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 text-base">Admin Login</p>
                <p className="text-slate-400 text-sm">Full access — manage slots, employees & history</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/employee-login')}
              className="group w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 transition-all duration-200 hover:shadow-md hover:shadow-teal-100 text-left"
            >
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-teal-600 bg-teal-100 group-hover:scale-110 transition-transform">
                <User size={24} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 text-base">Employee Login</p>
                <p className="text-slate-400 text-sm">Book slots & manage your personal bookings</p>
              </div>
            </button>
          </div>

          <p className="text-center text-sm text-slate-400 mt-8">
            New employee?{' '}
            <button onClick={() => navigate('/register')} className="text-teal-600 font-semibold hover:underline">
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
