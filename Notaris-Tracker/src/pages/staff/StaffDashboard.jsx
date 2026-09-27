import React, { useState, useMemo } from 'react';
import { useCases } from '../../hooks/useCases';
import { useRedAlert } from '../../hooks/useRedAlert';
import CaseTable from '../../components/features/staff/CaseTable';
import DateFilter from '../../components/common/DateFilter';

export const StaffDashboard = () => {
  const { cases } = useCases();
  const { count: overdueCount } = useRedAlert();

  // Filter States
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [searchVal, setSearchVal] = useState('');

  // Filter cases dynamically by selected period
  const filteredCases = useMemo(() => {
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

  const activeCount = filteredCases.filter((c) => !c.isComplete).length;
  const actionRequiredCount = filteredCases.filter((c) => !c.isComplete && !c.documentsReady).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dashboard Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end text-left gap-4">
        <div>
          <h2 className="text-[30px] font-extrabold text-text tracking-tight font-sans">Dashboard Staf</h2>
          <p className="text-[14px] text-muted mt-1.5 font-medium">Ringkasan berkas dan tindakan yang Anda kerjakan.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <DateFilter
            date={filterDate}
            month={filterMonth}
            year={filterYear}
            onDateChange={setFilterDate}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
          />
        </div>
      </div>

      {/* Metric Cards - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        
        {/* KPI Card 1: File Aktif */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-left flex flex-col justify-between min-h-[120px]">
          <div>
            <p className="text-on-surface-variant/70 font-bold text-[12px] uppercase tracking-wider">
              File Aktif
            </p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <h3 className="text-[32px] font-extrabold text-on-surface leading-none">
                {activeCount}
              </h3>
            </div>
          </div>
          {/* Bottom Progress Indicator */}
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden mt-6">
            <div className="bg-primary h-full rounded-full w-2/3"></div>
          </div>
        </div>

        {/* KPI Card 2: Membutuhkan Tindakan */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-left flex flex-col justify-between min-h-[120px]">
          <div>
            <p className="text-on-surface-variant/70 font-bold text-[12px] uppercase tracking-wider">
              Membutuhkan Tindakan
            </p>
            <h3 className="text-[32px] font-extrabold text-on-surface leading-none mt-1.5">
              {actionRequiredCount}
            </h3>
          </div>
          {/* Bottom Progress Indicator */}
          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden mt-6">
            <div className="bg-warning h-full rounded-full w-1/3"></div>
          </div>
        </div>

        {/* KPI Card 3: Terlambat Kritis */}
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-left flex flex-col justify-between min-h-[120px]">
          <div>
            <p className="text-error/80 font-bold text-[12px] uppercase tracking-wider">
              Terlambat Kritis
            </p>
            <div className="flex items-baseline gap-2.5 mt-1.5">
              <h3 className="text-[32px] font-extrabold text-error leading-none">
                {overdueCount}
              </h3>
              <span className="text-error text-[10px] font-extrabold bg-error-container px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                ! Tindakan
              </span>
            </div>
          </div>
          {/* Bottom Progress Indicator */}
          <div className="w-full bg-error-container/30 h-1.5 rounded-full overflow-hidden mt-6">
            <div className="bg-error h-full rounded-full w-3/4"></div>
          </div>
        </div>

      </div>

      {/* Local Search Input above Table */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex gap-3 items-center">
        <div className="relative flex-1 max-w-md text-left">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari berkas berdasarkan nama klien atau nomor file..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary text-[13px]"
          />
        </div>
      </div>

      {/* Registry File Aktif Table */}
      <div>
        <CaseTable searchVal={searchVal} casesList={filteredCases} />
      </div>
      
    </div>
  );
};

export default StaffDashboard;
