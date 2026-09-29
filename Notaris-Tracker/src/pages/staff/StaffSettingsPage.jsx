import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { compressImageFile } from '../../lib/storage';
import toast from 'react-hot-toast';

const SaveButton = ({ section, savedSection, onSave, loading }) => (
  <button
    onClick={() => onSave(section)}
    disabled={loading}
    className="px-5 py-2.5 btn-primary-3d rounded-2xl text-[12.5px] font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
  >
    {loading ? (
      <>
        <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
        Menyimpan...
      </>
    ) : savedSection === section ? (
      <>
        <span className="material-symbols-outlined text-[16px]">check</span>
        Tersimpan!
      </>
    ) : (
      <>
        <span className="material-symbols-outlined text-[16px]">save</span>
        Simpan
      </>
    )}
  </button>
);

export const StaffSettingsPage = () => {
  const { user, profile, setProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Form state — pre-filled from profile data
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  // Sync profile data once loaded
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setTitle(profile.title || '');
      setEmail(profile.email || user?.email || '');
      setPhone(profile.phone || '');
      setAvatar(profile.avatar_url || '');
    } else if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // limit 2MB
        toast.error('Ukuran gambar maksimal adalah 2MB!');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Security
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Loading and Feedback
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [savedSection, setSavedSection] = useState('');

  const handleSave = async (section) => {
    if (section === 'profile') {
      setLoadingProfile(true);
      try {
        let avatarUrlToSave = avatar;

        if (avatarFile) {
          try {
            const compressedAvatar = await compressImageFile(avatarFile, { maxWidth: 1024, maxHeight: 1024, quality: 0.85 });
            const fileExt = compressedAvatar.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadErr } = await supabase.storage
              .from('avatars')
              .upload(fileName, compressedAvatar, { upsert: true });

            if (!uploadErr) {
              const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

              if (publicUrlData?.publicUrl) {
                avatarUrlToSave = publicUrlData.publicUrl;
              }
            } else {
              console.warn('Storage upload error, falling back to data URL:', uploadErr.message);
              avatarUrlToSave = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(compressedAvatar);
              });
            }
          } catch (storageErr) {
            console.warn('Storage exception, falling back to data URL:', storageErr);
            avatarUrlToSave = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(avatarFile);
            });
          }
        }

        const profileDataToSave = {
          full_name: name,
          title: title,
          email: email,
          avatar_url: avatarUrlToSave
        };
        if (phone !== undefined) {
          profileDataToSave.phone = phone;
        }

        const { error } = await supabase
          .from('profiles')
          .update(profileDataToSave)
          .eq('id', user.id);

        if (error) {
          // If phone column is missing in DB, try saving without phone column
          if (error.message?.includes('column "phone"') || error.code === '42703') {
            delete profileDataToSave.phone;
            const { error: retryErr } = await supabase
              .from('profiles')
              .update(profileDataToSave)
              .eq('id', user.id);
            if (retryErr) throw retryErr;
          } else {
            throw error;
          }
        }

        // Sync email with Supabase Auth if email was changed
        if (email && user.email && email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
          const { error: authEmailErr } = await supabase.auth.updateUser({ email: email.trim() });
          if (authEmailErr) {
            console.warn('Gagal memperbarui email Auth:', authEmailErr.message);
          }
        }

        // Fetch latest profile to update AuthContext
        const { data: updatedProfile, error: fetchErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!fetchErr && updatedProfile) {
          setProfile(updatedProfile);
        }

        toast.success('Profil berhasil disimpan!');
        setSavedSection(section);
        setTimeout(() => setSavedSection(''), 2500);
      } catch (err) {
        console.error(err);
        toast.error('Gagal menyimpan profil: ' + err.message);
      } finally {
        setLoadingProfile(false);
      }
    } else if (section === 'security') {
      if (!currentPass) {
        toast.error('Kata sandi saat ini wajib diisi!');
        return;
      }
      if (!newPass) {
        toast.error('Kata sandi baru tidak boleh kosong!');
        return;
      }
      if (newPass.length < 6) {
        toast.error('Kata sandi baru minimal 6 karakter!');
        return;
      }
      if (newPass !== confirmPass) {
        toast.error('Konfirmasi kata sandi baru tidak cocok!');
        return;
      }

      setLoadingSecurity(true);
      try {
        // Re-authenticate with current password to verify identity
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user?.email || profile?.email,
          password: currentPass,
        });

        if (signInErr) {
          throw new Error('Kata sandi saat ini salah!');
        }

        const { error } = await supabase.auth.updateUser({ password: newPass });
        if (error) throw error;
        toast.success('Kata sandi berhasil diperbarui!');
        setSavedSection(section);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => setSavedSection(''), 2500);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memperbarui kata sandi: ' + err.message);
      } finally {
        setLoadingSecurity(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarUrl = avatarPreview || avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

  return (
    <div className="max-w-3xl space-y-stack-lg text-left">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Pengaturan Akun</h2>
        <p className="text-body-lg text-on-surface-variant mt-1">
          Kelola profil dan keamanan akun Anda.
        </p>
      </div>

      {/* ─── Profile Card ─── */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] shadow-[0_10px_30px_rgba(112,144,176,0.06)] overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#6366F1] text-[20px]">manage_accounts</span>
          <h3 className="font-extrabold text-slate-800 text-[15px]">Profil Pengguna</h3>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar row */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100 shadow-sm"
              />
              <input
                type="file"
                id="avatarInput"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button 
                type="button"
                onClick={() => document.getElementById('avatarInput').click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#6366F1] text-white rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-[16px]">{profile?.full_name || 'User Notaris'}</p>
              <p className="text-[12px] text-[#6366F1] font-semibold">{profile?.title || 'Staf Administrasi'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{email}</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NAMA LENGKAP */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                NAMA LENGKAP
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                  person
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] font-medium"
                />
              </div>
            </div>

            {/* JABATAN (Read only / Ditentukan Owner) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  JABATAN
                </label>
                <span className="text-[10px] text-slate-400 font-bold">(Ditentukan oleh Owner)</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                  work
                </span>
                <input
                  type="text"
                  disabled
                  value={title || 'Staf Administrasi'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-[13px] text-slate-500 font-semibold cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                EMAIL
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] font-medium"
                />
              </div>
            </div>

            {/* NO. TELEPON (Hanya Angka) */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                NO. TELEPON
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                  call
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <SaveButton section="profile" savedSection={savedSection} onSave={handleSave} loading={loadingProfile} />
          </div>
        </div>
      </div>

      {/* ─── Security ─── */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] shadow-[0_10px_30px_rgba(112,144,176,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#6366F1] text-[20px]">lock</span>
          <h3 className="font-extrabold text-slate-800 text-[15px]">Keamanan Akun</h3>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: 'KATA SANDI SAAT INI', value: currentPass, setter: setCurrentPass },
            { label: 'KATA SANDI BARU', value: newPass, setter: setNewPass },
            { label: 'KONFIRMASI KATA SANDI BARU', value: confirmPass, setter: setConfirmPass },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
          ))}

          {/* Strength indicator */}
          {newPass && (
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Kekuatan Password</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((lvl) => {
                  const strength = Math.min(newPass.length / 4, 1) * 4;
                  return (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        lvl <= strength
                          ? strength <= 1 ? 'bg-error' : strength <= 2 ? 'bg-amber-500' : strength <= 3 ? 'bg-secondary' : 'bg-primary'
                          : 'bg-surface-container-high'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <SaveButton section="security" savedSection={savedSection} onSave={handleSave} loading={loadingSecurity} />
          </div>
        </div>
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="bg-error-container/10 border border-error-container/40 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-error-container/30 flex items-center gap-3">
          <span className="material-symbols-outlined text-error text-[20px]">dangerous</span>
          <h3 className="font-bold text-error text-[15px]">Zona Berbahaya</h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-on-surface text-[14px]">Keluar dari Sistem</p>
            <p className="text-[12px] text-on-surface-variant mt-0.5">Anda akan diarahkan kembali ke halaman login.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-error text-on-error rounded-lg text-[13px] font-bold hover:opacity-90 active:scale-[0.97] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSettingsPage;
