import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCases } from '../../hooks/useCases';
import { formatDate } from '../../utils/formatDate';
import { StatusBadge } from '../../components/common/StatusBadge';

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
    } else if (c.serviceType === 'PECAH') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 4,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 5,
        'Proses BPN': 5,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'GANTI') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 4,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 4,
        'Proses BPN': 4,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'KONVERSI') {
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
    } else if (c.serviceType === 'APJB' || c.serviceType === 'SKUM') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 5,
        'Proses BPN': 6,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'SEWA' || c.serviceType === 'CONSEN') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 1,
        'Penyusunan Draf': 2,
        'Tanda Tangan Akta': 3,
        'Validasi Pajak': 3,
        'Proses BPN': 4,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'APPJB') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 4,
        'Proses BPN': 5,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'APK') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 4,
        'Proses BPN': 5,
      };
      return statusMap[c.status] || 1;
    } else if (c.serviceType === 'YAYASAN' || c.serviceType === 'PT' || c.serviceType === 'CV') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 5,
        'Proses BPN': 6,
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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Visual background atmospheric elements */}
      <div className="absolute w-[400px] h-[400px] bg-primary/5 rounded-full filter blur-[80px] -top-20 -left-20"></div>
      <div className="absolute w-[400px] h-[400px] bg-secondary-container/20 rounded-full filter blur-[100px] -bottom-20 -right-20"></div>

      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 z-10 text-center relative backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="mx-auto w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            gavel
          </span>
        </div>
        
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Pelacakan Berkas Klien</h1>
        <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold mb-6">
          Masukkan nomor berkas Anda untuk memeriksa status akta secara real-time
        </p>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mb-8">
          <input
            type="text"
            required
            value={caseNum}
            onChange={(e) => setCaseNum(e.target.value)}
            className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary text-center font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal"
            placeholder="Contoh: 2026/05/001"
          />
          <button
            type="submit"
            className="px-6 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-[0.96] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
            <span>Cari</span>
          </button>
        </form>

        {/* Display results */}
        {loading ? (
          <div className="py-12 text-center text-on-surface-variant">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[13px]">Mencari berkas di database...</p>
          </div>
        ) : searched && (
          <div className="border-t border-outline-variant pt-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-200">
            {searchedCase ? (
              <div className="space-y-6">
                
                {/* File Overview */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">No. Berkas</span>
                    <p className="font-bold text-primary text-[14px] mt-0.5">{searchedCase.caseNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Klien</span>
                    <p className="font-bold text-on-surface text-[14px] mt-0.5">{searchedCase.clientName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Layanan</span>
                    <p className="font-bold text-on-surface text-[14px] mt-0.5">{searchedCase.serviceType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Syarat Dokumen</span>
                    <div className="mt-1">
                      <StatusBadge 
                        variant="document" 
                        label={searchedCase.documentsReady ? 'LENGKAP' : 'BELUM LENGKAP'} 
                      />
                    </div>
                  </div>
                </div>

                {/* Case stages progress timeline */}
                <div className="space-y-4">
                  <h4 className="font-bold text-on-surface text-[13px] uppercase tracking-wider border-b border-outline-variant pb-2 flex justify-between items-center">
                    <span>Riwayat Progres Pengerjaan Akta</span>
                    {searchedCase.status !== 'Selesai' && (
                      <span className="text-[10px] text-primary px-2 py-0.5 bg-primary/10 rounded-full font-bold animate-pulse">
                        Proses Aktif
                      </span>
                    )}
                  </h4>
                  
                  <div className="relative max-h-[320px] overflow-y-auto pr-3 py-2 scrollbar-thin">
                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-outline-variant">
                      {getStagesForCase(searchedCase).map((st) => {
                        const stagesList = getStagesForCase(searchedCase);
                        const activeStageId = getActiveStageId(searchedCase, stagesList);
                        
                        const isPassed = st.id < activeStageId;
                        const isCurrent = st.id === activeStageId;
                        
                        let dotColor = 'bg-outline-variant';
                        let textColor = 'text-on-surface-variant opacity-60';

                        if (searchedCase.status === 'Selesai' || isPassed) {
                          dotColor = 'bg-secondary';
                          textColor = 'text-secondary font-semibold';
                        } else if (isCurrent) {
                          dotColor = 'bg-primary ring-4 ring-primary/20 scale-110';
                          textColor = 'text-primary font-bold';
                        }

                        return (
                          <div key={st.id} className="relative flex flex-col text-left">
                            <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full transition-all duration-300 ${dotColor} flex items-center justify-center`}>
                              {(searchedCase.status === 'Selesai' || isPassed) && (
                                <span className="text-white text-[7px] font-bold">✓</span>
                              )}
                            </div>
                            <span className={`text-[13px] ${textColor}`}>
                              {st.id}. {st.label}
                            </span>
                            {isCurrent && searchedCase.status !== 'Selesai' && (
                              <span className="text-[11px] text-on-surface-variant mt-0.5 animate-pulse">
                                Akta Anda sedang berada pada tahapan proses ini.
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-primary-container/10 p-3 rounded-lg border border-primary-container text-primary text-[11px] font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Dokumen akta ini dilindungi oleh undang-undang Notaris Republik Indonesia secara sah.</span>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center bg-error-container/10 rounded-xl border border-dashed border-error-container text-error">
                <span className="material-symbols-outlined text-[40px] mb-2">error</span>
                <p className="font-bold text-[14px]">Berkas Tidak Ditemukan!</p>
                <p className="text-[12px] text-on-surface-variant mt-1">
                  Mohon periksa kembali nomor berkas yang Anda masukkan. Pastikan sesuai dengan format (contoh: 2026/05/001).
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 pt-4 border-t border-outline-variant text-center text-[12px] text-on-surface-variant font-medium">
          <span>Notaris Digital &copy; 2026</span>
        </div>

      </div>
    </div>
  );
};

export default ClientTrackingPage;
