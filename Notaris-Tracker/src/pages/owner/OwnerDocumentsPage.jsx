import React, { useState, useMemo, useEffect } from 'react';
import { useCases } from '../../hooks/useCases';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { SERVICE_TYPES, SERVICE_CATEGORIES, getCaseCategory } from '../../constants/serviceTypes';
import DateFilter from '../../components/common/DateFilter';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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
      { id: 18, label: 'Penyerahan kepada Pemohon' }
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
    { id: 6, label: 'Penyelesaian Berkas' }
  ];
};

const getActiveStageId = (c, stagesList) => {
  if (!c) return 1;
  if (c.status === 'Selesai') {
    return stagesList.length + 1;
  }
  if (c.currentStageId !== undefined && c.currentStageId !== null && c.currentStageId !== 0) {
    return c.currentStageId;
  }

  // Fallbacks
  if (c.serviceType === 'AJB' || c.serviceType === 'HIBAH' || c.serviceType === 'APHB') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 4,
      'Tanda Tangan Akta': 5,
      'Validasi Pajak': 6,
      'Proses BPN': 8
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'APHT') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 3,
      'Tanda Tangan Akta': 4,
      'Proses BPN': 6
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'WARIS' || c.serviceType === 'ROYA') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Validasi Pajak': 4,
      'Proses BPN': 6
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'PECAH') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 4,
      'Validasi Pajak': 5,
      'Proses BPN': 5
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'GANTI') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 4,
      'Tanda Tangan Akta': 4,
      'Validasi Pajak': 4,
      'Proses BPN': 4
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'KONVERSI') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 4,
      'Tanda Tangan Akta': 4,
      'Validasi Pajak': 4,
      'Proses BPN': 4
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'FIDUSIA') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 1,
      'Penyusunan Draf': 2,
      'Tanda Tangan Akta': 3,
      'Validasi Pajak': 5,
      'Proses BPN': 5
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'APJB' || c.serviceType === 'SKUM') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 3,
      'Tanda Tangan Akta': 4,
      'Validasi Pajak': 5,
      'Proses BPN': 6
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'SEWA' || c.serviceType === 'CONSEN') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 1,
      'Penyusunan Draf': 2,
      'Tanda Tangan Akta': 3,
      'Validasi Pajak': 3,
      'Proses BPN': 4
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'APPJB') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 3,
      'Tanda Tangan Akta': 4,
      'Validasi Pajak': 4,
      'Proses BPN': 5
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'APK') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 3,
      'Tanda Tangan Akta': 4,
      'Validasi Pajak': 4,
      'Proses BPN': 5
    };
    return statusMap[c.status] || 1;
  } else if (c.serviceType === 'YAYASAN' || c.serviceType === 'PT' || c.serviceType === 'CV') {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 3,
      'Tanda Tangan Akta': 4,
      'Validasi Pajak': 5,
      'Proses BPN': 6
    };
    return statusMap[c.status] || 1;
  } else {
    const statusMap = {
      'Pemeriksaan Dokumen': 1,
      'Verifikasi Sertifikat': 2,
      'Penyusunan Draf': 3,
      'Tanda Tangan Akta': 4,
      'Proses BPN': 5
    };
    return statusMap[c.status] || 1;
  }
};

export const OwnerDocumentsPage = () => {
  const { cases, deleteCase, updateCase } = useCases();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterService, setFilterService] = useState('Semua');
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [staffList, setStaffList] = useState([]);

  // Fetch all staff profiles for assignment dropdown
  useEffect(() => {
    const fetchStaff = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'staff');
      if (!error && data) {
        setStaffList(data);
      }
    };
    fetchStaff();
  }, []);

  // Dynamically derive service options based on selected category
  const serviceOptions = useMemo(() => {
    const list = Object.values(SERVICE_TYPES);
    if (filterCategory === 'Semua') {
      return [{ id: 'Semua', label: 'Semua Layanan' }, ...list];
    }
    const filteredList = list.filter(s => s.category === filterCategory);
    return [{ id: 'Semua', label: 'Semua Layanan' }, ...filteredList];
  }, [filterCategory]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        c.clientName.toLowerCase().includes(search.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(search.toLowerCase());
      
      const categoryOfCase = getCaseCategory(c);
      const matchCategory = filterCategory === 'Semua' || categoryOfCase === filterCategory;
      
      const matchService = filterService === 'Semua' || c.serviceType === filterService;

      // Period filter check
      if (!c.entryDate) return false;
      const [yStr, mStr, dStr] = c.entryDate.split('-');
      const cYear = parseInt(yStr, 10);
      const cMonth = parseInt(mStr, 10);
      const cDay = parseInt(dStr, 10);

      if (filterYear !== 'ALL' && cYear !== parseInt(filterYear, 10)) return false;
      if (filterMonth !== 'ALL' && cMonth !== parseInt(filterMonth, 10)) return false;
      if (filterDate !== 'ALL' && cDay !== parseInt(filterDate, 10)) return false;

      return matchSearch && matchCategory && matchService;
    });
  }, [cases, search, filterCategory, filterService, filterDate, filterMonth, filterYear]);

  const handleDelete = (id) => {
    deleteCase(id);
    setConfirmDeleteId(null);
    if (selectedCase?.id === id) setSelectedCase(null);
  };

  // Read-only dynamic timeline for Owner, matching the Staff's workflow stages

  return (
    <div className="space-y-stack-lg text-left">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Manajemen Dokumen</h2>
          <p className="text-body-lg text-on-surface-variant mt-1">Pantau dan kelola seluruh berkas akta yang sedang berjalan.</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">folder_open</span>
          {filtered.length} dari {cases.length} berkas
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama klien atau nomor berkas..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary text-[13px]"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setFilterService('Semua');
          }}
          className="py-2.5 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-[12px] font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="Semua">Semua Kategori</option>
          <option value={SERVICE_CATEGORIES.PPAT}>PPAT</option>
          <option value={SERVICE_CATEGORIES.NOTARIS}>Notaris</option>
        </select>

        {/* Service Filter */}
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="py-2.5 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-[12px] font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {serviceOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <DateFilter
          date={filterDate}
          month={filterMonth}
          year={filterYear}
          onDateChange={setFilterDate}
          onMonthChange={setFilterMonth}
          onYearChange={setFilterYear}
        />

        {(search || filterCategory !== 'Semua' || filterService !== 'Semua' || filterDate !== 'ALL' || filterMonth !== 'ALL' || filterYear !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setFilterCategory('Semua');
              setFilterService('Semua');
              setFilterDate('ALL');
              setFilterMonth('ALL');
              setFilterYear('ALL');
            }}
            className="py-2.5 px-3 text-error border border-error/30 rounded-lg text-[12px] font-bold hover:bg-error/5 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
            Reset
          </button>
        )}
      </div>

      {/* Main 2-column layout: table + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-grid">
        {/* Table */}
        <div className={`${selectedCase ? 'lg:col-span-7' : 'lg:col-span-12'} bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">No. Berkas</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Klien</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Layanan</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Dokumen</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tenggat</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant text-[13px]">
                      <span className="material-symbols-outlined text-[40px] block mb-2 opacity-40">search_off</span>
                      Tidak ada berkas yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const isOverdue = !c.isComplete && c.estimationDate && new Date(c.estimationDate) < new Date();
                    const isSelected = selectedCase?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCase(isSelected ? null : c)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-surface-container-low'}`}
                      >
                        <td className="px-4 py-3 font-bold text-primary text-[13px]">{c.caseNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-on-surface text-[13px]">{c.clientName}</p>
                          <p className="text-[11px] text-on-surface-variant">{c.clientId}</p>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-on-surface-variant">{SERVICE_TYPES[c.serviceType]?.label || c.serviceType}</td>
                        <td className="px-4 py-3">
                          <StatusBadge variant="status" label={c.status} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant="document" label={c.documentsReady ? 'LENGKAP' : 'BELUM'} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[12px] font-semibold ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                            {isOverdue && <span className="material-symbols-outlined text-[13px] align-middle mr-0.5">warning</span>}
                            {formatDate(c.estimationDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                            className="text-on-surface-variant hover:text-error transition-colors"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedCase && (
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-primary text-[15px]">{selectedCase.caseNumber}</h3>
                <p className="text-on-surface font-semibold text-[18px] mt-0.5">{selectedCase.clientName}</p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">ID Klien</p>
                <p className="font-semibold text-on-surface text-[13px] mt-0.5">{selectedCase.clientId}</p>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Layanan</p>
                <p className="font-semibold text-on-surface text-[13px] mt-0.5">{SERVICE_TYPES[selectedCase.serviceType]?.label || selectedCase.serviceType}</p>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Tenggat</p>
                <p className="font-semibold text-on-surface text-[13px] mt-0.5">{formatDate(selectedCase.estimationDate)}</p>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Petugas Staf</p>
                <select
                  value={selectedCase.assignedStaffId || ''}
                  onChange={async (e) => {
                    const nextId = e.target.value || null;
                    try {
                      await updateCase(selectedCase.id, { assignedStaffId: nextId });
                      const matchedStaff = staffList.find(st => st.id === nextId);
                      setSelectedCase(prev => ({
                        ...prev,
                        assignedStaffId: nextId,
                        assignedStaff: matchedStaff ? matchedStaff.full_name : 'Belum ditugaskan'
                      }));
                      toast.success('Petugas staf berhasil ditugaskan!');
                    } catch (err) {
                      console.error(err);
                      toast.error('Gagal menugaskan petugas staf.');
                    }
                  }}
                  className="bg-transparent font-semibold text-on-surface text-[13px] mt-0.5 w-full focus:outline-none border-none cursor-pointer text-left"
                >
                  <option value="">Belum ditugaskan</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            {selectedCase.notes && (
              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Catatan</p>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">{selectedCase.notes}</p>
              </div>
            )}

            {/* Progress Timeline */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Progress Pengerjaan</p>
                <span className="text-[11px] text-on-surface-variant/80 font-semibold bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant">
                  Total {getStagesForCase(selectedCase).length} Tahapan
                </span>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {getStagesForCase(selectedCase).map((st) => {
                  const stagesList = getStagesForCase(selectedCase);
                  const activeStageId = getActiveStageId(selectedCase, stagesList);
                  const isPassed = st.id < activeStageId;
                  const isCurrent = st.id === activeStageId;
                  return (
                    <div key={st.id} className={`flex items-center gap-3 py-1.5 px-3 rounded-lg ${isCurrent ? 'bg-primary/10' : ''}`}>
                      <span className={`material-symbols-outlined text-[18px] ${isPassed ? 'text-secondary' : isCurrent ? 'text-primary' : 'text-outline-variant'}`}>
                        {isPassed ? 'check_circle' : isCurrent ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      <span className={`text-[12px] font-semibold ${isPassed ? 'text-secondary' : isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}>
                        {st.id}. {st.label.replace(/^\d+\.\s*/, '')}
                      </span>
                    </div>
                  );
                })}
              </div>
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
            <p className="text-[13px] text-on-surface-variant mb-6">Tindakan ini tidak dapat dibatalkan. Berkas akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-[13px] font-bold hover:bg-surface-container-low transition-colors">Batal</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 bg-error text-on-error rounded-lg text-[13px] font-bold hover:opacity-90 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDocumentsPage;
