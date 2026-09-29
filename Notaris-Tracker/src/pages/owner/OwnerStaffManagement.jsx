import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCases } from '../../hooks/useCases';
import toast from 'react-hot-toast';

export const OwnerStaffManagement = () => {
  const navigate = useNavigate();
  const { cases } = useCases();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add staff modal state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete staff confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // Fetch all staff profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      setStaffList(profilesData || []);
    } catch (err) {
      console.error('Error loading staff list:', err);
      toast.error('Gagal memuat daftar staf');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Format and calculate active cases count reactively from context
  const formattedStaffList = useMemo(() => {
    return staffList.map(p => {
      const staffCases = cases.filter(c => c.assignedStaffId === p.id);
      const activeCasesCount = staffCases.filter(c => !c.isComplete).length;
      const completedCasesCount = staffCases.filter(c => c.isComplete).length;

      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'Staf')}&background=6366F1&color=fff&bold=true`;

      return {
        id: p.id,
        name: p.full_name || 'Staf Administrasi',
        role: p.title || 'Staf Administrasi',
        email: p.email || 'staf@notaris.id',
        phone: p.phone || '-',
        avatar: p.avatar_url || defaultAvatar,
        activeCases: activeCasesCount,
        completedCases: completedCasesCount,
        totalCases: staffCases.length,
        isActive: p.is_active !== false,
      };
    });
  }, [staffList, cases]);

  // Filter staff by search query
  const filteredStaffList = useMemo(() => {
    if (!searchQuery.trim()) return formattedStaffList;
    const q = searchQuery.toLowerCase().trim();
    return formattedStaffList.filter(
      st => st.name.toLowerCase().includes(q) ||
            st.role.toLowerCase().includes(q) ||
            st.email.toLowerCase().includes(q)
    );
  }, [formattedStaffList, searchQuery]);

  // Overall Statistics
  const kpiStats = useMemo(() => {
    const totalStaff = formattedStaffList.length;
    const activeStaff = formattedStaffList.filter(s => s.activeCases > 0).length;
    const totalAssignedCases = cases.filter(c => c.assignedStaffId && !c.isComplete).length;
    const avgWorkload = totalStaff > 0 ? (totalAssignedCases / totalStaff).toFixed(1) : '0';

    return { totalStaff, activeStaff, totalAssignedCases, avgWorkload };
  }, [formattedStaffList, cases]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Semua field wajib diisi!');
      return;
    }
    if (password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter!');
      return;
    }

    setSubmitting(true);
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_staff_account', {
        p_email: email,
        p_password: password,
        p_full_name: name,
        p_title: role || 'Staf Administrasi'
      });

      if (rpcErr) {
        console.warn('RPC create_staff_account fallback:', rpcErr.message);
        const { error: profErr } = await supabase.from('profiles').insert({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `STAF-${Date.now()}`,
          full_name: name,
          role: 'staff',
          title: role || 'Staf Administrasi',
          email: email,
          is_active: true
        });
        if (profErr) throw profErr;
      }

      toast.success(`Staf ${name} berhasil ditambahkan!`);
      setName('');
      setEmail('');
      setRole('');
      setPassword('');
      setShowInviteModal(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan staf: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    setDeletingId(id);
    try {
      const { error: rpcErr } = await supabase.rpc('deactivate_staff_account', {
        p_user_id: id
      });

      if (rpcErr) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', id);
        if (updateError) throw updateError;
      }

      toast.success('Akun staf berhasil dinonaktifkan.');
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses staf: ' + err.message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-stack-lg text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
            Manajemen Staf Notaris
          </h2>
          <p className="text-body-lg text-on-surface-variant mt-0.5">
            Pantau beban kerja berkas, hak akses, dan performa staf secara real-time. Klik profil staf untuk melihat detail lengkap.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary-3d py-3 px-5 rounded-2xl font-bold text-[13.5px] flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>+ Tambah Staf Baru</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-[#F3F2FD] border border-[#E4E2FB] rounded-[22px] p-4.5 flex items-center gap-4 shadow-[0_8px_20px_rgba(99,102,241,0.05)]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(99,102,241,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[24px]">group</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Staf</p>
            <p className="font-black text-[24px] text-slate-800 leading-tight mt-0.5">{kpiStats.totalStaff} Orang</p>
          </div>
        </div>

        <div className="bg-[#EDFAF3] border border-[#D5F5E4] rounded-[22px] p-4.5 flex items-center gap-4 shadow-[0_8px_20px_rgba(16,185,129,0.05)]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[24px]">engineering</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Staf Aktif Pengerjaan</p>
            <p className="font-black text-[24px] text-slate-800 leading-tight mt-0.5">{kpiStats.activeStaff} Orang</p>
          </div>
        </div>

        <div className="bg-[#FEF8EB] border border-[#FDEECC] rounded-[22px] p-4.5 flex items-center gap-4 shadow-[0_8px_20px_rgba(245,158,11,0.05)]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(245,158,11,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[24px]">folder_managed</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Berkas Ditangani</p>
            <p className="font-black text-[24px] text-slate-800 leading-tight mt-0.5">{kpiStats.totalAssignedCases} Berkas</p>
          </div>
        </div>

        <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-[22px] p-4.5 flex items-center gap-4 shadow-[0_8px_20px_rgba(34,197,94,0.05)]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(56,189,248,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[24px]">monitoring</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Rata-Rata Beban</p>
            <p className="font-black text-[24px] text-slate-800 leading-tight mt-0.5">{kpiStats.avgWorkload} Berkas/Staf</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-[22px] p-4 shadow-[0_10px_30px_rgba(112,144,176,0.06)] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[19px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama staf, jabatan, atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 font-medium transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="text-[12px] font-bold text-slate-500">
          Menampilkan <span className="text-[#6366F1] font-black">{filteredStaffList.length}</span> dari {formattedStaffList.length} staf
        </div>
      </div>

      {/* Full 12-Column Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex flex-col justify-center items-center py-16 bg-white border border-slate-200/80 rounded-[28px]">
            <span className="material-symbols-outlined animate-spin text-[#6366F1] text-[36px]">sync</span>
            <span className="mt-3 text-slate-500 font-bold text-[13px]">Memuat data tim staf...</span>
          </div>
        ) : filteredStaffList.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <span className="material-symbols-outlined text-[32px]">group_off</span>
            </div>
            <h4 className="text-slate-800 font-extrabold text-[16px]">Staf Tidak Ditemukan</h4>
            <p className="text-slate-400 text-[12.5px] mt-1 max-w-sm mx-auto">
              {searchQuery ? `Tidak ada staf dengan kata kunci "${searchQuery}".` : 'Belum ada staf terdaftar di sistem.'}
            </p>
          </div>
        ) : (
          filteredStaffList.map((st) => {
            // Workload Status logic
            let statusBadge = { label: 'Standby', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
            if (st.activeCases > 3) {
              statusBadge = { label: 'Beban Tinggi', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
            } else if (st.activeCases > 0) {
              statusBadge = { label: 'Aktif Pengerjaan', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
            }

            return (
              <div 
                key={st.id} 
                onClick={() => navigate(`/owner/staff/${st.id}`)}
                className="bg-white border border-slate-200/80 rounded-[24px] p-5 flex flex-col justify-between group relative cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:border-[#6366F1]/50 shadow-[0_10px_30px_rgba(112,144,176,0.06)]"
              >
                {/* Top Row: Avatar & Info */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      alt={st.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0"
                      src={st.avatar}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=6366F1&color=fff&bold=true`;
                      }}
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${st.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-extrabold text-slate-800 text-[15.5px] truncate group-hover:text-[#6366F1] transition-colors">
                        {st.name}
                      </h4>
                    </div>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-[#6366F1] border border-indigo-100">
                      {st.role}
                    </span>
                    <p className="text-[11.5px] text-slate-400 mt-1.5 truncate flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">mail</span>
                      {st.email}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Workload Metrics & Controls */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Berkas Aktif</span>
                    <p className="text-[16px] text-slate-800 font-black leading-tight mt-0.5">
                      {st.activeCases} <span className="text-[12px] font-bold text-slate-400">Berkas</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(st.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus / Nonaktifkan Staf"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleInvite} 
            className="bg-white border border-slate-200/80 rounded-[30px] w-full max-w-md p-7 relative shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-left animate-in fade-in zoom-in-95 duration-200 space-y-5"
          >
            <button 
              type="button"
              disabled={submitting}
              onClick={() => setShowInviteModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
              </div>
              <div>
                <h3 className="text-[19px] font-black text-slate-800 tracking-tight">Tambah Staf Baru</h3>
                <p className="text-[12px] text-slate-400 font-medium">Daftarkan anggota staf baru ke sistem Notaris.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Staf
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 font-medium transition-all"
                  placeholder="Contoh: Ani Lestari, S.H."
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alamat Email (Untuk Login)
                </label>
                <input
                  type="email"
                  required
                  disabled={submitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 font-medium transition-all"
                  placeholder="Contoh: staff@notaris.id"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Jabatan / Gelar
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 font-medium transition-all"
                  placeholder="Contoh: Staf Akta Utama, Staf Administrasi"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  required
                  disabled={submitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 font-medium transition-all"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowInviteModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary-3d px-6 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    Menambahkan...
                  </>
                ) : (
                  'Simpan Staf'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-500">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <h3 className="font-extrabold text-slate-800 text-[17px] mb-1">Nonaktifkan Staf Ini?</h3>
            <p className="text-[12.5px] text-slate-500 mb-6 leading-relaxed">
              Akun autentikasi staf akan nonaktif dan tidak dapat mengakses sistem Notaris lagi.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                disabled={deletingId !== null}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteStaff(confirmDeleteId)} 
                disabled={deletingId !== null}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {deletingId ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Memproses...
                  </>
                ) : (
                  'Ya, Nonaktifkan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerStaffManagement;
