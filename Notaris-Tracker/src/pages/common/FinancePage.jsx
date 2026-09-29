import React, { useState, useEffect, useMemo } from 'react';
import { useCases } from '../../hooks/useCases';
import { StatusBadge } from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

import DateFilter from '../../components/common/DateFilter';
import { useAuth } from '../../hooks/useAuth';

const formatNumberWithDots = (num) => {
  if (num === undefined || num === null || num === '') return '';
  const clean = String(num).replace(/\D/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
};

const parseDotsToNumber = (str) => {
  if (!str) return 0;
  
  let clean = String(str).toLowerCase().trim();
  
  let multiplier = 1;
  if (clean.includes('jt') || clean.includes('juta')) {
    multiplier = 1000000;
    clean = clean.replace(/jt|juta/g, '').trim();
  } else if (clean.includes('m') || clean.includes('miliar') || clean.includes('milyar')) {
    multiplier = 1000000000;
    clean = clean.replace(/miliar|milyar|m/g, '').trim();
  } else if (clean.includes('rb') || clean.includes('ribu')) {
    multiplier = 1000;
    clean = clean.replace(/rb|ribu/g, '').trim();
  }
  
  clean = clean.replace(/,/g, '.');
  
  const dotCount = (clean.match(/\./g) || []).length;
  if (dotCount > 1) {
    clean = clean.replace(/\./g, '');
  } else if (dotCount === 1) {
    const parts = clean.split('.');
    if (multiplier === 1) {
      if (parts[1].length === 3) {
        clean = clean.replace(/\./g, '');
      }
    }
  }
  
  clean = clean.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean) || 0;
  return Math.round(parsed * multiplier);
};

const CurrencyInput = ({ id, value, onChange, className, placeholder, required = false, disabled = false }) => {
  const [tempValue, setTempValue] = useState(formatNumberWithDots(value));

  useEffect(() => {
    setTempValue(formatNumberWithDots(value));
  }, [value]);

  const handleChange = (e) => {
    if (disabled) return;
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setTempValue('');
      onChange(0);
      return;
    }
    const numVal = parseInt(rawVal, 10);
    setTempValue(numVal.toLocaleString('id-ID'));
    onChange(numVal);
  };

  return (
    <input
      id={id}
      type="text"
      required={required}
      disabled={disabled}
      value={tempValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

export const FinancePage = () => {
  const { cases, updateCase } = useCases();
  const { profile } = useAuth();
  const isOwner = profile?.role === 'owner';

  // Local UI filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [serviceFilter, setServiceFilter] = useState('Semua');
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');

  // Modal State
  const [editingCase, setEditingCase] = useState(null);
  const [editFees, setEditFees] = useState(0);
  const [editPaidAmount, setEditPaidAmount] = useState(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState('Belum Lunas');
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill and auto-calculate on modal state change
  const handleOpenEditModal = (c) => {
    setEditingCase(c);
    setEditFees(c.fees || 0);
    setEditPaidAmount(c.paidAmount || 0);
    setEditPaymentStatus(c.paymentStatus || 'Belum Lunas');
  };

  const handlePaidAmountChange = (val) => {
    const amt = Number(val) || 0;
    setEditPaidAmount(amt);
    
    if (amt >= editFees && editFees > 0) {
      setEditPaymentStatus('Lunas');
    } else if (amt > 0) {
      setEditPaymentStatus('DP');
    } else {
      setEditPaymentStatus('Belum Lunas');
    }
  };

  const handleFeesChange = (val) => {
    const f = Number(val) || 0;
    setEditFees(f);
    
    if (editPaidAmount >= f && f > 0) {
      setEditPaymentStatus('Lunas');
    } else if (editPaidAmount > 0) {
      setEditPaymentStatus('DP');
    } else {
      setEditPaymentStatus('Belum Lunas');
    }
  };

  const handleSavePayment = async () => {
    if (editFees < 0) {
      toast.error('Total biaya tidak boleh negatif!');
      return;
    }
    if (editPaidAmount < 0) {
      toast.error('Nominal dibayar tidak boleh negatif!');
      return;
    }
    if (editFees > 0 && editPaidAmount > editFees) {
      toast.error('Nominal dibayar tidak boleh melebihi total biaya akta!');
      return;
    }

    setSubmitting(true);
    try {
      await updateCase(editingCase.id, {
        fees: Number(editFees),
        paidAmount: Number(editPaidAmount),
        paymentStatus: editPaymentStatus
      });
      toast.success('Informasi pembayaran berhasil diperbarui!');
      setEditingCase(null);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui data pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get service options for filter
  const serviceOptions = useMemo(() => {
    const services = new Set(cases.map(c => c.serviceType));
    return ['Semua', ...Array.from(services)];
  }, [cases]);

  // Filter cases dynamically by selected period
  const dateFilteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (!c.entryDate) return false;
      const [yStr, mStr, dStr] = c.entryDate.split('-');
      const cYear = parseInt(yStr, 10);
      const cMonth = parseInt(mStr, 10);
      const cDay = parseInt(dStr, 10);

      if (filterYear !== 'ALL' && cYear !== parseInt(filterYear, 10)) return false;
      if (filterMonth !== 'ALL' && cMonth !== parseInt(filterMonth, 10)) return false;
      if (filterDate !== 'ALL' && cDay !== parseInt(filterDate, 10)) return false;

      return true;
    });
  }, [cases, filterDate, filterMonth, filterYear]);

  // Calculations for Financial Summary Cards
  const stats = useMemo(() => {
    let totalTarget = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;

    dateFilteredCases.forEach((c) => {
      totalTarget += c.fees || 0;
      totalReceived += c.paidAmount || 0;
      totalOutstanding += Math.max(0, (c.fees || 0) - (c.paidAmount || 0));
    });

    const percentPaid = totalTarget > 0 ? Math.round((totalReceived / totalTarget) * 100) : 0;

    return {
      totalTarget,
      totalReceived,
      totalOutstanding,
      percentPaid
    };
  }, [dateFilteredCases]);

  // Filtered cases list
  const filteredCases = useMemo(() => {
    return dateFilteredCases.filter((c) => {

      const matchesSearch = 
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'Semua' || 
        c.paymentStatus === statusFilter;

      const matchesService = 
        serviceFilter === 'Semua' || 
        c.serviceType === serviceFilter;

      return matchesSearch && matchesStatus && matchesService;
    });
  }, [dateFilteredCases, searchQuery, statusFilter, serviceFilter]);

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Header */}
      <div>
        <h2 className="text-headline-md font-bold text-on-surface">Laporan & Pelacakan Keuangan Berkas</h2>
        <p className="text-[13px] text-on-surface-variant mt-1">
          Pantau sisa tagihan (piutang), nominal pembayaran masuk (DP/Lunas), dan realisasi target pendapatan notaris.
        </p>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 select-none">
        {/* KPI 1: Target Pendapatan */}
        <div className="bg-[#EDFAF3] border border-[#D5F5E4] p-5 rounded-[22px] flex flex-col justify-between shadow-[0_8px_20px_rgba(16,185,129,0.06)] min-h-[120px]">
          <div>
            <p className="text-emerald-800 font-bold text-[11.5px] uppercase tracking-wider">
              Total Target Biaya Berkas
            </p>
            <h3 className="text-[22px] font-black text-emerald-950 mt-1.5">
              Rp {stats.totalTarget.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-[#10B981] h-full rounded-full w-full"></div>
          </div>
        </div>

        {/* KPI 2: Dana Masuk */}
        <div className="bg-[#EEF9FD] border border-[#D2EEFB] p-5 rounded-[22px] flex flex-col justify-between shadow-[0_8px_20px_rgba(14,165,233,0.06)] min-h-[120px]">
          <div>
            <p className="text-sky-800 font-bold text-[11.5px] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Dana Masuk (Diterima)
            </p>
            <h3 className="text-[22px] font-black text-sky-950 mt-1.5">
              Rp {stats.totalReceived.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-full bg-sky-200/50 h-2 rounded-full overflow-hidden mt-4">
            <div 
              className="bg-[#0EA5E9] h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.percentPaid}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 3: Piutang Berjalan */}
        <div className="bg-[#FDF0F3] border border-[#FCDCE3] p-5 rounded-[22px] flex flex-col justify-between shadow-[0_8px_20px_rgba(239,68,68,0.06)] min-h-[120px]">
          <div>
            <p className="text-rose-800 font-bold text-[11.5px] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Piutang Berjalan (Sisa Tagihan)
            </p>
            <h3 className="text-[22px] font-black text-rose-950 mt-1.5">
              Rp {stats.totalOutstanding.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-full bg-rose-200/50 h-2 rounded-full overflow-hidden mt-4">
            <div 
              className="bg-[#EF4444] h-full rounded-full transition-all duration-500"
              style={{ width: `${100 - stats.percentPaid}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 4: Persentase Realisasi */}
        <div className="bg-[#F3F2FD] border border-[#E4E2FB] p-5 rounded-[22px] flex flex-col justify-between shadow-[0_8px_20px_rgba(99,102,241,0.06)] min-h-[120px]">
          <div>
            <p className="text-[#6366F1] font-bold text-[11.5px] uppercase tracking-wider">
              Realisasi Pembayaran
            </p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <h3 className="text-[32px] font-black text-[#6366F1] leading-none">
                {stats.percentPaid}%
              </h3>
              <span className="text-[11.5px] font-bold text-slate-500">Lunas / DP</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold leading-none mt-3">
            Dari seluruh berkas yang didaftarkan.
          </p>
        </div>
      </div>

      {/* Table & Filters Card */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] shadow-[0_10px_30px_rgba(112,144,176,0.06)] overflow-hidden">
        
        {/* Filters Panel */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari Klien / No. Berkas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            {/* Date Filter */}
            <DateFilter
              date={filterDate}
              month={filterMonth}
              year={filterYear}
              onDateChange={setFilterDate}
              onMonthChange={setFilterMonth}
              onYearChange={setFilterYear}
            />

            {/* Filter Layanan */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-3.5 pr-8 h-10 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-[#6366F1] shadow-xs cursor-pointer appearance-none transition-all"
              >
                {serviceOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt === 'Semua' ? 'Semua Layanan' : opt}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Filter Status Bayar */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-3.5 pr-8 h-10 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-[#6366F1] shadow-xs cursor-pointer appearance-none transition-all"
              >
                <option value="Semua">Semua Pembayaran</option>
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="DP">DP (Sebagian)</option>
                <option value="Lunas">Lunas</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-[#F1F5F9]">
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">No. Berkas</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Nama Klien</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Layanan</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Total Biaya</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Sudah Dibayar</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Sisa Tagihan</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Status</th>
                {isOwner && (
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 8 : 7} className="px-5 py-16 text-center text-on-surface-variant text-[13px]">
                    <span className="material-symbols-outlined text-[48px] block mb-2 opacity-30">credit_card_off</span>
                    Tidak ada data transaksi pengerjaan berkas.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const sisa = Math.max(0, (c.fees || 0) - (c.paidAmount || 0));
                  return (
                    <tr key={c.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-[13px] text-primary whitespace-nowrap">{c.caseNumber}</td>
                      <td className="px-5 py-4 font-bold text-[13px] text-on-surface">{c.clientName}</td>
                      <td className="px-5 py-4 font-semibold text-[12px] text-on-surface-variant">{c.serviceType}</td>
                      <td className="px-5 py-4 font-bold text-[13px] text-on-surface">Rp {(c.fees || 0).toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 font-bold text-[13px] text-secondary">Rp {(c.paidAmount || 0).toLocaleString('id-ID')}</td>
                      <td className={`px-5 py-4 font-bold text-[13px] ${sisa > 0 ? 'text-error' : 'text-on-surface-variant/40'}`}>
                        {sisa > 0 ? `Rp ${sisa.toLocaleString('id-ID')}` : 'Lunas'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase whitespace-nowrap ${
                          c.paymentStatus === 'Lunas' 
                            ? 'bg-green-100 text-green-800' 
                            : c.paymentStatus === 'DP' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {c.paymentStatus || 'Belum Lunas'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-black rounded-lg transition-all flex items-center gap-1 mx-auto"
                          >
                            <span className="material-symbols-outlined text-[14px]">payments</span>
                            <span>Update Bayar</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE PAYMENT MODAL */}
      {editingCase && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-outline-variant rounded-2xl w-full max-w-md p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingCase(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[28px]">payments</span>
              <h3 className="font-bold text-[16px] text-primary uppercase tracking-wide">
                Update Pembayaran Berkas
              </h3>
            </div>
            <p className="text-[12px] text-on-surface-variant border-b pb-3 mb-4 font-medium leading-normal">
              Edit nominal biaya transaksi dan total bayar berkas milik <strong className="text-on-surface">{editingCase.clientName}</strong>.
            </p>

            <div className="space-y-4">
              {/* No Berkas & Layanan (ReadOnly) */}
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-3 rounded-lg border border-outline-variant/60 text-[12px] font-semibold text-on-surface-variant">
                <div>
                  <span className="text-[10px] uppercase text-on-surface-variant/70 block">No. Berkas</span>
                  {editingCase.caseNumber}
                </div>
                <div>
                  <span className="text-[10px] uppercase text-on-surface-variant/70 block">Jenis Layanan</span>
                  {editingCase.serviceType}
                </div>
              </div>

              {/* Biaya Akta */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="edit_fees">
                  Biaya Jasa Notaris (Rupiah)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[12.5px] font-bold text-on-surface-variant">Rp</span>
                  <CurrencyInput
                    id="edit_fees"
                    value={editFees}
                    onChange={handleFeesChange}
                    className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-outline-variant rounded-lg text-[12.5px] text-on-surface font-bold focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Jumlah Dibayar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="edit_paid">
                  Nominal Dibayar (Rupiah)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[12.5px] font-bold text-on-surface-variant">Rp</span>
                  <CurrencyInput
                    id="edit_paid"
                    value={editPaidAmount}
                    onChange={handlePaidAmountChange}
                    className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-outline-variant rounded-lg text-[12.5px] text-on-surface font-bold focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Status Pembayaran */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Status Pembayaran (Terhitung Otomatis)
                </label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface font-bold focus:outline-none"
                >
                  <option value="Belum Lunas">Belum Lunas</option>
                  <option value="DP">DP (Down Payment)</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>

              {/* Outstanding Tagihan Review */}
              <div className="pt-2 flex justify-between items-center text-[12.5px] font-bold">
                <span className="text-on-surface-variant">Sisa Tagihan:</span>
                <span className={editFees - editPaidAmount > 0 ? 'text-error' : 'text-secondary'}>
                  Rp {Math.max(0, editFees - editPaidAmount).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-outline-variant flex gap-3">
              <button
                onClick={() => setEditingCase(null)}
                className="flex-1 py-2 border border-outline-variant rounded-lg text-[12.5px] font-bold hover:bg-surface-container-low transition-colors"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                onClick={handleSavePayment}
                className="flex-1 py-2 bg-primary text-on-primary rounded-lg text-[12.5px] font-bold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-1"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
