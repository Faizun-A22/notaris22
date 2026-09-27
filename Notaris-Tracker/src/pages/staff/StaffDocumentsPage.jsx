import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useCases } from '../../hooks/useCases';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { getDefaultChecklist } from '../../contexts/CasesContext';

import { SERVICE_TYPES, SERVICE_CATEGORIES, getCaseCategory } from '../../constants/serviceTypes';

const STATUSES = [
  'Pemeriksaan Dokumen',
  'Verifikasi Sertifikat',
  'Validasi Pajak',
  'Penyusunan Draf',
  'Tanda Tangan Akta',
  'Proses BPN',
  'Selesai'
];

const PRIORITY_COLOR = (c) => {
  if (c.isComplete) return 'border-l-secondary'; // Selesai (Abu-abu)
  if (!c.documentsReady) return 'border-l-warning'; // Menunggu dokumen klien (Amber)
  return 'border-l-primary'; // Aktif diproses (Biru)
};

const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
};

import DateFilter from '../../components/common/DateFilter';

export const StaffDocumentsPage = () => {
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();
  const { cases, updateCaseStatus, toggleDocStatus, deleteCase } = useCases();
  const { user } = useAuth();

  const [filterCategory, setFilterCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('newest'); // newest | belum | selesai
  const [selectedCase, setSelectedCase] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');

  // Share link states
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneNum, setPhoneNum] = useState('');
  const [shareCase, setShareCase] = useState(null);

  const filtered = useMemo(() => {
    let list = cases.filter((c) => {
      const matchSearch =
        c.clientName.toLowerCase().includes((searchVal || '').toLowerCase()) ||
        c.caseNumber.toLowerCase().includes((searchVal || '').toLowerCase());
      const matchCategory = filterCategory === 'Semua' || getCaseCategory(c) === filterCategory;

      // Period filter check
      if (!c.entryDate) return false;
      const [yStr, mStr, dStr] = c.entryDate.split('-');
      const cYear = parseInt(yStr, 10);
      const cMonth = parseInt(mStr, 10);
      const cDay = parseInt(dStr, 10);

      if (filterYear !== 'ALL' && cYear !== parseInt(filterYear, 10)) return false;
      if (filterMonth !== 'ALL' && cMonth !== parseInt(filterMonth, 10)) return false;
      if (filterDate !== 'ALL' && cDay !== parseInt(filterDate, 10)) return false;

      return matchSearch && matchCategory;
    });

    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => b.caseNumber.localeCompare(a.caseNumber));
    } else if (sortBy === 'belum') {
      list = [...list].sort((a, b) => {
        // Prioritize active cases over completed cases
        const aComplete = a.isComplete ? 1 : 0;
        const bComplete = b.isComplete ? 1 : 0;
        if (aComplete !== bComplete) {
          return aComplete - bComplete; // active (0) comes before completed (1)
        }
        
        // Prioritize incomplete documents (documentsReady === false) over complete documents (documentsReady === true)
        const aReady = a.documentsReady ? 1 : 0;
        const bReady = b.documentsReady ? 1 : 0;
        if (aReady !== bReady) {
          return aReady - bReady; // incomplete (0) comes before complete (1)
        }
        
        return b.caseNumber.localeCompare(a.caseNumber);
      });
    } else if (sortBy === 'selesai') {
      list = [...list].sort((a, b) => {
        // Prioritize completed cases over active cases
        const aComplete = a.isComplete ? 1 : 0;
        const bComplete = b.isComplete ? 1 : 0;
        if (aComplete !== bComplete) {
          return bComplete - aComplete; // completed (1) comes before active (0)
        }
        
        return b.caseNumber.localeCompare(a.caseNumber);
      });
    }

    return list;
  }, [cases, searchVal, filterCategory, sortBy]);

  const activeCount = cases.filter((c) => !c.isComplete).length;
  const docCompleteCount = cases.filter((c) => !c.isComplete && c.documentsReady).length;
  const docMissingCount = cases.filter((c) => !c.isComplete && !c.documentsReady).length;

  const handleDelete = (id) => {
    deleteCase(id);
    setConfirmDeleteId(null);
    if (selectedCase?.id === id) setSelectedCase(null);
  };

  const handleDownloadQR = (caseNumber) => {
    const svgId = `qr-svg-${caseNumber.replace(/\//g, '-')}`;
    const svg = document.getElementById(svgId);
    if (!svg) {
      toast.error('Gagal menemukan elemen QR Code!');
      return;
    }
    
    try {
      const svgSerializer = new XMLSerializer();
      const svgString = svgSerializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const context = canvas.getContext('2d');
        
        // Solid white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code onto canvas
        context.drawImage(image, 25, 25, 450, 450);
        
        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngURL;
        downloadLink.download = `QR-Code-Pelacakan-${caseNumber.replace(/\//g, '-')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast.success('QR Code berhasil diunduh!');
      };
      image.src = blobURL;
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh QR Code!');
    }
  };

  return (
    <div className="space-y-stack-lg text-left">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Manajemen Berkas Saya</h2>
          <p className="text-body-lg text-on-surface-variant mt-1">
            Kelola dan perbarui status seluruh berkas akta yang Anda tangani.
          </p>
        </div>
      </div>

      {/* Alert Strip — incomplete document checklist warning */}
      {docMissingCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3.5 flex items-center gap-3 animate-in fade-in duration-300 select-none">
          <span className="material-symbols-outlined text-warning text-[22px]">warning</span>
          <p className="text-warning font-bold text-[13px]">
            {docMissingCount} berkas memiliki dokumen persyaratan yang belum lengkap! Harap hubungi klien untuk melengkapinya.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-grid select-none">
        {[
          { label: 'Berkas Aktif', value: activeCount, icon: 'folder_open', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Berkas Lengkap (Siap)', value: docCompleteCount, icon: 'task_alt', color: 'text-green-700', bg: 'bg-green-100/40' },
          { label: 'Dokumen Belum Lengkap', value: docMissingCount, icon: 'pending_actions', color: 'text-warning', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined ${color} text-[22px]`}>{icon}</span>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{label}</p>
              <p className={`font-extrabold text-[22px] mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
        {/* Row 1: Search & Date Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md text-left">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Cari nama klien atau nomor berkas..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary text-[13px]"
            />
          </div>
          
          {/* Date Filter */}
          <DateFilter
            date={filterDate}
            month={filterMonth}
            year={filterYear}
            onDateChange={setFilterDate}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
          />
        </div>

        {/* Row 2: Category & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-outline-variant/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Kategori:</span>
            <div className="flex gap-1.5">
              {['Semua', SERVICE_CATEGORIES.PPAT, SERVICE_CATEGORIES.NOTARIS].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                    filterCategory === cat
                      ? 'bg-inverse-surface text-inverse-on-surface border-inverse-surface'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-[12px] font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="newest">Terbaru</option>
              <option value="belum">Belum Lengkap</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-grid">
        {/* Case Cards */}
        <div className={`${selectedCase ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {filtered.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30 block mb-3">search_off</span>
              <p className="text-on-surface-variant text-[14px]">Tidak ada berkas yang sesuai filter.</p>
            </div>
          ) : (
            filtered.map((c) => {
              const hasEstimation = !!c.estimationDate;
              const daysLeft = hasEstimation ? Math.ceil((new Date(c.estimationDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
              const isOverdue = hasEstimation && !c.isComplete && daysLeft < 0;
              const isUrgent = hasEstimation && !c.isComplete && daysLeft >= 0 && daysLeft <= 3;
              const isSelected = selectedCase?.id === c.id;

              const chList = c.checklist || getDefaultChecklist(c.serviceType) || [];
              const missingCount = chList.filter(item => item.status === 'Belum Ada').length;

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/staff/documents/${c.id}`)}
                  className={`bg-surface-container-lowest border border-l-4 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md border-outline-variant ${PRIORITY_COLOR(c)}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-primary text-[12px]">{c.caseNumber}</span>
                        <StatusBadge variant="service" type={c.serviceType} />
                        {!c.isComplete && !c.documentsReady && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200 text-[9.5px] font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">pending_actions</span>DOKUMEN KURANG
                          </span>
                        )}
                        {!c.isComplete && c.documentsReady && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded border border-green-200 text-[9.5px] font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>DOKUMEN LENGKAP
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-on-surface text-[15px] mb-1">{c.clientName}</h4>
                      <div className="flex flex-col gap-1.5 mt-2 text-[11.5px] text-left">
                        <div className="flex items-start gap-1">
                          <span className="material-symbols-outlined text-[16px] mt-0.5 text-on-surface-variant">checklist</span>
                          <div>
                            {!c.isComplete && (
                              <>
                                {missingCount > 0 ? (
                                  <div>
                                    <span className="font-bold text-amber-600">
                                      Belum Lengkap (Kurang {missingCount} file yang belum di-upload)
                                    </span>
                                    <p className="text-[10px] text-amber-700/80 font-medium leading-tight mt-0.5">
                                      Rekomendasi: Hubungi klien untuk melengkapi berkas.
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-bold text-green-700">
                                      Lengkap. Tahap saat ini: {c.status}
                                    </span>
                                    <p className="text-[10px] text-green-800/80 font-medium leading-tight mt-0.5">
                                      Rekomendasi: Lanjutkan pengerjaan sesuai alur kerja.
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                            {c.isComplete && (
                              <div>
                                <span className="font-bold text-secondary">
                                  Berkas Selesai Diproses
                                </span>
                                <p className="text-[10px] text-secondary/80 font-medium leading-tight mt-0.5">
                                  Rekomendasi: Akta siap diserahkan kepada pemohon.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          <span>{c.assignedStaff}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge variant="status" label={c.status} />
                      <StatusBadge variant="document" label={c.documentsReady ? 'LENGKAP' : 'BELUM'} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        {selectedCase && (
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200 self-start sticky top-28">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-primary text-[13px]">{selectedCase.caseNumber}</p>
                <h3 className="font-bold text-on-surface text-[18px] mt-0.5">{selectedCase.clientName}</h3>
                <p className="text-[12px] text-on-surface-variant mt-0.5">{SERVICE_TYPES[selectedCase.serviceType]?.label || selectedCase.serviceType}</p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'ID Klien', value: selectedCase.clientId },
                { label: 'Kondisi Berkas', value: selectedCase.isComplete ? 'SELESAI' : selectedCase.documentsReady ? 'LENGKAP' : 'BELUM LENGKAP' },
                { label: 'Staf', value: selectedCase.assignedStaff },
                { label: 'Estimasi Selesai', value: formatDate(selectedCase.estimationDate) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{label}</p>
                  <p className="font-semibold text-on-surface text-[12px] mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            {selectedCase.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">sticky_note_2</span> Catatan Staf
                </p>
                <p className="text-[12px] text-amber-900 leading-relaxed">{selectedCase.notes}</p>
              </div>
            )}

            {/* Progress Timeline */}
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3">Tahapan Pengerjaan</p>
              <div className="space-y-1.5">
                {STATUSES.map((s, i) => {
                  const currentIdx = STATUSES.indexOf(selectedCase.status);
                  const isPassed = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={s} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isCurrent ? 'bg-primary/10' : ''}`}>
                      <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${isPassed ? 'text-secondary' : isCurrent ? 'text-primary' : 'text-outline-variant'}`} style={{ fontVariationSettings: isPassed ? "'FILL' 1" : "'FILL' 0" }}>
                        {isPassed ? 'check_circle' : isCurrent ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      <span className={`text-[12px] ${isPassed ? 'text-secondary font-semibold' : isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-outline-variant">
              <button
                onClick={() => navigate(`/staff/documents/${selectedCase.id}`)}
                className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md mb-1"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Buka Pelacakan & Checklist
              </button>

              <button
                onClick={() => {
                  setShareCase(selectedCase);
                  setShowShareModal(true);
                }}
                className="w-full py-2.5 border border-primary text-primary hover:bg-primary/5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm mb-2"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                Bagikan Link Pelacakan
              </button>

              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">Ubah Status</p>
              <select
                value={selectedCase.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  updateCaseStatus(selectedCase.id, newStatus);
                  setSelectedCase((prev) => ({ ...prev, status: newStatus, isComplete: newStatus === 'Selesai' }));
                }}
                className="w-full py-2.5 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-[13px] font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <button
                onClick={() => {
                  toggleDocStatus(selectedCase.id);
                  setSelectedCase((prev) => ({ ...prev, documentsReady: !prev.documentsReady }));
                }}
                className={`w-full py-2.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 transition-all border ${
                  selectedCase.documentsReady
                    ? 'border-secondary text-secondary hover:bg-secondary/5'
                    : 'bg-primary text-on-primary border-primary hover:opacity-90'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{selectedCase.documentsReady ? 'unpublished' : 'task_alt'}</span>
                {selectedCase.documentsReady ? 'Tandai Dokumen Belum Lengkap' : 'Konfirmasi Dokumen Lengkap'}
              </button>

              <button
                onClick={() => setConfirmDeleteId(selectedCase.id)}
                className="w-full py-2.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 border border-error/30 text-error hover:bg-error/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Hapus Berkas Ini
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-sm w-full shadow-xl text-center">
            <span className="material-symbols-outlined text-error text-[40px] mb-3">delete_forever</span>
            <h3 className="font-bold text-on-surface text-[16px] mb-2">Hapus Berkas?</h3>
            <p className="text-[13px] text-on-surface-variant mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-[13px] font-bold hover:bg-surface-container-low">Batal</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 bg-error text-on-error rounded-lg text-[13px] font-bold hover:opacity-90">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: SHARE TRACKING LINK === */}
      {showShareModal && shareCase && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-outline-variant rounded-xl w-full max-w-md p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowShareModal(false);
                setPhoneNum('');
                setCopied(false);
                setShareCase(null);
              }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[28px]">share</span>
              <h3 className="font-bold text-[16px] text-primary uppercase tracking-wide">
                Bagikan Link Pelacakan
              </h3>
            </div>
            <p className="text-[12.5px] text-on-surface-variant border-b pb-3 mb-4 font-medium leading-normal">
              Klien dapat memantau progres berkas secara real-time. Bagikan link pelacakan untuk berkas milik <strong className="text-on-surface">{shareCase.clientName}</strong>.
            </p>

            {/* Link Box */}
            <div className="space-y-2 mb-5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Link Pelacakan Klien</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/status?case=${shareCase.caseNumber}`}
                  className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-[12px] font-mono text-on-surface select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/status?case=${shareCase.caseNumber}`;
                    copyToClipboard(link).then(() => {
                      setCopied(true);
                      toast.success('Link pelacakan berhasil disalin!');
                      setTimeout(() => setCopied(false), 2000);
                    }).catch(() => {
                      toast.error('Gagal menyalin link.');
                    });
                  }}
                  className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                    copied 
                      ? 'bg-secondary text-on-secondary shadow-sm' 
                      : 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.97]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                <span className="text-[12.5px] font-bold uppercase tracking-wider">Pindai QR Code Pelacakan</span>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-md border border-outline-variant/60 flex items-center justify-center animate-in zoom-in-95 duration-300">
                <QRCodeSVG 
                  id={"qr-svg-" + shareCase.caseNumber.replace(/\//g, "-")}
                  value={`${window.location.origin}/status?case=${shareCase.caseNumber}`} 
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <button
                onClick={() => handleDownloadQR(shareCase.caseNumber)}
                className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 active:scale-[0.97] rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Unduh Gambar QR</span>
              </button>
              
              <p className="text-[11px] text-on-surface-variant text-center max-w-[280px] leading-normal font-medium">
                Arahkan kamera smartphone Anda ke kode QR untuk langsung melihat progres pengerjaan akta klien secara real-time.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-outline-variant flex justify-end">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setCopied(false);
                  setShareCase(null);
                }}
                className="px-5 py-2 border border-outline-variant rounded-lg text-[12px] font-bold hover:bg-surface-container-low transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDocumentsPage;
