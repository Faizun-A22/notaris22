import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCases } from '../../hooks/useCases';
import toast from 'react-hot-toast';

export const OwnerStaffDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases } = useCases();

  const [staff, setStaff] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [caseFilter, setCaseFilter] = useState('all'); // 'all' | 'ongoing' | 'completed'

  // Delete staff confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch Staff Profile
  useEffect(() => {
    const fetchStaffProfile = async () => {
      setLoadingStaff(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setStaff(data);
      } catch (err) {
        console.error('Error fetching staff profile:', err);
        toast.error('Gagal memuat profil staf');
      } finally {
        setLoadingStaff(false);
      }
    };

    if (id) fetchStaffProfile();
  }, [id]);

  // Fetch Staff Activity Logs
  useEffect(() => {
    const fetchActivities = async () => {
      setLoadingActivities(true);
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*, cases(case_number, client_name)')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          setActivities(data.map(act => ({
            id: act.id,
            action: act.action,
            target: act.cases ? `${act.cases.client_name} (${act.cases.case_number})` : 'Sistem',
            timestamp: new Date(act.created_at).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            icon: act.icon || 'history',
            category: act.category ? act.category.toUpperCase() : 'PPAT'
          })));
        } else {
          setActivities([]);
        }
      } catch (err) {
        console.error('Error fetching staff activities:', err);
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    if (id) fetchActivities();
  }, [id]);

  // Derive cases assigned to this staff member
  const staffCases = useMemo(() => {
    return cases.filter(c => c.assignedStaffId === id);
  }, [cases, id]);

  const ongoingCases = useMemo(() => staffCases.filter(c => !c.isComplete), [staffCases]);
  const completedCases = useMemo(() => staffCases.filter(c => c.isComplete), [staffCases]);

  const filteredCases = useMemo(() => {
    if (caseFilter === 'ongoing') return ongoingCases;
    if (caseFilter === 'completed') return completedCases;
    return staffCases;
  }, [staffCases, ongoingCases, completedCases, caseFilter]);

  const completionRate = useMemo(() => {
    if (staffCases.length === 0) return 100;
    return Math.round((completedCases.length / staffCases.length) * 100);
  }, [staffCases, completedCases]);

  const handleDeactivate = async () => {
    setDeleting(true);
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
      navigate('/owner/staff');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menonaktifkan staf: ' + err.message);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loadingStaff) {
    return (
      <div className="min-h-[400px] flex flex-col justify-center items-center py-20 text-center">
        <span className="material-symbols-outlined animate-spin text-[#6366F1] text-[40px]">sync</span>
        <p className="mt-3 text-slate-500 font-bold text-[14px]">Memuat detail performa staf...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-[56px] text-slate-300">person_off</span>
        <h3 className="text-slate-800 font-extrabold text-[18px]">Staf Tidak Ditemukan</h3>
        <button
          onClick={() => navigate('/owner/staff')}
          className="btn-primary-3d px-5 py-2.5 rounded-xl font-bold text-[13px]"
        >
          Kembali ke Kelola Staf
        </button>
      </div>
    );
  }

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name || 'Staf')}&background=6366F1&color=fff&bold=true`;
  const avatarUrl = staff.avatar_url || defaultAvatar;

  return (
    <div className="space-y-stack-lg text-left animate-in fade-in duration-300">
      
      {/* Top Navigation & Profile Header Banner */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/owner/staff')}
          className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-[#6366F1] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Manajemen Staf</span>
        </button>

        {/* Profile Card Header */}
        <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 sm:p-7 shadow-[0_10px_35px_rgba(112,144,176,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <img
                alt={staff.full_name}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl object-cover border-4 border-indigo-50 shadow-md shrink-0"
                src={avatarUrl}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
              />
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white ${staff.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline-lg text-[22px] sm:text-[26px] text-slate-800 font-black tracking-tight">
                  {staff.full_name}
                </h2>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-[#6366F1] border border-indigo-100">
                  {staff.title || 'Staf Administrasi'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[12.5px] text-slate-500 font-medium mt-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                  {staff.email || 'staf@notaris.id'}
                </span>
                {staff.phone && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                    {staff.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                  Terdaftar sejak {new Date(staff.created_at || Date.now()).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-2xl text-[12.5px] font-extrabold flex items-center gap-2 transition-colors cursor-pointer self-stretch sm:self-auto justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span>Nonaktifkan Staf</span>
          </button>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-[#F3F2FD] border border-[#E4E2FB] rounded-[22px] p-5 flex items-center gap-4 shadow-[0_8px_20px_rgba(99,102,241,0.05)]">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(99,102,241,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[26px]">folder_open</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Sedang Dikerjakan</p>
            <p className="font-black text-[26px] text-slate-800 leading-tight mt-0.5">{ongoingCases.length} Berkas</p>
          </div>
        </div>

        <div className="bg-[#EDFAF3] border border-[#D5F5E4] rounded-[22px] p-5 flex items-center gap-4 shadow-[0_8px_20px_rgba(16,185,129,0.05)]">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[26px]">task_alt</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Telah Selesai</p>
            <p className="font-black text-[26px] text-slate-800 leading-tight mt-0.5">{completedCases.length} Berkas</p>
          </div>
        </div>

        <div className="bg-[#FEF8EB] border border-[#FDEECC] rounded-[22px] p-5 flex items-center gap-4 shadow-[0_8px_20px_rgba(245,158,11,0.05)]">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(245,158,11,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[26px]">assignment</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Penugasan</p>
            <p className="font-black text-[26px] text-slate-800 leading-tight mt-0.5">{staffCases.length} Berkas</p>
          </div>
        </div>

        <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-[22px] p-5 flex items-center gap-4 shadow-[0_8px_20px_rgba(34,197,94,0.05)]">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(56,189,248,0.3)] shrink-0">
            <span className="material-symbols-outlined text-[26px]">percent</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tingkat Penyelesaian</p>
            <p className="font-black text-[26px] text-slate-800 leading-tight mt-0.5">{completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Cases List (Left 7 Cols) + Activity Timeline (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Assigned Cases Table / Card List */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(112,144,176,0.06)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-[18px]">Daftar Berkas Ditangani</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-0.5">Daftar seluruh berkas akta yang ditugaskan ke {staff.full_name}.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-[11.5px] font-bold text-slate-500 self-start sm:self-auto">
              <button
                onClick={() => setCaseFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${caseFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-extrabold' : 'hover:text-slate-800'}`}
              >
                Semua ({staffCases.length})
              </button>
              <button
                onClick={() => setCaseFilter('ongoing')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${caseFilter === 'ongoing' ? 'bg-white text-slate-800 shadow-xs font-extrabold' : 'hover:text-slate-800'}`}
              >
                Aktif ({ongoingCases.length})
              </button>
              <button
                onClick={() => setCaseFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${caseFilter === 'completed' ? 'bg-white text-slate-800 shadow-xs font-extrabold' : 'hover:text-slate-800'}`}
              >
                Selesai ({completedCases.length})
              </button>
            </div>
          </div>

          {filteredCases.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6">
              <span className="material-symbols-outlined text-[40px] text-slate-300 mb-2">folder_off</span>
              <p className="text-slate-700 font-bold text-[13.5px]">Tidak Ada Berkas Ditemukan</p>
              <p className="text-slate-400 text-[12px] mt-0.5">Belum ada berkas dalam kategori ini untuk staf ini.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#F8FAFC] border border-slate-200/70 hover:border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-white hover:shadow-xs group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-[#6366F1] text-[14px]">{c.caseNumber}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-600 uppercase border border-indigo-100">
                        {c.serviceType || 'SKMHT'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-[14px] mt-1 truncate">{c.clientName}</h4>
                    <p className="text-[11.5px] text-slate-400 font-medium mt-0.5">
                      Masuk: {c.entryDate || '-'} &bull; Lokasi: {c.propertyLocation || '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                    <span className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border ${
                      c.isComplete
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {c.isComplete ? 'Selesai' : c.status}
                    </span>

                    <Link
                      to={`/staff/documents/${c.id}`}
                      className="p-2 text-slate-400 hover:text-[#6366F1] hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Lihat Detail Berkas"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Real-time Activity Timeline */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(112,144,176,0.06)] space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-[18px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6366F1]">history</span>
              Log Aktivitas Staf
            </h3>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">Riwayat aktivitas pengerjaan berkas secara real-time.</p>
          </div>

          {loadingActivities ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-[#6366F1] text-[24px] mr-2">sync</span>
              <span className="text-[13px] text-slate-400 font-bold">Memuat histori aktivitas...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6">
              <span className="material-symbols-outlined text-[40px] text-slate-300 mb-2">history_toggle_off</span>
              <p className="text-slate-700 font-bold text-[13.5px]">Belum Ada Aktivitas Terekam</p>
              <p className="text-slate-400 text-[12px] mt-0.5">Staf ini belum melakukan perubahan berkas di sistem.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 max-h-[520px] overflow-y-auto custom-scrollbar pr-2">
              {activities.map(act => (
                <div key={act.id} className="relative text-[12.5px] text-left">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 bg-[#6366F1] rounded-full ring-4 ring-indigo-50 border-2 border-white"></div>
                  <p className="text-slate-800 font-extrabold leading-snug">
                    {act.action}
                  </p>
                  <p className="text-[11.5px] text-[#6366F1] font-bold mt-0.5">
                    {act.target}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {act.timestamp}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Staff Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-500">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <h3 className="font-extrabold text-slate-800 text-[17px] mb-1">Nonaktifkan Staf Ini?</h3>
            <p className="text-[12.5px] text-slate-500 mb-6 leading-relaxed">
              Akun <strong className="text-slate-700">{staff.full_name}</strong> akan dinonaktifkan dan tidak dapat login kembali.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleDeactivate} 
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
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

export default OwnerStaffDetailPage;
