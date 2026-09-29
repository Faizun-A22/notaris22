import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { SERVICE_TYPES } from '../../constants/serviceTypes';
import DateFilter from '../../components/common/DateFilter';
import { 
  Activity, 
  CheckCircle2, 
  UploadCloud, 
  FileEdit, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  ArrowRight, 
  X, 
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

export const StaffActivityPage = () => {
  const { user, profile } = useAuth();
  
  // Database logs state
  const [logs, setLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states (for Staff view)
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterService, setFilterService] = useState('Semua');
  const [filterType, setFilterType] = useState('Semua');
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');

  // Selected staff for Owner detail modal
  const [selectedStaff, setSelectedStaff] = useState(null);

  const fetchLogsAndStaff = async () => {
    setLoading(true);
    try {
      // 1. Fetch all activity logs from DB
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*, cases(case_number, client_name, service_type)')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      const mappedLogs = (logsData || []).map(act => {
        // Map icon to type
        let actionType = 'Verifikasi';
        if (act.icon === 'upload_file' || act.icon === 'cloud_upload') {
          actionType = 'Upload';
        } else if (act.icon === 'draw') {
          actionType = 'Tanda Tangan';
        } else if (act.icon === 'check_circle') {
          actionType = 'Selesai';
        }

        return {
          id: act.id,
          user: act.user_name || 'Sistem',
          user_id: act.user_id,
          role: act.user_role === 'staff' ? 'Staf Administrasi' : 'Ketua Notaris',
          category: act.category ? act.category.toUpperCase() : 'PPAT',
          action: act.action,
          target: act.cases ? `${act.cases.client_name} (${act.cases.case_number})` : 'Sistem',
          timestamp: new Date(act.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
          rawDate: new Date(act.created_at),
          icon: act.icon || 'history',
          type: actionType,
          serviceType: act.cases?.service_type || 'SKMHT'
        };
      });

      setLogs(mappedLogs);

      // 2. Fetch all staff members if current user is owner
      if (profile?.role === 'owner') {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'staff');

        if (profilesError) throw profilesError;
        setStaffList(profilesData || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchLogsAndStaff();
    }
  }, [user, profile]);

  // Filter logs dynamically by selected period
  const dateFilteredLogs = useMemo(() => {
    return logs.filter((a) => {
      if (!a.rawDate) return false;
      const cDay = a.rawDate.getDate();
      const cMonth = a.rawDate.getMonth() + 1;
      const cYear = a.rawDate.getFullYear();

      if (filterYear !== 'ALL' && cYear !== parseInt(filterYear, 10)) return false;
      if (filterMonth !== 'ALL' && cMonth !== parseInt(filterMonth, 10)) return false;
      if (filterDate !== 'ALL' && cDay !== parseInt(filterDate, 10)) return false;

      return true;
    });
  }, [logs, filterDate, filterMonth, filterYear]);

  // Filter logs for logged in staff (self-only)
  const myLogs = useMemo(() => {
    if (profile?.role === 'staff') {
      return dateFilteredLogs.filter(l => l.user_id === user?.id);
    }
    return dateFilteredLogs;
  }, [dateFilteredLogs, user, profile]);

  // Apply filters to Staff view logs
  const filteredMyLogs = useMemo(() => {
    return myLogs.filter((a) => {
      const matchType = filterType === 'Semua' || a.type === filterType;
      const matchCategory = filterCategory === 'Semua' || a.category === filterCategory;
      const matchService = filterService === 'Semua' || a.serviceType === filterService;
      
      const matchSearch =
        a.action.toLowerCase().includes(search.toLowerCase()) ||
        a.target.toLowerCase().includes(search.toLowerCase()) ||
        a.user.toLowerCase().includes(search.toLowerCase());
        
      return matchType && matchCategory && matchService && matchSearch;
    });
  }, [myLogs, filterType, filterCategory, filterService, search]);

  // Group logs by staff for Owner view
  const staffCardsData = useMemo(() => {
    if (profile?.role !== 'owner') return [];
    return staffList.map(st => {
      const staffLogs = dateFilteredLogs.filter(l => l.user_id === st.id);
      const lastActiveLog = staffLogs[0] || null;

      return {
        id: st.id,
        name: st.full_name,
        title: st.title || 'Staf Administrasi',
        avatarUrl: st.avatar_url,
        totalActivities: staffLogs.length,
        lastActive: lastActiveLog 
          ? `${lastActiveLog.action} pada berkas ${lastActiveLog.target} (${lastActiveLog.timestamp})` 
          : 'Belum ada aktivitas terekam.',
        logs: staffLogs
      };
    });
  }, [staffList, dateFilteredLogs, profile]);

  // Calculate statistics for staff view
  const myStats = useMemo(() => {
    return {
      total: myLogs.length,
      completed: myLogs.filter(l => l.type === 'Selesai').length,
      upload: myLogs.filter(l => l.type === 'Upload').length
    };
  }, [myLogs]);

  // Avatar initials helper
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'Upload':
        return <UploadCloud className="w-4 h-4 text-[#6366F1]" />;
      case 'Tanda Tangan':
        return <FileEdit className="w-4 h-4 text-[#F59E0B]" />;
      case 'Selesai':
        return <CheckCircle2 className="w-4 h-4 text-[#10B981]" />;
      default:
        return <Activity className="w-4 h-4 text-[#3B82F6]" />;
    }
  };

  // Render Owner View (Card-based)
  if (profile?.role === 'owner') {
    return (
      <div className="space-y-6 text-left font-sans animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <span>Aktivitas Kerja Staf</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#6366F1] border border-[#E0E7FF]">
                Real-Time
              </span>
            </h1>
            <p className="text-[13px] text-slate-400 font-medium mt-1">
              Pantau ringkasan performa dan riwayat seluruh aktivitas operasional tim staf secara terpusat.
            </p>
          </div>
          <DateFilter
            date={filterDate}
            month={filterMonth}
            year={filterYear}
            onDateChange={setFilterDate}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-9 h-9 border-3 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-500 font-bold text-sm">Memuat aktivitas staf...</span>
          </div>
        ) : staffCardsData.length === 0 ? (
          <div className="text-center py-16 soft-card p-8">
            <div className="w-16 h-16 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[inset_0_2px_4px_rgba(99,102,241,0.1)]">
              <Activity className="w-8 h-8 text-[#6366F1]" />
            </div>
            <h3 className="font-extrabold text-slate-700 text-base">Belum Ada Riwayat Aktivitas</h3>
            <p className="text-slate-400 text-xs mt-1">Belum ada staf terdaftar atau aktivitas baru yang terekam dalam periode ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {staffCardsData.map((st) => (
              <div 
                key={st.id}
                onClick={() => setSelectedStaff(st)}
                className="soft-card p-6 cursor-pointer hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center text-white font-black text-[15px] overflow-hidden shadow-[0_6px_16px_rgba(99,102,241,0.3)] shrink-0">
                      {st.avatarUrl ? (
                        <img src={st.avatarUrl} alt={st.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(st.name)
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-[15px] group-hover:text-[#6366F1] transition-colors">{st.name}</h4>
                      <p className="text-[12px] text-slate-400 font-semibold">{st.title}</p>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] border border-slate-100 p-3.5 rounded-2xl flex justify-between items-center text-[12px]">
                    <span className="text-slate-500 font-semibold">Total Log Aksi</span>
                    <span className="badge-3d-purple px-3 py-1 text-xs">
                      {st.totalActivities} Tindakan
                    </span>
                  </div>

                  <div className="text-[12px] leading-relaxed text-slate-500 bg-[#FAFAFA] p-3 rounded-2xl border border-slate-100">
                    <span className="font-black text-[10px] uppercase tracking-wider text-[#6366F1] block mb-1">
                      Aktivitas Terakhir
                    </span>
                    <p className="line-clamp-2 italic text-slate-600 font-medium">"{st.lastActive}"</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-[#6366F1] font-bold text-[12.5px]">
                  <span>Lihat Seluruh Log</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Detail Aktivitas Staf */}
        {selectedStaff && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[28px] w-full max-w-lg p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-left animate-fade-in flex flex-col max-h-[90vh]">
              <button 
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                <div className="w-13 h-13 bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center text-white font-black shadow-md overflow-hidden">
                  {selectedStaff.avatarUrl ? (
                    <img src={selectedStaff.avatarUrl} alt={selectedStaff.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedStaff.name)
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">{selectedStaff.name}</h3>
                  <p className="text-[12px] text-[#6366F1] font-bold">{selectedStaff.title}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Riwayat Aktivitas ({selectedStaff.logs.length})</p>
                </div>
                
                {selectedStaff.logs.length === 0 ? (
                  <p className="text-[13px] text-slate-400 italic text-center py-8">Belum ada aktivitas terekam dari staf ini.</p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                    {selectedStaff.logs.map((act) => (
                      <div key={act.id} className="relative group">
                        <div className="absolute -left-[20px] top-1.5 w-3.5 h-3.5 bg-[#6366F1] rounded-full border-2 border-white shadow-xs"></div>
                        <div className="bg-[#F8FAFC] border border-slate-100 hover:border-[#6366F1]/30 p-3 rounded-2xl flex justify-between items-start transition-all">
                          <div>
                            <p className="text-slate-800 font-bold text-[13px]">
                              {act.action}
                            </p>
                            <p className="text-[11.5px] text-[#6366F1] font-semibold mt-0.5">
                              {act.target}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {act.timestamp}
                            </p>
                          </div>
                          <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100">
                            {getActionIcon(act.type)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Staff View (Table & Timeline for self-only)
  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <span>Aktivitas Kerja Saya</span>
            <span className="badge-3d-mint px-2.5 py-0.5 text-xs">
              Personal
            </span>
          </h1>
          <p className="text-[13px] text-slate-400 font-medium mt-1">
            Tinjau seluruh riwayat pengerjaan berkas, unggahan dokumen, dan verifikasi yang Anda lakukan.
          </p>
        </div>
        <DateFilter
          date={filterDate}
          month={filterMonth}
          year={filterYear}
          onDateChange={setFilterDate}
          onMonthChange={setFilterMonth}
          onYearChange={setFilterYear}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="soft-card-purple p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
            <Activity className="w-6 h-6 text-[#6366F1]" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-[#6366F1] uppercase tracking-wider">Total Tindakan</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{myStats.total}</p>
          </div>
        </div>

        <div className="soft-card-mint p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-[#10B981] uppercase tracking-wider">Penyelesaian Berkas</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{myStats.completed}</p>
          </div>
        </div>

        <div className="soft-card-amber p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
            <UploadCloud className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-[#F59E0B] uppercase tracking-wider">Unggah Dokumen</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{myStats.upload}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="soft-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas, klien, atau nomor berkas..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Action Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl px-3.5 py-2.5 text-[12px] font-bold text-slate-600 focus:outline-none focus:border-[#6366F1] focus:bg-white transition-all"
          >
            <option value="Semua">Semua Jenis Aksi</option>
            <option value="Upload">Unggah Berkas</option>
            <option value="Tanda Tangan">Tanda Tangan</option>
            <option value="Verifikasi">Verifikasi</option>
            <option value="Selesai">Penyelesaian</option>
          </select>
        </div>
      </div>

      {/* Timeline Layout */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-9 h-9 border-3 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-500 font-bold text-sm">Memuat riwayat aktivitas...</span>
        </div>
      ) : filteredMyLogs.length === 0 ? (
        <div className="text-center py-16 soft-card p-8">
          <div className="w-16 h-16 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Activity className="w-8 h-8 text-[#6366F1]" />
          </div>
          <h3 className="font-extrabold text-slate-700 text-base">Tidak Ada Aktivitas Ditemukan</h3>
          <p className="text-slate-400 text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter tanggal Anda.</p>
        </div>
      ) : (
        <div className="soft-card p-6">
          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            {filteredMyLogs.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-[20px] top-2 w-3.5 h-3.5 bg-[#6366F1] rounded-full border-2 border-white shadow-xs"></div>
                <div className="bg-[#F8FAFC] border border-slate-100 hover:border-[#6366F1]/30 p-4 rounded-2xl flex justify-between items-center transition-all hover:bg-white hover:shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-[13.5px]">Anda</span>
                      <span className="text-[13px] text-slate-600 font-medium">{act.action}</span>
                    </div>
                    <p className="text-[12px] text-[#6366F1] font-bold mt-1">
                      {act.target}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {act.timestamp}
                    </p>
                  </div>
                  
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100">
                    {getActionIcon(act.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffActivityPage;
