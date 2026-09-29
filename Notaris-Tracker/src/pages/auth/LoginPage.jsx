import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { CheckCircle2, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const { user, profile, loading: authLoading, loginAsOwner, loginAsStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Khusus Notaris Ketua hanya bisa diakses bila URL diketik secara manual
  const isOwnerPath = ['/login/owner', '/login-notaris-ketua', '/owner-login'].includes(location.pathname);
  const activeRole = isOwnerPath ? ROLES.OWNER : ROLES.STAFF;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === ROLES.OWNER || profile.role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else if (profile.role === ROLES.STAFF || profile.role === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setErrorMsg('');
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg('');

    try {
      if (activeRole === ROLES.OWNER) {
        const res = await loginAsOwner(email, password);
        if (res.success) {
          navigate('/owner/dashboard');
        } else {
          setErrorMsg(res.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
        }
      } else {
        const res = await loginAsStaff(email, password);
        if (res.success) {
          navigate('/staff/dashboard');
        } else {
          setErrorMsg(res.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan atau server. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F8] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Soft Pastel 3D Floating Blobs */}
      <div className="absolute w-[450px] h-[450px] bg-gradient-to-br from-[#6366F1]/10 to-[#A855F7]/10 rounded-full filter blur-[100px] -top-24 -left-24 pointer-events-none" />
      <div className="absolute w-[450px] h-[450px] bg-gradient-to-br from-[#10B981]/10 to-[#38BDF8]/10 rounded-full filter blur-[100px] -bottom-24 -right-24 pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Soft 3D Logo */}
          <div className={`mx-auto w-16 h-16 rounded-[22px] flex items-center justify-center text-white mb-2 shadow-[0_10px_25px_rgba(99,102,241,0.35)] ${
            isOwnerPath 
              ? 'bg-gradient-to-tr from-[#4338CA] to-[#6366F1]' 
              : 'bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6]'
          }`}>
            {isOwnerPath ? (
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            ) : (
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            )}
          </div>
          <h1 className="text-[26px] font-black text-slate-800 tracking-tight font-sans">
            Taskly <span className="text-[#6366F1]">Notaris</span>
          </h1>
          <p className="text-[11.5px] text-slate-400 font-bold uppercase tracking-widest">
            Sistem Manajemen Berkas Hukum Terpadu
          </p>
        </div>

        {/* Soft 3D Card */}
        <div className="bg-white/95 border border-white/80 rounded-[30px] shadow-[0_16px_45px_rgba(112,144,176,0.12)] p-8 backdrop-blur-md relative text-left">
          
          <div className="mb-6 text-center">
            {isOwnerPath ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] text-[11px] font-extrabold uppercase tracking-wider mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>Restricted Access &bull; Pimpinan</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[11px] font-extrabold uppercase tracking-wider mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Portal Operasional Staf</span>
              </div>
            )}

            <h2 className="text-[19px] font-extrabold text-slate-800 tracking-tight">
              {isOwnerPath ? 'Portal Notaris Utama' : 'Masuk Akun Staf'}
            </h2>
            <p className="text-[12.5px] text-slate-400 font-medium mt-1">
              {isOwnerPath 
                ? 'Autentikasi terenkripsi khusus Ketua Notaris / Pimpinan.' 
                : 'Gunakan kredensial staf Anda untuk mengakses data berkas.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-[12.5px] font-bold flex items-start gap-2.5 animate-in fade-in">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Email / No. Telepon
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email atau No. Telepon"
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-lg border-slate-300 text-[#6366F1] focus:ring-[#6366F1]/20 w-4 h-4 cursor-pointer"
                />
                <span className="text-[12px] text-slate-500 font-semibold">Ingat perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-3 py-3.5 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all ${
                isOwnerPath 
                  ? 'btn-primary-3d bg-[#4338CA] hover:bg-[#3730A3]' 
                  : 'btn-primary-3d'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>{isOwnerPath ? 'Masuk Portal Pimpinan' : 'Masuk Portal Staf'}</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 font-semibold">
          Taskly Notaris v2.4.0 &bull; Enkripsi SSL 256-bit Aman
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
