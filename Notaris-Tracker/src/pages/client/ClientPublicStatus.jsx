import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCases } from '../../hooks/useCases';
import { formatDate } from '../../utils/formatDate';
import { StatusBadge } from '../../components/common/StatusBadge';

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

  const getStagesForCase = (c) => {
    if (!c) return [];
    const isPPAT = c.category?.toLowerCase() === 'ppat' || ['AJB', 'HIBAH', 'APHB', 'APHT', 'WARIS', 'ROYA', 'PECAH', 'GANTI', 'KONVERSI', 'SKMHT', 'HT', 'HGB', 'HAK_PAKAI'].includes(c.serviceType);

    if (c.serviceType === 'APHT') {
      return [
        { id: 1, label: 'Pengecekan kelengkapan Berkas' },
        { id: 2, label: 'Pengecekan sertifikat' },
        { id: 3, label: 'Pengetikan akta' },
        { id: 4, label: 'Tanda tangan akta' },
        { id: 5, label: 'Penomoran akta' },
        { id: 6, label: 'Pendaftaran akta pada aplikasi mitra kerja atr bpn dan spa' },
        { id: 7, label: 'Backup pada aplikasi bank' },
        { id: 8, label: 'Verifikasi berkas oleh bpn melalui aplikasi mutra kerja atr bpn' },
        { id: 9, label: 'Berkas dikembalikan atau telah diverifikasi oleh bpn' },
        { id: 10, label: 'Pembayaran sps' },
        { id: 11, label: 'Verifikasi oleh bpn pada aplikasi bank' },
        { id: 12, label: 'Penerbitan sht' },
        { id: 13, label: 'Penyerahan berkas kepada pihak bank' }
      ];
    }

    if (c.serviceType === 'AJB' || c.serviceType === 'HIBAH' || c.serviceType === 'APHB' || isPPAT) {
      if (c.serviceType === 'WARIS' || c.serviceType === 'ROYA') {
        return [
          { id: 1, label: 'Pengecekan berkas' },
          { id: 2, label: 'Proses validasi sertifikat' },
          { id: 3, label: 'Proses pengecekan sertifikat' },
          { id: 4, label: 'Pembayaran pajak peralihan' },
          { id: 5, label: 'Validasi pajak peralihan' },
          { id: 6, label: 'Pendaftaran pada atr bpn' },
          { id: 7, label: 'Pemeriksaaan berkas oleh bpn' },
          { id: 8, label: 'Berkas dikembalikan atau telah sesuai' },
          { id: 9, label: 'Cari buku tanah di warkah bpn' },
          { id: 10, label: 'Pembayaran sps' },
          { id: 11, label: 'Pemeriksaan draft sertifikat' },
          { id: 12, label: 'Draft sertifikat' },
          { id: 13, label: 'Penerbitan sertifikat' },
          { id: 14, label: 'Loket penyerahan produk' },
          { id: 15, label: 'Penyerahan kepada pemohon' }
        ];
      }
      if (c.serviceType === 'PECAH') {
        return [
          { id: 1, label: 'Pengecekan berkas' },
          { id: 2, label: 'Pengecekan ke bpn status tanah yang kan dipecah' },
          { id: 3, label: 'Pendaftaran ukur pemechan' },
          { id: 4, label: 'Pengajuan tapak kapling' },
          { id: 5, label: 'Masuk berkas fisik ke bpn' },
          { id: 6, label: 'Pemeriksaan berkas oleh bpn' },
          { id: 7, label: 'Berkas dikembalikan atau telah sesuai' },
          { id: 8, label: 'Pembayaran sps' },
          { id: 9, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su' },
          { id: 10, label: 'Cari buku tanah di warkah bpn' },
          { id: 11, label: 'Pemeriksaan draft sertifikat' },
          { id: 12, label: 'Draft sertifikat' },
          { id: 13, label: 'Penerbitan sertifikat' },
          { id: 14, label: 'Loket penyerahan produk' },
          { id: 15, label: 'Penyerahan kepada pemohon' }
        ];
      }
      if (c.serviceType === 'GANTI') {
        return [
          { id: 1, label: 'Pengecekan berkas' },
          { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses' },
          { id: 3, label: 'Pendaftaran ukur' },
          { id: 4, label: 'Masuk berkas fisik ke bpn' },
          { id: 5, label: 'Pemeriksaan berkas oleh bpn' },
          { id: 6, label: 'Berkas dikembalikan atau telah sesuai' },
          { id: 7, label: 'Pembayaran sps' },
          { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su' },
          { id: 9, label: 'Cari buku tanah di warkah bpn' },
          { id: 10, label: 'Pemriksaaan draft sertifikat' },
          { id: 11, label: 'Draft sertifikat' },
          { id: 12, label: 'Penerbitan sertifikat' },
          { id: 13, label: 'Loket penyerahan produk' },
          { id: 14, label: 'Penyerahan kepada pemohon' }
        ];
      }
      if (c.serviceType === 'KONVERSI') {
        return [
          { id: 1, label: 'Pengecekan berkas' },
          { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses' },
          { id: 3, label: 'Pendaftaran ukur' },
          { id: 4, label: 'Masuk berkas fisik ke bpn' },
          { id: 5, label: 'Pemeriksaan berkas oleh bpn' },
          { id: 6, label: 'Berkas dikembalikan atau telah sesuai' },
          { id: 7, label: 'Pembayaran sps' },
          { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su' },
          { id: 9, label: 'Panitia lapang oleh petugas bpn' },
          { id: 10, label: 'pengumuman' },
          { id: 11, label: 'Pemeriksaan draft sertifikat' },
          { id: 12, label: 'Draft sertifikat' },
          { id: 13, label: 'Penerbitan sertifikat' },
          { id: 14, label: 'Loket penyerahan produk' },
          { id: 15, label: 'Penyerahan kepada pemohon' }
        ];
      }

      // Default PPAT stages (AJB/HIBAH/APHB/SKMHT/HT/HGB/HAK_PAKAI)
      return [
        { id: 1, label: 'Pengecekan Berkas' },
        { id: 2, label: 'Validasi Sertifikat' },
        { id: 3, label: 'Pengecekan Sertifikat' },
        { id: 4, label: 'Pengetikan Akta' },
        { id: 5, label: 'Tanda Tangan Akta' },
        { id: 6, label: 'Pembayaran Pajak Peralihan' },
        { id: 7, label: 'Validasi Pajak Peralihan (PPH Final)' },
        { id: 8, label: 'Penomoran Akta' },
        { id: 9, label: 'Pendaftaran Akta' },
        { id: 10, label: 'Masuk Berkas Fisik ke BPN' },
        { id: 11, label: 'Pemeriksaan Berkas oleh BPN' },
        { id: 12, label: 'Pencarian Buku Tanah' },
        { id: 13, label: 'Pembayaran SPS' },
        { id: 14, label: 'Pemeriksaan Draft Sertifikat' },
        { id: 15, label: 'Draft Sertifikat' },
        { id: 16, label: 'Penerbitan Sertifikat' },
        { id: 17, label: 'Loket Penyerahan Produk' },
        { id: 18, label: 'Penyerahan kepada Pemohon' },
      ];
    }

    if (c.serviceType === 'WARIS' || c.serviceType === 'ROYA') {
      return [
        { id: 1, label: 'Pengecekan berkas' },
        { id: 2, label: 'Proses validasi sertifikat' },
        { id: 3, label: 'Proses pengecekan sertifikat' },
        { id: 4, label: 'Pembayaran pajak peralihan' },
        { id: 5, label: 'Validasi pajak peralihan' },
        { id: 6, label: 'Pendaftaran pada atr bpn' },
        { id: 7, label: 'Pemeriksaaan berkas oleh bpn' },
        { id: 8, label: 'Berkas dikembalikan atau telah sesuai' },
        { id: 9, label: 'Cari buku tanah di warkah bpn' },
        { id: 10, label: 'Pembayaran sps' },
        { id: 11, label: 'Pemeriksaan draft sertifikat' },
        { id: 12, label: 'Draft sertifikat' },
        { id: 13, label: 'Penerbitan sertifikat' },
        { id: 14, label: 'Loket penyerahan produk' },
        { id: 15, label: 'Penyerahan kepada pemohon' }
      ];
    }

    if (c.serviceType === 'PECAH') {
      return [
        { id: 1, label: 'Pengecekan berkas' },
        { id: 2, label: 'Pengecekan ke bpn status tanah yang kan dipecah' },
        { id: 3, label: 'Pendaftaran ukur pemechan' },
        { id: 4, label: 'Pengajuan tapak kapling' },
        { id: 5, label: 'Masuk berkas fisik ke bpn' },
        { id: 6, label: 'Pemeriksaan berkas oleh bpn' },
        { id: 7, label: 'Berkas dikembalikan atau telah sesuai' },
        { id: 8, label: 'Pembayaran sps' },
        { id: 9, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su' },
        { id: 10, label: 'Cari buku tanah di warkah bpn' },
        { id: 11, label: 'Pemeriksaan draft sertifikat' },
        { id: 12, label: 'Draft sertifikat' },
        { id: 13, label: 'Penerbitan sertifikat' },
        { id: 14, label: 'Loket penyerahan produk' },
        { id: 15, label: 'Penyerahan kepada pemohon' }
      ];
    }

    if (c.serviceType === 'GANTI') {
      return [
        { id: 1, label: 'Pengecekan berkas' },
        { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses' },
        { id: 3, label: 'Pendaftaran ukur' },
        { id: 4, label: 'Masuk berkas fisik ke bpn' },
        { id: 5, label: 'Pemeriksaan berkas oleh bpn' },
        { id: 6, label: 'Berkas dikembalikan atau telah sesuai' },
        { id: 7, label: 'Pembayaran sps' },
        { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su' },
        { id: 9, label: 'Cari buku tanah di warkah bpn' },
        { id: 10, label: 'Pemriksaaan draft sertifikat' },
        { id: 11, label: 'Draft sertifikat' },
        { id: 12, label: 'Penerbitan sertifikat' },
        { id: 13, label: 'Loket penyerahan produk' },
        { id: 14, label: 'Penyerahan kepada pemohon' }
      ];
    }

    if (c.serviceType === 'KONVERSI') {
      return [
        { id: 1, label: 'Pengecekan berkas' },
        { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses' },
        { id: 3, label: 'Pendaftaran ukur' },
        { id: 4, label: 'Masuk berkas fisik ke bpn' },
        { id: 5, label: 'Pemeriksaan berkas oleh bpn' },
        { id: 6, label: 'Berkas dikembalikan atau telah sesuai' },
        { id: 7, label: 'Pembayaran sps' },
        { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su' },
        { id: 9, label: 'Panitia lapang oleh petugas bpn' },
        { id: 10, label: 'pengumuman' },
        { id: 11, label: 'Pemeriksaan draft sertifikat' },
        { id: 12, label: 'Draft sertifikat' },
        { id: 13, label: 'Penerbitan sertifikat' },
        { id: 14, label: 'Loket penyerahan produk' },
        { id: 15, label: 'Penyerahan kepada pemohon' }
      ];
    }

    if (c.serviceType === 'FIDUSIA') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'PENGETIKKAN AKTA' },
        { id: 3, label: 'TANDA TANGAN AKTA' },
        { id: 4, label: 'PENOMORAN AKTA' },
        { id: 5, label: 'PENDAFTARAN KE KEMENKUMHAM' },
        { id: 6, label: 'PENERBITAN SK KEMENKUMHAM' },
        { id: 7, label: 'PENYERAHAN AKTA KE PIHAK BANK' }
      ];
    }

    if (c.serviceType === 'APJB' || c.serviceType === 'SKUM') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'PENGECEKKAN SERTIFIKAT' },
        { id: 3, label: 'PENGETIKKAN AKTA' },
        { id: 4, label: 'TANDA TANGAN AKTA' },
        { id: 5, label: 'PEMBAYARAN PAJAK PERALIHAN' },
        { id: 6, label: 'PENOMORAN AKTA' },
        { id: 7, label: 'PENYERAHAN AKTA KE PEMOHON' }
      ];
    }

    if (c.serviceType === 'SEWA' || c.serviceType === 'CONSEN') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'PENGETIKKAN AKTA' },
        { id: 3, label: 'TANDA TANGAN AKTA' },
        { id: 4, label: 'PENOMORAN AKTA' },
        { id: 5, label: 'PENYERAHAN AKTA KE PEMOHON' }
      ];
    }

    if (c.serviceType === 'APPJB') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'PENGECEKKAN SERTIFIKAT' },
        { id: 3, label: 'PENGETIKKAN AKTA' },
        { id: 4, label: 'TANDA TANGAN AKTA' },
        { id: 5, label: 'PENOMORAN AKTA' }
      ];
    }

    if (c.serviceType === 'APK') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'PENGECEKKAN SERTIFIKAT' },
        { id: 3, label: 'PENGETIKKAN AKTA' },
        { id: 4, label: 'TANDA TANGAN AKTA' },
        { id: 5, label: 'PENOMORAN AKTA' },
        { id: 6, label: 'PENYERAHAN AKTA KE PIHAK BANK' }
      ];
    }

    if (c.serviceType === 'YAYASAN') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'DAFTAR NAMA YAYASAN PADA AHU' },
        { id: 3, label: 'PENGETIKKAN AKTA' },
        { id: 4, label: 'TANDA TANGAN AKTA' },
        { id: 5, label: 'PENOMORAN AKTA' },
        { id: 6, label: 'PENDAFTARAN KE KEMENKUMHAM' },
        { id: 7, label: 'PENERBITAN SK KEMENKUMHAM' },
        { id: 8, label: 'PENYERAHAN AKTA KE PEMOHON' }
      ];
    }

    if (c.serviceType === 'PT') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'DAFTAR NAMA PT PADA AHU' },
        { id: 3, label: 'PENGETIKKAN AKTA' },
        { id: 4, label: 'TANDA TANGAN AKTA' },
        { id: 5, label: 'PENOMORAN AKTA' },
        { id: 6, label: 'PENDAFTARAN KE KEMENKUMHAM' },
        { id: 7, label: 'PENERBITAN SK KEMENKUMHAM' },
        { id: 8, label: 'PENYERAHAN AKTA KE PEMOHON' }
      ];
    }

    if (c.serviceType === 'CV') {
      return [
        { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS' },
        { id: 2, label: 'DAFTAR NAMA CV PADA AHU' },
        { id: 3, label: 'PENGETIKKAN AKTA' },
        { id: 4, label: 'TANDA TANGAN AKTA' },
        { id: 5, label: 'PENOMORAN AKTA' },
        { id: 6, label: 'PENDAFTARAN KE KEMENKUMHAM' },
        { id: 7, label: 'PENERBITAN SKT KEMENKUMHAM' },
        { id: 8, label: 'PENYERAHAN AKTA KE PEMOHON' }
      ];
    }

    return [
      { id: 1, label: 'Pengecekkan Berkas' },
      { id: 2, label: 'Pengecekkan Sertifikat' },
      { id: 3, label: 'Pengetikkan Akta' },
      { id: 4, label: 'Tanda Tangan Akta' },
      { id: 5, label: 'Penomoran Akta' },
      { id: 6, label: 'Penyelesaian Berkas' },
    ];
  };

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
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[14px] text-on-surface-variant font-medium">Memuat sertifikat pelacakan berkas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">error</span>
        </div>
        <h2 className="font-bold text-[18px] text-on-surface">Pelacakan Gagal</h2>
        <p className="text-[13px] text-on-surface-variant max-w-sm mt-1">{error}</p>
        <a
          href="/track"
          className="mt-6 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-[13px] shadow-sm hover:opacity-90 transition-opacity"
        >
          Kembali ke Pencarian
        </a>
      </div>
    );
  }

  const stagesList = getStagesForCase(searchedCase);
  const activeStageId = getActiveStageId(searchedCase, stagesList);
  const isFinished = searchedCase.isComplete || searchedCase.status === 'Selesai';

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background blobs */}
      <div className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[100px] -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-secondary-container/10 rounded-full filter blur-[120px] -bottom-40 -right-40 pointer-events-none"></div>

      <div className="w-full max-w-3xl bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl p-6 md:p-10 relative text-left backdrop-blur-md overflow-hidden print:shadow-none print:border-none print:p-0">
        
        {/* Certificate Frame/Watermark */}
        <div className="absolute inset-0 border-[16px] border-double border-primary/10 rounded-3xl pointer-events-none print:hidden"></div>
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 rounded-full pointer-events-none"></div>

        {/* Certificate Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E5E7EB] pb-6 mb-8 print:border-b-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-primary leading-tight tracking-tight">LexNotary Digital</h1>
              <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">Sertifikat Status Berkas Notaris</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right md:text-right text-[12px] text-on-surface-variant font-medium">
            <p><strong>No. Berkas:</strong> {searchedCase.caseNumber}</p>
            <p className="mt-0.5"><strong>Layanan:</strong> {searchedCase.serviceType}</p>
          </div>
        </div>

        {/* Big visual completion/progress banner */}
        {isFinished ? (
          <div className="bg-secondary-container/20 border border-secondary/30 rounded-2xl p-6 text-center space-y-3 mb-8 animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-secondary text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <span className="material-symbols-outlined text-[32px] font-bold">check</span>
            </div>
            <h2 className="text-[20px] font-black text-secondary">PROSES DOKUMEN SELESAI</h2>
            <p className="text-[13px] text-on-secondary-container/80 max-w-md mx-auto leading-relaxed font-semibold">
              Berkas Anda telah selesai diproses 100% secara sah oleh Notaris. Dokumen siap diserahkan atau diambil di kantor.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[11px] font-extrabold uppercase tracking-wide">
              <span className="material-symbols-outlined text-[14px]">verified</span> Terverifikasi Notaris
            </div>
          </div>
        ) : (
          <div className="bg-primary-container/20 border border-primary/20 rounded-2xl p-6 text-center space-y-3 mb-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-[18px] font-bold text-primary">DOKUMEN SEDANG DIPROSES</h2>
            <p className="text-[12.5px] text-on-surface-variant max-w-md mx-auto font-medium">
              Berkas Anda aktif dikerjakan oleh staf legal kami. Saat ini berada pada tahap:
            </p>
            <p className="text-[15px] font-black text-on-surface uppercase tracking-wide bg-white border border-[#E5E7EB] px-4 py-1.5 rounded-full inline-block shadow-sm">
              {searchedCase.status}
            </p>
          </div>
        )}

        {/* Document Details Card */}
        <div className="bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 print:bg-white print:border-none print:p-0">
          <div className="space-y-3.5">
            <h3 className="text-[12.5px] font-black text-primary uppercase tracking-wider border-b pb-1.5 border-[#E5E7EB]">Data Kepemilikan & Syarat</h3>
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Pemilik/Klien</span>
                <strong className="text-on-surface font-bold mt-0.5 block">{searchedCase.clientName}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Syarat Dokumen</span>
                <span className="mt-1 block">
                  <StatusBadge variant="document" label={searchedCase.documentsReady ? 'LENGKAP' : 'BELUM LENGKAP'} />
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Tanggal Masuk</span>
                <strong className="text-on-surface font-bold mt-0.5 block">{formatDate(searchedCase.entryDate)}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Target Selesai</span>
                <strong className="text-on-surface font-bold mt-0.5 block">
                  {searchedCase.estimationDate ? formatDate(searchedCase.estimationDate) : 'Menyesuaikan Proses'}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-[12.5px] font-black text-primary uppercase tracking-wider border-b pb-1.5 border-[#E5E7EB]">Administrasi & Keuangan</h3>
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Status Bayar</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase mt-1 ${
                  searchedCase.paymentStatus === 'Lunas' 
                    ? 'bg-green-100 text-green-800' 
                    : searchedCase.paymentStatus === 'DP'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {searchedCase.paymentStatus || 'Belum Lunas'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Total Biaya Jasa</span>
                <strong className="text-on-surface font-bold mt-0.5 block">Rp {(searchedCase.fees || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Sudah Dibayar</span>
                <strong className="text-on-surface font-bold mt-0.5 block">Rp {(searchedCase.paidAmount || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold text-[11.5px] block">Sisa Tagihan</span>
                <strong className="text-error font-bold mt-0.5 block">
                  Rp {Math.max(0, (searchedCase.fees || 0) - (searchedCase.paidAmount || 0)).toLocaleString('id-ID')}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="space-y-4">
          <h4 className="font-bold text-on-surface text-[14px] uppercase tracking-wider border-b border-[#E5E7EB] pb-2 flex justify-between items-center print:border-b-2">
            <span>Alur Riwayat Pengerjaan Berkas</span>
            <span className="text-[11px] text-on-surface-variant/80 font-semibold">Total {stagesList.length} Tahapan</span>
          </h4>

          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-[#E5E7EB]">
            {stagesList.map((st) => {
              const isPassed = st.id < activeStageId;
              const isCurrent = st.id === activeStageId;

              let dotColor = 'bg-[#E5E7EB] border-2 border-white';
              let textColor = 'text-on-surface-variant opacity-60';

              if (isFinished || isPassed) {
                dotColor = 'bg-secondary ring-2 ring-secondary/20';
                textColor = 'text-secondary font-semibold';
              } else if (isCurrent) {
                dotColor = 'bg-primary ring-4 ring-primary/20 scale-110';
                textColor = 'text-primary font-bold';
              }

              return (
                <div key={st.id} className="relative flex flex-col text-left">
                  <div className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full transition-all duration-300 ${dotColor} flex items-center justify-center`}>
                    {(isFinished || isPassed) && (
                      <span className="text-white text-[8px] font-bold">✓</span>
                    )}
                  </div>
                  <span className={`text-[13px] ${textColor}`}>
                    {st.id}. {st.label}
                  </span>
                  {isCurrent && !isFinished && (
                    <span className="text-[11.5px] text-on-surface-variant/80 mt-0.5 italic">
                      Berkas Anda sedang berada pada tahapan ini.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Seal/Badge & Action buttons */}
        <div className="mt-10 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
          <div className="flex items-center gap-2.5 text-[11px] text-on-surface-variant font-semibold">
            <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
            <span>Didukung sistem enkripsi & database LexNotary Notaris Digital.</span>
          </div>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 border border-primary text-primary rounded-xl font-bold text-[12.5px] hover:bg-primary/5 active:scale-[0.97] transition-all flex items-center gap-1.5 bg-white shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Cetak Sertifikat</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClientPublicStatus;
