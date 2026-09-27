import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useCases } from '../../hooks/useCases';
import toast from 'react-hot-toast';

export const OwnerStaffManagement = () => {
  const { cases } = useCases();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add staff modal state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selected staff details state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffActivities, setStaffActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

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
        .eq('role', 'staff');

      if (profilesError) throw profilesError;

      setStaffList(profilesData || []);
    } catch (err) {
      console.error('Error loading staff list:', err);
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
      const activeCasesCount = cases.filter(c => c.assignedStaffId === p.id && !c.isComplete).length;
      return {
        id: p.id,
        name: p.full_name,
        role: p.title || 'Staf Administrasi',
        email: p.email || 'staf@notaris.id',
        avatar: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        activeCases: activeCasesCount
      };
    });
  }, [staffList, cases]);

  // Fetch activities for selected staff member
  useEffect(() => {
    if (selectedStaff) {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          const { data, error } = await supabase
            .from('activity_logs')
            .select('*, cases(case_number, client_name)')
            .eq('user_id', selectedStaff.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (!error && data) {
            setStaffActivities(data.map(act => ({
              id: act.id,
              action: act.action,
              target: act.cases ? `${act.cases.client_name} (${act.cases.case_number})` : 'Sistem',
              timestamp: new Date(act.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              icon: act.icon || 'history',
              category: act.category ? act.category.toUpperCase() : 'PPAT'
            })));
          } else {
            setStaffActivities([]);
          }
        } catch (err) {
          console.error(err);
          setStaffActivities([]);
        } finally {
          setLoadingActivities(false);
        }
      };
      fetchActivities();
    } else {
      setStaffActivities([]);
    }
  }, [selectedStaff]);

  // Derive cases assigned to selected staff member from Cases Context
  const selectedStaffCases = useMemo(() => {
    if (!selectedStaff) return { ongoing: [], completed: [] };
    const staffCases = cases.filter(c => c.assignedStaffId === selectedStaff.id);
    return {
      ongoing: staffCases.filter(c => !c.isComplete),
      completed: staffCases.filter(c => c.isComplete)
    };
  }, [cases, selectedStaff]);

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, role: 'staff', title: role }
        }
      });
      if (authError) throw authError;

      if (authData?.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: name,
          role: 'staff',
          title: role,
          email: email,
          is_active: true
        });
      }

      toast.success(`Staf ${name} berhasil ditambahkan!`);
      setName('');
      setEmail('');
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
      const { error: delError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (delError) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', id);
        if (updateError) throw updateError;
        toast.success('Akun staf berhasil dinonaktifkan.');
      } else {
        toast.success('Profil staf berhasil dihapus.');
      }

      if (selectedStaff?.id === id) setSelectedStaff(null);
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
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Staff Management</h2>
          <p className="text-body-lg text-on-surface-variant mt-1">Manage office staff credentials, workloads, and real-time activity logs.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-primary text-on-primary font-label-bold py-2.5 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 font-bold text-[13px] shadow-sm animate-fade-in"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Tambah Staf
        </button>
      </div>

      {/* Main 2-column layout: staff grid + staff detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-grid">
        {/* Left Column: Staff Cards Grid */}
        <div className={`${selectedStaff ? 'lg:col-span-7' : 'lg:col-span-12'} grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start`}>
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
              <span className="ml-2 text-on-surface-variant font-medium">Memuat data staf...</span>
            </div>
          ) : formattedStaffList.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 card-shadow">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">group_off</span>
              <p className="text-on-surface-variant font-bold">Belum ada staf terdaftar di database.</p>
              <p className="text-on-surface-variant text-[12px] mt-1">Tekan tombol 'Tambah Staf' untuk mendaftarkan staf baru.</p>
            </div>
          ) : (
            formattedStaffList.map((st) => {
              const isSelected = selectedStaff?.id === st.id;
              return (
                <div 
                  key={st.id} 
                  onClick={() => setSelectedStaff(isSelected ? null : st)}
                  className={`bg-surface-container-lowest border p-card-padding rounded-xl flex flex-col justify-between group relative cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-primary shadow-md' : 'border-outline-variant'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      alt={st.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary-container"
                      src={st.avatar}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface text-[15px] truncate">{st.name}</h4>
                      <p className="text-[12px] text-primary font-semibold mt-0.5">{st.role}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1 truncate">{st.email}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Aktif</span>
                      <p className="font-headline-sm text-[15px] text-on-surface font-extrabold mt-0.5">{st.activeCases} Berkas</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        st.activeCases > 2 
                          ? 'bg-error-container text-on-error-container' 
                          : st.activeCases > 0 
                          ? 'bg-secondary-container text-on-secondary-container' 
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {st.activeCases > 2 ? 'Penuh' : st.activeCases > 0 ? 'Aktif' : 'Standby'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(st.id);
                        }}
                        className="p-1 hover:text-error text-on-surface-variant rounded transition-colors"
                        title="Hapus Staf"
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

        {/* Right Column: Staff Detail Panel */}
        {selectedStaff && (
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200 self-start">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img
                  alt={selectedStaff.name}
                  className="w-14 h-14 rounded-full object-cover border"
                  src={selectedStaff.avatar}
                />
                <div>
                  <h3 className="font-bold text-on-surface text-[16px]">{selectedStaff.name}</h3>
                  <p className="text-primary text-[11px] font-semibold">{selectedStaff.role}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{selectedStaff.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)} 
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container-low rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Sedang Dikerjakan</p>
                <p className="font-extrabold text-primary text-[18px] mt-0.5">
                  {selectedStaffCases.ongoing.length} Berkas
                </p>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Telah Selesai</p>
                <p className="font-extrabold text-secondary text-[18px] mt-0.5">
                  {selectedStaffCases.completed.length} Berkas
                </p>
              </div>
            </div>

            {/* List of Ongoing Cases */}
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">Berkas yang Sedang Dikerjakan</p>
              {selectedStaffCases.ongoing.length === 0 ? (
                <p className="text-[12px] text-on-surface-variant italic bg-surface-container-low p-2 rounded text-center">Tidak ada berkas aktif.</p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {selectedStaffCases.ongoing.map(c => (
                    <div key={c.id} className="bg-surface-container-low p-2 rounded flex justify-between items-center text-[12px]">
                      <div>
                        <p className="font-bold text-primary">{c.caseNumber}</p>
                        <p className="text-on-surface-variant font-medium text-[11px] truncate max-w-[150px]">{c.clientName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-primary/10 text-primary font-bold uppercase">{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of Completed Cases */}
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">Berkas yang Telah Selesai</p>
              {selectedStaffCases.completed.length === 0 ? (
                <p className="text-[12px] text-on-surface-variant italic bg-surface-container-low p-2 rounded text-center">Belum ada berkas selesai.</p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {selectedStaffCases.completed.map(c => (
                    <div key={c.id} className="bg-surface-container-low p-2 rounded flex justify-between items-center text-[12px]">
                      <div>
                        <p className="font-bold text-secondary">{c.caseNumber}</p>
                        <p className="text-on-surface-variant font-medium text-[11px] truncate max-w-[150px]">{c.clientName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-secondary/15 text-secondary font-bold uppercase">Selesai</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real-time Activity Timeline */}
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3">Log Aktivitas Terbaru</p>
              {loadingActivities ? (
                <div className="flex items-center justify-center py-4">
                  <span className="material-symbols-outlined animate-spin text-primary text-[20px] mr-2">sync</span>
                  <span className="text-[12px] text-on-surface-variant">Memuat aktivitas...</span>
                </div>
              ) : staffActivities.length === 0 ? (
                <p className="text-[12px] text-on-surface-variant italic bg-surface-container-low p-2 rounded text-center">Belum ada aktivitas terekam.</p>
              ) : (
                <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-outline-variant max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                  {staffActivities.map(act => (
                    <div key={act.id} className="relative text-[12px] text-left">
                      <div className="absolute -left-[18px] top-1.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>
                      <p className="text-on-surface font-semibold leading-snug">
                        {act.action}
                      </p>
                      <p className="text-[10.5px] text-primary font-bold mt-0.5">
                        {act.target}
                      </p>
                      <p className="text-[9.5px] text-on-surface-variant mt-0.5">
                        {act.timestamp}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite/Add Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleInvite} className="bg-surface-container-lowest border border-outline-variant rounded-xl w-full max-w-md p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
            <button 
              type="button"
              disabled={submitting}
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            <h3 className="font-headline-sm text-headline-sm font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">person_add</span>
              Tambah Staf Baru
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-label-bold text-on-surface mb-1.5 text-[11px] font-bold">NAMA LENGKAP STAF</label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-[13px] focus:ring-primary focus:border-primary"
                  placeholder="Contoh: Ani Lestari, S.H."
                />
              </div>

              <div>
                <label className="block font-label-bold text-on-surface mb-1.5 text-[11px] font-bold">ALAMAT EMAIL</label>
                <input
                  type="email"
                  required
                  disabled={submitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-[13px] focus:ring-primary focus:border-primary"
                  placeholder="Contoh: staff@notaris.id"
                />
              </div>

              <div>
                <label className="block font-label-bold text-on-surface mb-1.5 text-[11px] font-bold">JABATAN / PERAN</label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-[13px] focus:ring-primary focus:border-primary"
                  placeholder="Contoh: Staf Akta Utama, Staf Administrasi, dll."
                />
              </div>

              <div>
                <label className="block font-label-bold text-on-surface mb-1.5 text-[11px] font-bold">KATA SANDI</label>
                <input
                  type="password"
                  required
                  disabled={submitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-[13px] focus:ring-primary focus:border-primary"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-bold hover:opacity-90 active:scale-[0.98] transition-all font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Menambahkan...
                </>
              ) : (
                'Tambahkan Staf'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-sm w-full shadow-xl text-center">
            <span className="material-symbols-outlined text-error text-[40px] mb-3">delete_forever</span>
            <h3 className="font-bold text-on-surface text-[16px] mb-2 font-headline-sm">Hapus Staf Permanen?</h3>
            <p className="text-[13px] text-on-surface-variant mb-6 leading-relaxed">
              Tindakan ini akan menghapus akun autentikasi dan profil staf dari database secara permanen.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                disabled={deletingId !== null}
                className="flex-1 py-2.5 border border-outline-variant rounded-lg text-[13px] font-bold hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteStaff(confirmDeleteId)} 
                disabled={deletingId !== null}
                className="flex-1 py-2.5 bg-error text-on-error rounded-lg text-[13px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {deletingId ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Hapus...
                  </>
                ) : (
                  'Hapus'
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
