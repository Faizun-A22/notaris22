import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCases } from '../../hooks/useCases';
import { formatDate } from '../../utils/formatDate';
import { StatusBadge } from '../../components/common/StatusBadge';
import { getStagesForCase } from '../../utils/getStagesForCase';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  AlertCircle, 
  Building2, 
  User, 
  FileCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const ClientTrackingPage = () => {
  const { trackCase } = useCases();
  const [searchParams] = useSearchParams();
  const [caseNum, setCaseNum] = useState('');
  const [searchedCase, setSearchedCase] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const caseParam = searchParams.get('case');
    if (caseParam) {
      setCaseNum(caseParam);
      setSearched(true);
      setLoading(true);
      trackCase(caseParam).then((found) => {
        setSearchedCase(found);
        setLoading(false);
      });
    }
  }, [searchParams]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!caseNum.trim()) return;
    setSearched(true);
    setLoading(true);
    const found = await trackCase(caseNum);
    setSearchedCase(found);
    setLoading(false);
  };

  const getActiveStageId = (c, stagesList) => {
    if (!c) return 1;
    if (c.status === 'Selesai') {
      return stagesList.length + 1;
    }
    if (c.currentStageId !== undefined) {
      return c.currentStageId;
    }
    // Fallback based on status
    if (c.serviceType === 'AJB' || c.serviceType === 'HIBAH' || c.serviceType === 'APHB') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 4,
        'Tanda Tangan Akta': 5,
        'Validasi Pajak': 6,
        'Proses BPN': 8,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'APHT') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Proses BPN': 6,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'WARIS' || c.serviceType === 'ROYA') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Validasi Pajak': 4,
        'Proses BPN': 6,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'PECAH' || c.serviceType === 'GANTI' || c.serviceType === 'KONVERSI') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 4,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 4,
        'Proses BPN': 4,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'FIDUSIA') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 1,
        'Penyusunan Draf': 2,
        'Tanda Tangan Akta': 3,
        'Validasi Pajak': 5,
        'Proses BPN': 5,
      };
      return statusMap[c.status] || 1;
    } else {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Proses BPN': 5,
      };
      return statusMap[c.status] || 1;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F8] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Visual background atmospheric elements */}
      <div className="absolute w-[500px] h-[500px] bg-[#6366F1]/10 rounded-full filter blur-[100px] -top-32 -left-32 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-[#10B981]/10 rounded-full filter blur-[120px] -bottom-32 -right-32 pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white/95 rounded-[32px] border border-white/60 shadow-[0_20px_60px_rgba(112,144,176,0.12)] p-6 sm:p-10 z-10 text-center relative backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white rounded-3xl flex items-center justify-center mb-5 shadow-[0_8px_20px_rgba(99,102,241,0.35)]">
          <FileText className="w-8 h-8" />
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#6366F1] text-xs font-bold mb-3 border border-[#E0E7FF]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Portal Pelacakan Notaris Digital</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Pelacakan Berkas Klien</h1>
        <p className="text-xs sm:text-[13px] text-slate-400 font-medium max-w-md mx-auto mt-1.5 mb-8">
          Masukkan nomor berkas Anda untuk memeriksa progres pengerjaan akta dan validasi secara real-time.
        </p>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={caseNum}
              onChange={(e) => setCaseNum(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl text-[14px] font-bold text-slate-700 tracking-wider placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
              placeholder="Contoh: 2026/05/001"
            />
          </div>
          <button
            type="submit"
            className="btn-primary-3d py-3.5 px-7 flex items-center justify-center gap-2 text-sm font-bold shrink-0"
          >
            <span>Cari Berkas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Display results */}
        {loading ? (
          <div className="py-14 text-center text-slate-500">
            <div className="w-10 h-10 border-3 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold">Mencari berkas di sistem notaris...</p>
          </div>
        ) : searched ? (
          <div className="border-t border-slate-100 pt-7 text-left animate-fade-in">
            {searchedCase ? (
              <div className="space-y-6">
                
                {/* File Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">No. Berkas</span>
                    <p className="font-extrabold text-[#6366F1] text-[13.5px] mt-1 truncate">{searchedCase.caseNumber}</p>
                  </div>
                  <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Klien</span>
                    <p className="font-extrabold text-slate-800 text-[13.5px] mt-1 truncate">{searchedCase.clientName}</p>
                  </div>
                  <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Layanan</span>
                    <p className="font-extrabold text-slate-800 text-[13.5px] mt-1 truncate">{searchedCase.serviceType}</p>
                  </div>
                  <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Syarat Dokumen</span>
                    <div className="mt-1.5">
                      <StatusBadge 
                        variant="document" 
                        label={searchedCase.documentsReady ? 'LENGKAP' : 'BELUM LENGKAP'} 
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist Breakdown (Dokumen Sudah Diterima & Belum Ada) */}
                {searchedCase.checklist && searchedCase.checklist.length > 0 && (
                  <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-5 space-y-4 text-left shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-[#6366F1]" />
                          <span>Rincian Kelengkapan Dokumen</span>
                        </h4>
                        <p className="text-[11.5px] text-slate-400 font-medium mt-0.5">
                          Status berkas persyaratan yang sudah diterima dan belum dilengkapi.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10.5px] font-extrabold rounded-full">
                          {searchedCase.checklist.filter(c => c.status === 'Sudah Diterima').length} Diterima
                        </span>
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 text-[10.5px] font-extrabold rounded-full">
                          {searchedCase.checklist.filter(c => c.status !== 'Sudah Diterima').length} Belum
                        </span>
                      </div>
                    </div>

                    {/* Dokumen Belum Diterima */}
                    {searchedCase.checklist.some(c => c.status !== 'Sudah Diterima') && (
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Dokumen Belum Lengkap / Perlu Diserahkan ({searchedCase.checklist.filter(c => c.status !== 'Sudah Diterima').length})</span>
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          {searchedCase.checklist.filter(c => c.status !== 'Sudah Diterima').map((item, idx) => (
                            <div key={item.id || idx} className="bg-rose-50/70 border border-rose-200/70 rounded-xl p-3 flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">
                                  !
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[12.5px] text-slate-800 leading-snug">{item.name}</p>
                                  {item.description && (
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.description}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[9.5px] font-extrabold rounded-md uppercase tracking-wide shrink-0 ${
                                item.status === 'Perlu Verifikasi' 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {item.status === 'Perlu Verifikasi' ? 'Sedang Ditinjau' : 'Belum Ada'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dokumen Sudah Diterima */}
                    {searchedCase.checklist.some(c => c.status === 'Sudah Diterima') && (
                      <div className="space-y-2 pt-1">
                        <h5 className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Dokumen Sudah Diterima ({searchedCase.checklist.filter(c => c.status === 'Sudah Diterima').length})</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {searchedCase.checklist.filter(c => c.status === 'Sudah Diterima').map((item, idx) => (
                            <div key={item.id || idx} className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-2.5 flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="font-bold text-[12px] text-slate-800 leading-snug truncate">{item.name}</p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold rounded-md uppercase tracking-wide shrink-0">
                                Sudah Diterima
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Case stages progress timeline */}
                <div className="soft-card p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#6366F1]" />
                      <span>Alur Progres Pengerjaan</span>
                    </h4>
                    {searchedCase.status !== 'Selesai' ? (
                      <span className="badge-3d-purple px-2.5 py-0.5 text-[11px] animate-pulse">
                        Tahap Aktif: {searchedCase.status}
                      </span>
                    ) : (
                      <span className="badge-3d-mint px-2.5 py-0.5 text-[11px]">
                        Dokumen Selesai
                      </span>
                    )}
                  </div>
                  
                  <div className="relative max-h-[300px] overflow-y-auto pr-3 py-1 custom-scrollbar">
                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                      {getStagesForCase(searchedCase).map((st) => {
                        const stagesList = getStagesForCase(searchedCase);
                        const activeStageId = getActiveStageId(searchedCase, stagesList);
                        
                        const isPassed = st.id < activeStageId;
                        const isCurrent = st.id === activeStageId;
                        
                        let dotClass = 'bg-slate-200 border-2 border-white';
                        let textClass = 'text-slate-400 font-medium';

                        if (searchedCase.status === 'Selesai' || isPassed) {
                          dotClass = 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)] text-white';
                          textClass = 'text-[#10B981] font-bold';
                        } else if (isCurrent) {
                          dotClass = 'bg-[#6366F1] ring-4 ring-[#6366F1]/20 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]';
                          textClass = 'text-[#6366F1] font-extrabold';
                        }

                        return (
                          <div key={st.id} className="relative flex flex-col text-left">
                            <div className={`absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full transition-all duration-300 ${dotClass} flex items-center justify-center`}>
                              {(searchedCase.status === 'Selesai' || isPassed) && (
                                <span className="text-[8px] font-black">✓</span>
                              )}
                            </div>
                            <span className={`text-[13px] ${textClass}`}>
                              {st.id}. {st.label}
                            </span>
                            {isCurrent && searchedCase.status !== 'Selesai' && (
                              <span className="text-[11.5px] text-slate-500 mt-0.5 font-medium bg-[#EEF2FF] px-2.5 py-1 rounded-xl w-fit">
                                Berkas Anda saat ini berada pada tahap pengerjaan ini.
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* View Full Certificate Link */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F8FAFC] border border-slate-100 p-4 rounded-2xl">
                  <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                    <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
                    <span>Dokumen akta dilindungi secara legal oleh Notaris & PPAT.</span>
                  </div>
                  <Link
                    to={`/status?case=${encodeURIComponent(searchedCase.caseNumber)}`}
                    className="btn-primary-3d py-2 px-4 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <span>Buka Sertifikat Digital</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            ) : (
              <div className="py-10 text-center soft-card-rose p-6">
                <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-2" />
                <p className="font-extrabold text-[15px] text-[#EF4444]">Berkas Tidak Ditemukan</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Mohon periksa kembali nomor berkas yang Anda masukkan. Pastikan sesuai format (contoh: 2026/05/001).
                </p>
              </div>
            )}
          </div>
        ) : null}
        
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Notaris Cloud &copy; 2026</span>
          <Link to="/login" className="text-[#6366F1] font-bold hover:underline">
            Portal Pegawai
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ClientTrackingPage;
