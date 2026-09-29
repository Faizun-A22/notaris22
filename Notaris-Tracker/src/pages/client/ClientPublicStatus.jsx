import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCases } from '../../hooks/useCases';
import { formatDate } from '../../utils/formatDate';
import { StatusBadge } from '../../components/common/StatusBadge';
import { getStagesForCase } from '../../utils/getStagesForCase';
import { 
  CheckCircle2, 
  Clock, 
  Printer, 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  Sparkles,
  Building2,
  FileCheck
} from 'lucide-react';

export const ClientPublicStatus = () => {
  const { trackCase } = useCases();
  const [searchParams] = useSearchParams();
  const [searchedCase, setSearchedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const caseParam = searchParams.get('case');
    if (caseParam) {
      setLoading(true);
      trackCase(caseParam)
        .then((found) => {
          if (found) {
            setSearchedCase(found);
            setError(null);
          } else {
            setError('Berkas tidak ditemukan. Pastikan nomor berkas Anda benar.');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Terjadi kesalahan saat memuat berkas.');
          setLoading(false);
        });
    } else {
      setError('Akses ditolak. Parameter nomor berkas tidak ditemukan.');
      setLoading(false);
    }
  }, [searchParams]);

  const getActiveStageId = (c, stagesList) => {
    if (!c) return 1;
    if (c.isComplete || c.status === 'Selesai') {
      return stagesList.length + 1;
    }
    if (c.currentStageId !== undefined) {
      return c.currentStageId;
    }
    return 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F8] flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 border-3 border-[#6366F1] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-500 font-bold">Memuat sertifikat pelacakan berkas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F2F8] flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 bg-[#FEE2E2] text-[#EF4444] rounded-3xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(239,68,68,0.2)]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-xl text-slate-800">Pelacakan Gagal</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">{error}</p>
        <Link
          to="/track"
          className="mt-6 btn-primary-3d px-6 py-2.5 text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pencarian</span>
        </Link>
      </div>
    );
  }

  const stagesList = getStagesForCase(searchedCase);
  const activeStageId = getActiveStageId(searchedCase, stagesList);
  const isFinished = searchedCase.isComplete || searchedCase.status === 'Selesai';

  return (
    <div className="min-h-screen bg-[#F0F2F8] py-8 sm:py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background blobs */}
      <div className="absolute w-[500px] h-[500px] bg-[#6366F1]/10 rounded-full filter blur-[100px] -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-[#10B981]/10 rounded-full filter blur-[120px] -bottom-40 -right-40 pointer-events-none"></div>

      <div className="w-full max-w-3xl bg-white/95 border border-white/60 rounded-[32px] shadow-[0_20px_60px_rgba(112,144,176,0.12)] p-6 sm:p-10 relative text-left backdrop-blur-md overflow-hidden print:shadow-none print:border-none print:p-0 print:rounded-none">
        
        {/* Top Watermark Border for Certificate look */}
        <div className="absolute inset-0 border-[12px] border-double border-[#6366F1]/10 rounded-[32px] pointer-events-none print:hidden"></div>

        {/* Certificate Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-6 mb-6 print:border-b-2">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white rounded-2xl flex items-center justify-center shadow-[0_6px_16px_rgba(99,102,241,0.3)]">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight tracking-tight">LexNotary Digital</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sertifikat Status Berkas Akta</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 text-left sm:text-right text-xs text-slate-500 font-medium">
            <p><strong className="text-slate-700">No. Berkas:</strong> {searchedCase.caseNumber}</p>
            <p className="mt-0.5"><strong className="text-slate-700">Layanan:</strong> {searchedCase.serviceType}</p>
          </div>
        </div>

        {/* Big visual completion/progress banner */}
        {isFinished ? (
          <div className="soft-card-mint p-6 text-center space-y-3 mb-6 animate-fade-in">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#10B981] to-[#34D399] text-white rounded-full flex items-center justify-center mx-auto shadow-[0_8px_20px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#10B981]">PROSES DOKUMEN SELESAI</h2>
            <p className="text-xs sm:text-[13px] text-slate-600 max-w-md mx-auto leading-relaxed font-semibold">
              Berkas Anda telah selesai diproses 100% secara sah oleh Notaris & PPAT. Dokumen siap diserahkan atau diambil di kantor.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#10B981] rounded-full text-xs font-black uppercase tracking-wide shadow-xs border border-[#A7F3D0]">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Terverifikasi Notaris</span>
            </div>
          </div>
        ) : (
          <div className="soft-card-purple p-6 text-center space-y-3 mb-6 animate-fade-in">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
              <Clock className="w-6 h-6 text-[#6366F1] animate-spin" />
            </div>
            <h2 className="text-lg font-black text-[#6366F1]">DOKUMEN SEDANG DIPROSES</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
              Berkas Anda sedang aktif dikerjakan oleh staf legal kami. Saat ini berada pada tahap:
            </p>
            <p className="text-sm font-black text-slate-800 uppercase tracking-wide bg-white border border-[#E0E7FF] px-4 py-1.5 rounded-full inline-block shadow-xs">
              {searchedCase.status}
            </p>
          </div>
        )}

        {/* Document Details Card */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-100 p-5 mb-6 print:bg-white print:border-none print:p-0">
          <div className="space-y-3.5">
            <h3 className="text-xs font-black text-[#6366F1] uppercase tracking-wider border-b pb-2 border-slate-200">
              Informasi Pelacakan Berkas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold text-[11px] block">Syarat Dokumen</span>
                <span className="mt-1 block">
                  <StatusBadge variant="document" label={searchedCase.documentsReady ? 'LENGKAP' : 'BELUM LENGKAP'} />
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[11px] block">Tanggal Masuk</span>
                <strong className="text-slate-700 font-bold mt-1 block">{formatDate(searchedCase.entryDate)}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[11px] block">Target Selesai</span>
                <strong className="text-slate-700 font-bold mt-1 block">
                  {searchedCase.estimationDate ? formatDate(searchedCase.estimationDate) : 'Menyesuaikan Proses'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Rincian Kelengkapan Dokumen (Sudah Diterima & Belum Ada) */}
        {searchedCase.checklist && searchedCase.checklist.length > 0 && (
          <div className="bg-[#F8FAFC] rounded-2xl border border-slate-100 p-5 mb-6 text-left print:bg-white print:border-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3 mb-3">
              <div>
                <h4 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#6366F1]" />
                  <span>Rincian Kelengkapan Dokumen Persyaratan</span>
                </h4>
                <p className="text-[11.5px] text-slate-400 font-medium mt-0.5">
                  Daftar dokumen fisik yang sudah diserahkan dan yang masih perlu dilengkapi.
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
              <div className="space-y-2 mb-4">
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
              <div className="space-y-2">
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

        {/* Timeline Progress */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider border-b border-slate-100 pb-2.5 flex justify-between items-center print:border-b-2">
            <span>Alur Riwayat Pengerjaan Berkas</span>
            <span className="text-xs text-slate-400 font-semibold">Total {stagesList.length} Tahapan</span>
          </h4>

          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            {stagesList.map((st) => {
              const isPassed = st.id < activeStageId;
              const isCurrent = st.id === activeStageId;

              let dotColor = 'bg-slate-200 border-2 border-white';
              let textColor = 'text-slate-400';

              if (isFinished || isPassed) {
                dotColor = 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)] text-white';
                textColor = 'text-[#10B981] font-bold';
              } else if (isCurrent) {
                dotColor = 'bg-[#6366F1] ring-4 ring-[#6366F1]/20 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]';
                textColor = 'text-[#6366F1] font-extrabold';
              }

              return (
                <div key={st.id} className="relative flex flex-col text-left">
                  <div className={`absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full transition-all duration-300 ${dotColor} flex items-center justify-center`}>
                    {(isFinished || isPassed) && (
                      <span className="text-white text-[8px] font-bold">✓</span>
                    )}
                  </div>
                  <span className={`text-[13px] ${textColor}`}>
                    {st.id}. {st.label}
                  </span>
                  {isCurrent && !isFinished && (
                    <span className="text-[11.5px] text-slate-500 mt-0.5 italic bg-[#EEF2FF] px-2 py-0.5 rounded-lg w-fit">
                      Berkas Anda sedang berada pada tahapan ini.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Seal/Badge & Action buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
            <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
            <span>Didukung sistem enkripsi & database LexNotary Digital.</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/track"
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cari Lainnya
            </Link>
            <button
              onClick={() => window.print()}
              className="btn-primary-3d px-5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sertifikat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientPublicStatus;
