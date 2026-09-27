import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { SERVICE_TYPES } from '../../constants/serviceTypes';

import DateFilter from '../../components/common/DateFilter';

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

  // Render Owner View (Card-based)
  if (profile?.role === 'owner') {
    return (
      <div className="space-y-stack-lg text-left font-sans animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold text-[26px]">Aktivitas Kerja Staf</h2>
            <p className="text-body-lg text-on-surface-variant mt-1 text-[13px]">Pantau ringkasan dan riwayat seluruh aktivitas operasional staf secara real-time.</p>
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
          <div className="flex justify-center items-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
            <span className="ml-2 text-on-surface-variant font-medium">Memuat riwayat aktivitas...</span>
          </div>
        ) : staffCardsData.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 card-shadow">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">history</span>
            <p className="text-on-surface-variant font-bold">Belum ada staf terdaftar atau aktivitas terekam.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-grid">
            {staffCardsData.map((st) => (
              <div 
                key={st.id}
                onClick={() => setSelectedStaff(st)}
                className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-[16px] overflow-hidden">
                      {st.avatarUrl ? (
                        <img src={st.avatarUrl} alt={st.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(st.name)
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface text-[15px] group-hover:text-primary transition-colors">{st.name}</h4>
                      <p className="text-[12px] text-on-surface-variant font-medium">{st.title}</p>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-lg flex justify-between items-center text-[12px]">
                    <span className="text-on-surface-variant font-medium">Total Aktivitas</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{st.totalActivities} Tindakan</span>
                  </div>

                  <div className="text-[11.5px] leading-relaxed text-on-surface-variant">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-primary block mb-1">Terakhir Aktif</span>
                    <p className="line-clamp-2 italic">"{st.lastActive}"</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center text-primary font-bold text-[12px]">
                  <span>Lihat Selengkapnya</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Detail Aktivitas Staf */}
        {selectedStaff && (
          <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl w-full max-w-lg p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <button 
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden">
                  {selectedStaff.avatarUrl ? (
                    <img src={selectedStaff.avatarUrl} alt={selectedStaff.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedStaff.name)
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-[17px]">{selectedStaff.name}</h3>
                  <p className="text-[12px] text-primary font-semibold">{selectedStaff.title}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Seluruh Riwayat Aktivitas</p>
                
                {selectedStaff.logs.length === 0 ? (
                  <p className="text-[13px] text-on-surface-variant italic text-center py-8">Belum ada aktivitas terekam dari staf ini.</p>
                ) : (
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant">
                    {selectedStaff.logs.map((act) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-body-md text-on-surface font-bold text-[13px]">
                              {act.action}
                            </p>
                            <p className="text-[11px] text-primary font-semibold mt-0.5">
                              {act.target}
                            </p>
                            <p className="text-[10px] text-on-surface-variant mt-1">
                              {act.timestamp}
                            </p>
                          </div>
                          <div className="p-1.5 bg-surface-container-high rounded text-on-surface-variant">
                            <span className="material-symbols-outlined text-[16px]">{act.icon}</span>
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
    <div className="space-y-stack-lg text-left font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold text-[26px]">Aktivitas Kerja Saya</h2>
          <p className="text-body-lg text-on-surface-variant mt-1 text-[13px]">Tinjau seluruh riwayat pengerjaan dokumen yang Anda lakukan.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Tindakan', value: myStats.total, icon: 'history', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Penyelesaian Akta', value: myStats.completed, icon: 'check_circle', color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Unggah Berkas', value: myStats.upload, icon: 'upload_file', color: 'text-tertiary', bg: 'bg-tertiary/10' },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
              <span className={`material-symbols-outlined ${card.color} text-[22px]`}>{card.icon}</span>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{card.label}</p>
              <p className={`font-extrabold text-[20px] mt-0.5 ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas atau nama berkas..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[13px] focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Action Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-[12px] font-bold text-on-surface-variant"
          >
            <option value="Semua">Semua Tipe</option>
            <option value="Upload">Upload File</option>
            <option value="Tanda Tangan">Tanda Tangan</option>
            <option value="Verifikasi">Verifikasi</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Timeline Layout */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
          <span className="ml-2 text-on-surface-variant font-medium">Memuat riwayat aktivitas...</span>
        </div>
      ) : filteredMyLogs.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 card-shadow">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">history</span>
          <p className="text-on-surface-variant font-bold">Tidak ada aktivitas ditemukan.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant">
            {filteredMyLogs.map((act) => (
              <div key={act.id} className="relative">
                <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-body-md text-on-surface font-bold text-[13px] flex items-center gap-2">
                      Anda
                      <span className="font-normal text-on-surface-variant">{act.action}</span>
                    </p>
                    <p className="text-[11px] text-primary font-semibold mt-0.5">
                      {act.target}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {act.timestamp}
                    </p>
                  </div>
                  
                  <div className="p-1.5 bg-surface-container-high rounded text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">{act.icon}</span>
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
