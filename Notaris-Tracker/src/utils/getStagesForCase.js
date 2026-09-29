/**
 * Central Utility for Case Timeline Stages (Alur Tahapan Berkas Akta)
 * Used across ClientPublicStatus, ClientTrackingPage, OwnerDocumentsPage, and DocumentDetailPage.
 */

export const getStagesForCase = (c) => {
  if (!c) return [];

  const categoryLower = c.category?.toLowerCase() || '';
  const serviceTypeUpper = c.serviceType?.toUpperCase() || '';

  const isPPAT =
    categoryLower === 'ppat' ||
    ['AJB', 'HIBAH', 'APHB', 'APHT', 'WARIS', 'ROYA', 'PECAH', 'GANTI', 'KONVERSI', 'SKMHT', 'HT', 'HGB', 'HAK_PAKAI'].includes(serviceTypeUpper);

  if (serviceTypeUpper === 'APHT') {
    return [
      { id: 1, label: 'Pengecekan kelengkapan Berkas', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'Pengecekan sertifikat', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'Pengetikan akta', statusKey: 'Penyusunan Draf' },
      { id: 4, label: 'Tanda tangan akta', statusKey: 'Tanda Tangan Akta' },
      { id: 5, label: 'Penomoran akta', statusKey: 'Tanda Tangan Akta' },
      { id: 6, label: 'Pendaftaran akta pada aplikasi mitra kerja atr bpn dan spa', statusKey: 'Proses BPN' },
      { id: 7, label: 'Backup pada aplikasi bank', statusKey: 'Proses BPN' },
      { id: 8, label: 'Verifikasi berkas oleh bpn melalui aplikasi mutra kerja atr bpn', statusKey: 'Proses BPN' },
      { id: 9, label: 'Berkas dikembalikan atau telah diverifikasi oleh bpn', statusKey: 'Proses BPN' },
      { id: 10, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
      { id: 11, label: 'Verifikasi oleh bpn pada aplikasi bank', statusKey: 'Proses BPN' },
      { id: 12, label: 'Penerbitan sht', statusKey: 'Proses BPN' },
      { id: 13, label: 'Penyerahan berkas kepada pihak bank', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'AJB' || serviceTypeUpper === 'HIBAH' || serviceTypeUpper === 'APHB' || isPPAT) {
    if (serviceTypeUpper === 'WARIS' || serviceTypeUpper === 'ROYA') {
      return [
        { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
        { id: 2, label: 'Proses validasi sertifikat', statusKey: 'Verifikasi Sertifikat' },
        { id: 3, label: 'Proses pengecekan sertifikat', statusKey: 'Verifikasi Sertifikat' },
        { id: 4, label: 'Pembayaran pajak peralihan', statusKey: 'Validasi Pajak' },
        { id: 5, label: 'Validasi pajak peralihan', statusKey: 'Validasi Pajak' },
        { id: 6, label: 'Pendaftaran pada atr bpn', statusKey: 'Proses BPN' },
        { id: 7, label: 'Pemeriksaaan berkas oleh bpn', statusKey: 'Proses BPN' },
        { id: 8, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
        { id: 9, label: 'Cari buku tanah di warkah bpn', statusKey: 'Proses BPN' },
        { id: 10, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
        { id: 11, label: 'Pemeriksaan draft sertifikat', statusKey: 'Proses BPN' },
        { id: 12, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
        { id: 13, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
        { id: 14, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
        { id: 15, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
      ];
    }
    if (serviceTypeUpper === 'PECAH') {
      return [
        { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
        { id: 2, label: 'Pengecekan ke bpn status tanah yang kan dipecah', statusKey: 'Verifikasi Sertifikat' },
        { id: 3, label: 'Pendaftaran ukur pemechan', statusKey: 'Verifikasi Sertifikat' },
        { id: 4, label: 'Pengajuan tapak kapling', statusKey: 'Penyusunan Draf' },
        { id: 5, label: 'Masuk berkas fisik ke bpn', statusKey: 'Proses BPN' },
        { id: 6, label: 'Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN' },
        { id: 7, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
        { id: 8, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
        { id: 9, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN' },
        { id: 10, label: 'Cari buku tanah di warkah bpn', statusKey: 'Proses BPN' },
        { id: 11, label: 'Pemeriksaan draft sertifikat', statusKey: 'Proses BPN' },
        { id: 12, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
        { id: 13, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
        { id: 14, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
        { id: 15, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
      ];
    }
    if (serviceTypeUpper === 'GANTI') {
      return [
        { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
        { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat' },
        { id: 3, label: 'Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat' },
        { id: 4, label: 'Masuk berkas fisik ke bpn', statusKey: 'Proses BPN' },
        { id: 5, label: 'Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN' },
        { id: 6, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
        { id: 7, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
        { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN' },
        { id: 9, label: 'Cari buku tanah di warkah bpn', statusKey: 'Proses BPN' },
        { id: 10, label: 'Pemriksaaan draft sertifikat', statusKey: 'Proses BPN' },
        { id: 11, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
        { id: 12, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
        { id: 13, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
        { id: 14, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
      ];
    }
    if (serviceTypeUpper === 'KONVERSI') {
      return [
        { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
        { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat' },
        { id: 3, label: 'Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat' },
        { id: 4, label: 'Masuk berkas fisik ke bpn', statusKey: 'Proses BPN' },
        { id: 5, label: 'Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN' },
        { id: 6, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
        { id: 7, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
        { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN' },
        { id: 9, label: 'Panitia lapang oleh petugas bpn', statusKey: 'Proses BPN' },
        { id: 10, label: 'pengumuman', statusKey: 'Proses BPN' },
        { id: 11, label: 'Pemeriksaan draft sertifikat', statusKey: 'Proses BPN' },
        { id: 12, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
        { id: 13, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
        { id: 14, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
        { id: 15, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
      ];
    }

    // Default PPAT stages (AJB/HIBAH/APHB/SKMHT/HT/HGB/HAK_PAKAI)
    return [
      { id: 1, label: 'Pengecekan Berkas', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'Validasi Sertifikat', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'Pengecekan Sertifikat', statusKey: 'Verifikasi Sertifikat' },
      { id: 4, label: 'Pengetikan Akta', statusKey: 'Penyusunan Draf' },
      { id: 5, label: 'Tanda Tangan Akta', statusKey: 'Tanda Tangan Akta' },
      { id: 6, label: 'Pembayaran Pajak Peralihan', statusKey: 'Validasi Pajak' },
      { id: 7, label: 'Validasi Pajak Peralihan (PPH Final)', statusKey: 'Validasi Pajak' },
      { id: 8, label: 'Penomoran Akta', statusKey: 'Validasi Pajak' },
      { id: 9, label: 'Pendaftaran Akta', statusKey: 'Proses BPN' },
      { id: 10, label: 'Masuk Berkas Fisik ke BPN', statusKey: 'Proses BPN' },
      { id: 11, label: 'Pemeriksaan Berkas oleh BPN', statusKey: 'Proses BPN' },
      { id: 12, label: 'Pencarian Buku Tanah', statusKey: 'Proses BPN' },
      { id: 13, label: 'Pembayaran SPS', statusKey: 'Proses BPN' },
      { id: 14, label: 'Pemeriksaan Draft Sertifikat', statusKey: 'Proses BPN' },
      { id: 15, label: 'Draft Sertifikat', statusKey: 'Proses BPN' },
      { id: 16, label: 'Penerbitan Sertifikat', statusKey: 'Proses BPN' },
      { id: 17, label: 'Loket Penyerahan Produk', statusKey: 'Proses BPN' },
      { id: 18, label: 'Penyerahan kepada Pemohon', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'WARIS' || serviceTypeUpper === 'ROYA') {
    return [
      { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'Proses validasi sertifikat', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'Proses pengecekan sertifikat', statusKey: 'Verifikasi Sertifikat' },
      { id: 4, label: 'Pembayaran pajak peralihan', statusKey: 'Validasi Pajak' },
      { id: 5, label: 'Validasi pajak peralihan', statusKey: 'Validasi Pajak' },
      { id: 6, label: 'Pendaftaran pada atr bpn', statusKey: 'Proses BPN' },
      { id: 7, label: 'Pemeriksaaan berkas oleh bpn', statusKey: 'Proses BPN' },
      { id: 8, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
      { id: 9, label: 'Cari buku tanah di warkah bpn', statusKey: 'Proses BPN' },
      { id: 10, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
      { id: 11, label: 'Pemeriksaan draft sertifikat', statusKey: 'Proses BPN' },
      { id: 12, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
      { id: 13, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
      { id: 14, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
      { id: 15, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'PECAH') {
    return [
      { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'Pengecekan ke bpn status tanah yang kan dipecah', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'Pendaftaran ukur pemechan', statusKey: 'Verifikasi Sertifikat' },
      { id: 4, label: 'Pengajuan tapak kapling', statusKey: 'Penyusunan Draf' },
      { id: 5, label: 'Masuk berkas fisik ke bpn', statusKey: 'Proses BPN' },
      { id: 6, label: 'Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN' },
      { id: 7, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
      { id: 8, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
      { id: 9, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN' },
      { id: 10, label: 'Cari buku tanah di warkah bpn', statusKey: 'Proses BPN' },
      { id: 11, label: 'Pemeriksaan draft sertifikat', statusKey: 'Proses BPN' },
      { id: 12, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
      { id: 13, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
      { id: 14, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
      { id: 15, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'GANTI') {
    return [
      { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat' },
      { id: 4, label: 'Masuk berkas fisik ke bpn', statusKey: 'Proses BPN' },
      { id: 5, label: 'Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN' },
      { id: 6, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
      { id: 7, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
      { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN' },
      { id: 9, label: 'Cari buku tanah di warkah bpn', statusKey: 'Proses BPN' },
      { id: 10, label: 'Pemriksaaan draft sertifikat', statusKey: 'Proses BPN' },
      { id: 11, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
      { id: 12, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
      { id: 13, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
      { id: 14, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'KONVERSI') {
    return [
      { id: 1, label: 'Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat' },
      { id: 4, label: 'Masuk berkas fisik ke bpn', statusKey: 'Proses BPN' },
      { id: 5, label: 'Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN' },
      { id: 6, label: 'Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN' },
      { id: 7, label: 'Pembayaran sps', statusKey: 'Proses BPN' },
      { id: 8, label: 'Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN' },
      { id: 9, label: 'Panitia lapang oleh petugas bpn', statusKey: 'Proses BPN' },
      { id: 10, label: 'pengumuman', statusKey: 'Proses BPN' },
      { id: 11, label: 'Pemeriksaan draft sertifikat', statusKey: 'Proses BPN' },
      { id: 12, label: 'Draft sertifikat', statusKey: 'Proses BPN' },
      { id: 13, label: 'Penerbitan sertifikat', statusKey: 'Proses BPN' },
      { id: 14, label: 'Loket penyerahan produk', statusKey: 'Proses BPN' },
      { id: 15, label: 'Penyerahan kepada pemohon', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'FIDUSIA') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 3, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 4, label: 'PENOMORAN AKTA', statusKey: 'Proses BPN' },
      { id: 5, label: 'PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 6, label: 'PENERBITAN SK KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 7, label: 'PENYERAHAN AKTA KE PIHAK BANK', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'APJB' || serviceTypeUpper === 'SKUM') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'PENGECEKKAN SERTIFIKAT', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 4, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 5, label: 'PEMBAYARAN PAJAK PERALIHAN', statusKey: 'Validasi Pajak' },
      { id: 6, label: 'PENOMORAN AKTA', statusKey: 'Proses BPN' },
      { id: 7, label: 'PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'SEWA' || serviceTypeUpper === 'CONSEN') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 3, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 4, label: 'PENOMORAN AKTA', statusKey: 'Proses BPN' },
      { id: 5, label: 'PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'APPJB') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'PENGECEKKAN SERTIFIKAT', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 4, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 5, label: 'PENOMORAN AKTA', statusKey: 'Proses BPN' }
    ];
  }

  if (serviceTypeUpper === 'APK') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'PENGECEKKAN SERTIFIKAT', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 4, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 5, label: 'PENOMORAN AKTA', statusKey: 'Proses BPN' },
      { id: 6, label: 'PENYERAHAN AKTA KE PIHAK BANK', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'YAYASAN') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'DAFTAR NAMA YAYASAN PADA AHU', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 4, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 5, label: 'PENOMORAN AKTA', statusKey: 'Validasi Pajak' },
      { id: 6, label: 'PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 7, label: 'PENERBITAN SK KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 8, label: 'PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'PT') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'DAFTAR NAMA PT PADA AHU', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 4, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 5, label: 'PENOMORAN AKTA', statusKey: 'Validasi Pajak' },
      { id: 6, label: 'PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 7, label: 'PENERBITAN SK KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 8, label: 'PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai' }
    ];
  }

  if (serviceTypeUpper === 'CV') {
    return [
      { id: 1, label: 'PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen' },
      { id: 2, label: 'DAFTAR NAMA CV PADA AHU', statusKey: 'Verifikasi Sertifikat' },
      { id: 3, label: 'PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf' },
      { id: 4, label: 'TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta' },
      { id: 5, label: 'PENOMORAN AKTA', statusKey: 'Validasi Pajak' },
      { id: 6, label: 'PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 7, label: 'PENERBITAN SKT KEMENKUMHAM', statusKey: 'Proses BPN' },
      { id: 8, label: 'PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai' }
    ];
  }

  return [
    { id: 1, label: 'Pengecekkan Berkas', statusKey: 'Pemeriksaan Dokumen' },
    { id: 2, label: 'Pengecekkan Sertifikat', statusKey: 'Verifikasi Sertifikat' },
    { id: 3, label: 'Pengetikkan Akta', statusKey: 'Penyusunan Draf' },
    { id: 4, label: 'Tanda Tangan Akta', statusKey: 'Tanda Tangan Akta' },
    { id: 5, label: 'Penomoran Akta', statusKey: 'Proses BPN' },
    { id: 6, label: 'Penyelesaian Berkas', statusKey: 'Selesai' }
  ];
};

export default getStagesForCase;
