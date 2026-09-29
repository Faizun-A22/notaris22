import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCases } from '../../../hooks/useCases';
import { useAuth } from '../../../hooks/useAuth';
import { checkOverdue } from '../../../utils/checkOverdue';
import { 
  Filter, 
  Calendar, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';

export const CaseTable = ({ searchVal = '', casesList }) => {
  const { cases: allCases, deleteCase } = useCases();
  const { profile } = useAuth();
  const isOwner = profile?.role === 'owner';
  const cases = casesList || allCases;
  const navigate = useNavigate();

  // Tab Filter ('All' | 'To Do' | 'In Progress' | 'Done')
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [filterType, setFilterType] = useState('ALL');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Format date as "May 20" or "20 Okt"
  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'Tanpa Batas';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  // Get Priority info based on Overdue or Status
  const getPriority = (c, isOverdue) => {
    if (isOverdue) return { label: 'High', color: 'rose' };
    if (c.status === 'Selesai') return { label: 'Low', color: 'mint' };
    if (c.status === 'Tanda Tangan Akta' || c.status === 'Validasi Pajak') return { label: 'Medium', color: 'amber' };
    return { label: 'Medium', color: 'amber' };
  };

  // Get Service Category Pill Style
  const getCategoryBadge = (c) => {
    const isPPAT = c.category === 'ppat' || ['AJB', 'HIBAH', 'APHB', 'APHT', 'WARIS', 'ROYA', 'PECAH', 'GANTI', 'KONVERSI', 'HT'].includes(c.serviceType);
    
    if (isPPAT) {
      return {
        label: c.serviceType,
        classes: 'bg-[#F2F1FD] text-[#6366F1] border border-[#E4E2FB]'
      };
    }
    return {
      label: c.serviceType === 'CV_PT' ? 'PT / CV' : c.serviceType,
      classes: 'bg-[#EEF9FD] text-[#0284C7] border border-[#D2EEFB]'
    };
  };

  // Filter cases based on active tab, search, and type
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search check
      const matchesSearch = 
        c.clientName.toLowerCase().includes(searchVal.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(searchVal.toLowerCase()) ||
        (c.propertyLocation && c.propertyLocation.toLowerCase().includes(searchVal.toLowerCase()));

      if (!matchesSearch) return false;

      // Type filter
      if (filterType !== 'ALL' && c.serviceType !== filterType) return false;

      // Tab filter
      const isOverdue = checkOverdue(c.estimationDate, c.status);
      if (activeTab === 'To Do') {
        return c.status === 'Pemeriksaan Dokumen';
      }
      if (activeTab === 'In Progress') {
        return c.status !== 'Selesai' && c.status !== 'Pemeriksaan Dokumen';
      }
      if (activeTab === 'Done') {
        return c.status === 'Selesai';
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'dueDate') {
        return (new Date(a.estimationDate || '2099-01-01')) - (new Date(b.estimationDate || '2099-01-01'));
      }
      if (sortBy === 'client') {
        return a.clientName.localeCompare(b.clientName);
      }
      return 0;
    });
  }, [cases, searchVal, filterType, activeTab, sortBy]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchVal, filterType, sortBy]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const currentItems = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabs = ['All', 'To Do', 'In Progress', 'Done'];

  return (
    <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left select-none relative">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-[18px] font-extrabold text-slate-800 tracking-tight">
            My Tasks
          </h3>

          {/* Clean Pill Tabs */}
          <div className="flex items-center gap-2 mt-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[12px] font-bold px-3 py-1 rounded-xl transition-all relative ${
                    isActive
                      ? 'text-[#6366F1] font-black'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-[#6366F1] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tools (Filter, Sort By) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#F8F9FA] border border-slate-200 rounded-xl px-3 py-1.5 text-[11.5px] font-bold text-slate-600 focus:outline-none focus:border-[#6366F1] cursor-pointer"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="AJB">Akta Jual Beli (AJB)</option>
              <option value="HIBAH">Hibah</option>
              <option value="APHT">APHT</option>
              <option value="WARIS">Waris</option>
              <option value="ROYA">Roya</option>
              <option value="PT">PT / CV</option>
            </select>
          </div>

          {/* Sort By Due Date */}
          <div className="flex items-center bg-[#F8F9FA] border border-slate-200 rounded-xl px-3 py-1.5 text-[11.5px] font-bold text-slate-600">
            <span className="text-slate-400 mr-1.5">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="dueDate">Due Date</option>
              <option value="client">Client Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Rows List */}
      <div className="divide-y divide-slate-100">
        {currentItems.length > 0 ? (
          currentItems.map((c) => {
            const isOverdue = checkOverdue(c.estimationDate, c.status);
            const isCompleted = c.status === 'Selesai';
            const priority = getPriority(c, isOverdue);
            const catBadge = getCategoryBadge(c);

            return (
              <div
                key={c.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] px-2 rounded-2xl transition-colors group cursor-pointer"
                onClick={() => navigate(`/staff/documents/${c.id}`)}
              >
                {/* Left: Checkmark & Title */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Circular Soft Checkbox Button */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle action
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isCompleted 
                        ? 'bg-[#10B981] border-[#10B981] text-white shadow-xs' 
                        : 'border-slate-300 hover:border-[#6366F1] bg-white'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </div>

                  {/* Task Document Description */}
                  <div className="min-w-0">
                    <p className={`text-[13.5px] font-bold text-slate-800 tracking-tight truncate ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}>
                      {c.clientName}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 truncate">
                      {c.caseNumber} &bull; {c.propertyLocation || 'Lokasi Terdaftar'}
                    </p>
                  </div>
                </div>

                {/* Middle Right: Category Pill, Due Date, Priority */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Category Pill */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${catBadge.classes} hidden md:inline-flex`}>
                    {catBadge.label}
                  </span>

                  {/* Due Date with Calendar Icon */}
                  <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-500 min-w-[70px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatShortDate(c.estimationDate)}</span>
                  </div>

                  {/* Priority Pill */}
                  <span className={`px-3 py-0.5 rounded-full text-[10.5px] font-bold min-w-[62px] text-center ${
                    priority.color === 'rose'
                      ? 'bg-[#FDF0F3] text-[#EF4444] border border-[#FCDCE3]'
                      : priority.color === 'amber'
                      ? 'bg-[#FEF8EB] text-[#D97706] border border-[#FDEECC]'
                      : 'bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4]'
                  }`}>
                    {priority.label}
                  </span>

                  {/* 3-dots Menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                      className="w-7 h-7 rounded-xl hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === c.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 animate-in fade-in duration-150">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/staff/documents/${c.id}`);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              if (window.confirm(`Hapus berkas ${c.clientName}?`)) {
                                deleteCase(c.id);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400 text-[13px] font-medium">
            Tidak ada berkas yang sesuai dengan filter.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-400 font-semibold">
          <span>
            Menampilkan halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-[#F8F9FA] border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-[#F8F9FA] border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseTable;
