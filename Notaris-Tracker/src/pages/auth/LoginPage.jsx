import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

export const LoginPage = () => {
  const { loginAsOwner, loginAsStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOwnerPath = location.pathname === '/login/owner';
  const [activeRole, setActiveRole] = useState(isOwnerPath ? ROLES.OWNER : ROLES.STAFF);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Bersihkan form & error jika role / path berubah
  useEffect(() => {
    setEmail('');
    setPassword('');
    setErrorMsg('');
  }, [activeRole, location.pathname]);

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    if (role === ROLES.OWNER) {
      navigate('/login/owner', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradient Accents */}
      <div className="absolute w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[120px] -top-32 -left-32 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-purple/5 rounded-full filter blur-[120px] -bottom-32 -right-32 pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-primary to-primary-dark text-on-primary rounded-2xl flex items-center justify-center mb-1 shadow-md shadow-emerald-500/10">
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              gavel
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl text-slate-800 font-bold tracking-tight">Notaris Digital</h1>
          <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest">
            Sistem Manajemen Berkas Hukum & Akta
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-surface/90 border border-slate-200/80 rounded-2xl shadow-xl p-8 backdrop-blur-md relative">
          {/* Aesthetic Gradient Top Edge */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-purple rounded-t-2xl" />

          {/* Role Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.STAFF)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === ROLES.STAFF
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>Portal Staf</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.OWNER)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === ROLES.OWNER
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              <span>Ketua Notaris</span>
            </button>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-700">
              {activeRole === ROLES.OWNER ? 'Portal Ketua Notaris' : 'Portal Staf Administrasi'}
            </h2>
            <p className="text-xs text-muted mt-1">
              Silakan masukkan email dan kata sandi Anda untuk mengakses dashboard
            </p>
          </div>

          {/* Error Message Section */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-error-container border border-error/20 text-error rounded-xl text-left text-[12.5px] font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {/* Email Field */}
            <div>
              <label htmlFor="login_email" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Email Pengguna
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-[18px]">
                  mail
                </span>
                <input
                  id="login_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@notaris.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-[13.5px] text-text focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted/60"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="login_password" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-[18px]">
                  lock
                </span>
                <input
                  id="login_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-[13.5px] text-text focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                  aria-label={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                />
                <span className="text-[12px] text-muted font-medium">Ingat perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-on-primary rounded-xl font-bold text-[14px] hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Masuk ke Akun</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Brand Footer */}
        <p className="text-center text-[10px] text-muted font-medium">
          Sistem Notaris Digital v3.2.0 · Enkripsi SSL Aman
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
