import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCases } from '../../../hooks/useCases';
import { formatDate } from '../../../utils/formatDate';
import { checkOverdue } from '../../../utils/checkOverdue';
import { SERVICE_TYPES } from '../../../constants/serviceTypes';

export const CaseTable = ({ searchVal = '', casesList }) => {
  const { cases: allCases, updateCaseStatus, deleteCase } = useCases();
  const cases = casesList || allCases;
  const navigate = useNavigate();

  // Filters State
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Derive unique service types from cases for filter option
  const serviceTypeOptions = useMemo(() => {
    const types = new Set(cases.map(c => c.serviceType));
    return Array.from(types);
  }, [cases]);

  // Client Avatar Initials and Styling Generator
  const getAvatarStyle = (name) => {
    let initials = 'US';
    let colorClass = 'bg-blue-100 text-blue-800';

    if (!name) return { initials, colorClass };

    if (name.startsWith('PT.')) {
      initials = 'PT';
      colorClass = 'bg-blue-100 text-blue-800';
    } else if (name.startsWith('CV.')) {
      initials = 'CV';
      colorClass = 'bg-[#ECFDF5] text-emerald-800';
    } else {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = name.substring(0, 2).toUpperCase();
      }

      // Assign deterministic color based on sum of char codes
      const charCodeSum = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
      const mod = charCodeSum % 3;
      if (mod === 0) {
        colorClass = 'bg-[#FDF2F8] text-pink-700';
      } else if (mod === 1) {
        colorClass = 'bg-[#F5F3FF] text-purple-700';
      } else {
        colorClass = 'bg-[#ECFEFF] text-cyan-700';
      }
    }

    return { initials, colorClass };
  };

  // Progress Bar Details Mapper based on Screenshot
  const getProgressDetails = (c, isOverdue) => {
    if (isOverdue) {
      if (c.serviceType === 'SKMHT' || c.serviceType === 'HT') {
        return { label: 'Validation Stalled', barWidth: '60%', colorClass: 'bg-error', textClass: 'text-error' };
      }
      return { label: 'Registration Blocked', barWidth: '85%', colorClass: 'bg-error', textClass: 'text-error' };
    }

    switch (c.status) {
      case 'Pemeriksaan Dokumen':
        return { label: 'Verification 15%', barWidth: '15%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
      case 'Verifikasi Sertifikat':
        return { label: 'Tax Check 25%', barWidth: '25%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
      case 'Penyusunan Draf':
        return { label: 'Drafting 40%', barWidth: '40%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
      case 'Tanda Tangan Akta':
        return { label: 'Signing 90%', barWidth: '90%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
      case 'Validasi Pajak':
        return { label: 'Validation 60%', barWidth: '60%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
      case 'Proses BPN':
        return { label: 'BPN Process 75%', barWidth: '75%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
      case 'Selesai':
        return { label: 'Completed 100%', barWidth: '100%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
      default:
        return { label: 'Processing 50%', barWidth: '50%', colorClass: 'bg-primary', textClass: 'text-on-surface-variant' };
    }
  };

  // Status Badge Label and Color Mapper
  const getStatusDetails = (c, isOverdue) => {
    if (isOverdue) {
      return { label: 'TERLAMBAT', bgClass: 'bg-error-container/20 text-error font-extrabold', icon: 'warning' };
    }

    switch (c.status) {
      case 'Penyusunan Draf':
      case 'Verifikasi Sertifikat':
      case 'Validasi Pajak':
      case 'Proses BPN':
        return { label: 'Dalam Proses', bgClass: 'bg-blue-50 text-blue-700 font-semibold', icon: null };
      case 'Pemeriksaan Dokumen':
        return { label: 'Menunggu Klien', bgClass: 'bg-amber-50 text-amber-700 font-semibold', icon: null };
      case 'Tanda Tangan Akta':
        return { label: 'Review', bgClass: 'bg-purple-50 text-purple-700 font-semibold', icon: null };
      case 'Selesai':
        return { label: 'Selesai', bgClass: 'bg-green-50 text-green-700 font-bold', icon: null };
      default:
        return { label: c.status, bgClass: 'bg-surface-container text-on-surface-variant', icon: null };
    }
  };

  // Format date as DD MMM YYYY (e.g. 01 Oct 2024)
  const formatEstimationDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Calculate days overdue
  const getDaysOverdue = (dateStr) => {
    if (!dateStr) return 0;
    try {
      const date = new Date(dateStr);
      const today = new Date();
      // zero out times
      date.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = today - date;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  // Filter cases based on searchVal, filterType, and filterStatus
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search check
      const matchesSearch = 
        c.clientName.toLowerCase().includes(searchVal.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(searchVal.toLowerCase()) ||
        (c.clientId && c.clientId.toLowerCase().includes(searchVal.toLowerCase()));

      // Type filter check
      const matchesType = filterType === 'ALL' || c.serviceType === filterType;

      // Status filter check
      const isOverdue = checkOverdue(c.estimationDate, c.status);
      let matchesStatus = true;

      if (filterStatus !== 'ALL') {
        if (filterStatus === 'TERLAMBAT') {
          matchesStatus = isOverdue;
        } else if (filterStatus === 'Dalam Proses') {
          matchesStatus = !isOverdue && (c.status === 'Penyusunan Draf' || c.status === 'Verifikasi Sertifikat' || c.status === 'Validasi Pajak' || c.status === 'Proses BPN');
        } else if (filterStatus === 'Review') {
          matchesStatus = !isOverdue && c.status === 'Tanda Tangan Akta';
        } else if (filterStatus === 'Menunggu Klien') {
          matchesStatus = !isOverdue && c.status === 'Pemeriksaan Dokumen';
        } else if (filterStatus === 'Selesai') {
          matchesStatus = c.status === 'Selesai';
        }
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [cases, searchVal, filterType, filterStatus]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchVal, filterType, filterStatus]);

  // Pagination math
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCases.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col shadow-sm text-left font-sans">
      
      {/* Header with Title and Filters */}
      <div className="px-6 py-4 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h4 className="text-[15px] font-bold text-on-surface">Registry File Aktif</h4>
        
        <div className="flex gap-2.5 items-center">
          {/* Dropdown: Semua Tipe */}
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[11px] font-bold text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
          >
            <option value="ALL">Semua Tipe</option>
            {serviceTypeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Dropdown: Filter Status */}
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[11px] font-bold text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
          >
            <option value="ALL">Filter Status</option>
            <option value="TERLAMBAT">▲ Terlambat</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Menunggu Klien">Menunggu Klien</option>
            <option value="Review">Review</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#F1F5F9] bg-[#F8F9FA]">
              <th className="px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/80 whitespace-nowrap">No. File</th>
              <th className="px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/80 whitespace-nowrap">Nama Klien</th>
              <th className="px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/80 whitespace-nowrap">Tipe Layanan</th>
              <th className="px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/80 whitespace-nowrap">Progress</th>
              <th className="px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/80 whitespace-nowrap">Perkiraan Selesai</th>
              <th className="px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/80 whitespace-nowrap">Status</th>
              <th className="px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/80 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {currentItems.length > 0 ? (
              currentItems.map((c) => {
                const isOverdue = checkOverdue(c.estimationDate, c.status);
                const { initials, colorClass } = getAvatarStyle(c.clientName);
                const progress = getProgressDetails(c, isOverdue);
                const statusInfo = getStatusDetails(c, isOverdue);
                const daysOverdue = getDaysOverdue(c.estimationDate);

                // Service category color theme mapping
                const isPpat = c.category === 'ppat' || ['AJB', 'HIBAH', 'APHB', 'APHT', 'WARIS', 'ROYA', 'PECAH', 'GANTI', 'KONVERSI', 'HT'].includes(c.serviceType);
                const badgeColorTheme = isPpat 
                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                  : 'bg-purple-50 text-purple-700 border border-purple-100';

                return (
                  <tr 
                    key={c.id} 
                    className={`hover:bg-[#F8F9FA] transition-colors group ${
                      isOverdue ? 'bg-[#FEF2F2]/50' : 'bg-white'
                    }`}
                  >
                    {/* NO. FILE */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
                        )}
                        <span className="text-[12.5px] font-bold text-on-surface-variant">
                          {c.caseNumber}
                        </span>
                      </div>
                    </td>

                    {/* NAMA KLIEN (Initials Avatar + Name) */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center font-bold text-[11.5px] shrink-0`}>
                          {initials}
                        </div>
                        <span className="text-[13px] font-bold text-on-surface">
                          {c.clientName}
                        </span>
                      </div>
                    </td>

                    {/* TIPE LAYANAN */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wide uppercase ${badgeColorTheme}`}>
                        {c.serviceType === 'CV_PT' ? 'PT' : c.serviceType}
                      </span>
                    </td>

                    {/* PROGRESS BAR & STAGE LABEL */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex flex-col text-left min-w-[130px]">
                        <span className={`text-[11px] font-bold ${progress.textClass}`}>
                          {progress.label}
                        </span>
                        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div className={`h-full rounded-full ${progress.colorClass}`} style={{ width: progress.barWidth }}></div>
                        </div>
                      </div>
                    </td>

                    {/* PERKIRAAN SELESAI */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex flex-col text-left">
                        <span className="text-[12.5px] font-medium text-on-surface">
                          {formatEstimationDate(c.estimationDate)}
                        </span>
                        {isOverdue && daysOverdue > 0 && (
                          <span className="text-[10px] text-error font-bold mt-0.5 leading-none">
                            {daysOverdue} days overdue
                          </span>
                        )}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${statusInfo.bgClass}`}>
                        {statusInfo.icon && (
                          <span className="material-symbols-outlined text-[12px] font-extrabold">{statusInfo.icon}</span>
                        )}
                        <span>{statusInfo.label}</span>
                      </span>
                    </td>

                    {/* AKSI (Detail/Open, Edit/Pencil, Delete/Hapus) */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Open Detail Page */}
                        <button 
                          onClick={() => navigate(`/staff/documents/${c.id}`)}
                          className="w-7 h-7 rounded-lg hover:bg-surface-container border border-transparent hover:border-[#E2E8F0] flex items-center justify-center text-on-surface-variant transition-colors"
                          title="Buka pelacakan berkas"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        
                        {/* Edit Action */}
                        <button 
                          onClick={() => navigate(`/staff/documents/${c.id}`)}
                          className="w-7 h-7 rounded-lg hover:bg-surface-container border border-transparent hover:border-[#E2E8F0] flex items-center justify-center text-on-surface-variant transition-colors"
                          title="Edit berkas"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        {/* More Action */}
                        <button 
                          onClick={() => {
                            if (window.confirm(`Apakah Anda yakin ingin menghapus berkas milik ${c.clientName}?`)) {
                              deleteCase(c.id);
                            }
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-error-container/20 border border-transparent hover:border-[#FCA5A5]/40 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
                          title="Hapus berkas"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-on-surface-variant/80 font-medium text-[13px]">
                  Tidak ada berkas yang sesuai dengan kriteria filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-[#F1F5F9] bg-white flex items-center justify-between flex-col sm:flex-row gap-4 select-none">
        <p className="text-[12px] text-on-surface-variant/80 font-medium">
          {filteredCases.length > 0 ? (
            <>
              Menampilkan <span className="font-semibold text-on-surface">{indexOfFirstItem + 1}</span> hingga <span className="font-semibold text-on-surface">{Math.min(indexOfLastItem, filteredCases.length)}</span> dari <span className="font-semibold text-on-surface">{filteredCases.length}</span> hasil
            </>
          ) : (
            'Menampilkan 0 dari 0 hasil'
          )}
        </p>

        {filteredCases.length > itemsPerPage && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-[#E2E8F0] hover:bg-surface-container-low rounded-lg text-[11.5px] font-bold text-on-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-[#E2E8F0] hover:bg-surface-container-low rounded-lg text-[11.5px] font-bold text-on-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

    </section>
  );
};

export default CaseTable;
