import React, { useState, useMemo } from 'react';
import { useCases } from '../../hooks/useCases';
import { useRedAlert } from '../../hooks/useRedAlert';
import MetricCard from '../../components/common/MetricCard';
import UrgentAlerts from '../../components/features/owner/UrgentAlerts';
import RecentActivity from '../../components/features/owner/RecentActivity';
import DateFilter from '../../components/common/DateFilter';

export const OwnerDashboard = () => {
  const { cases } = useCases();
  const { count: overdueCount } = useRedAlert();

  // Period Filter State
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');

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

  // Dynamic calculations based on filtered state
  const totalCount = filteredCases.length;
  const completedCount = filteredCases.filter((c) => c.status === 'Selesai').length;

  // Derive unique clients count based on filtered cases
  const activeClientsCount = useMemo(() => {
    const clients = new Set(filteredCases.map(c => c.clientId));
    return clients.size;
  }, [filteredCases]);

  // Calculate finance metrics based on filtered cases
  const financeStats = useMemo(() => {
    let totalTarget = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;

    filteredCases.forEach((c) => {
      totalTarget += c.fees || 0;
      totalReceived += c.paidAmount || 0;
      totalOutstanding += Math.max(0, (c.fees || 0) - (c.paidAmount || 0));
    });

    return {
      totalTarget,
      totalReceived,
      totalOutstanding
    };
  }, [filteredCases]);

  return (
    <div className="space-y-8 font-sans">
      
      {/* Dashboard Header (24px - 30px size range) */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end text-left gap-4">
        <div>
          <h2 className="text-[30px] font-extrabold text-text tracking-tight">Executive Overview</h2>
          <p className="text-[14px] text-muted mt-1.5 font-medium">Real-time operational performance of NotaryDoc Pro.</p>
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
          <button className="flex items-center gap-2 px-5 h-11 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-body-md font-semibold text-[14px]">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Bento Layout Container: Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* KPI Card 1: Total Documents */}
        <MetricCard
          title="Total Documents"
          value={totalCount.toLocaleString()}
          icon="description"
          change="+12.5%"
          color="primary"
          footerText="Total finalized files this month"
        />

        {/* KPI Card 2: Active Clients */}
        <MetricCard
          title="Active Clients"
          value={activeClientsCount.toLocaleString()}
          icon="group"
          color="secondary"
          footerText="Active consulting client portfolios"
        />

        {/* KPI Card 3: Completed Documents */}
        <MetricCard
          title="Completed Documents"
          value={completedCount.toLocaleString()}
          icon="task_alt"
          color="tertiary"
          footerText="Files successfully completed"
        />

        {/* KPI Card 4: Completion Rate */}
        <div className="bg-surface-container-lowest border border-outline-variant p-7 rounded-xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex justify-between items-center mb-3">
            <p className="text-[13px] text-on-surface-variant/80 font-semibold uppercase tracking-wider">
              Completion Rate
            </p>
            <span className="text-primary font-bold text-[14px]">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
          </div>
          
          <h3 className="font-bold text-[18px] text-on-surface mt-2 mb-3">Operational Goal</h3>
          
          <div className="w-full bg-surface-container-high h-4 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(0,108,73,0.3)] transition-all duration-500" 
              style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%` }}
            />
          </div>
          <p className="text-[12px] text-on-surface-variant mt-3 text-right">Target: 100% Completion</p>
        </div>
      </div>

      {/* Financial Overview Section */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm text-left">
        <h3 className="text-[18px] font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">payments</span>
          Ringkasan Keuangan Periode Terpilih
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-4 rounded-xl flex flex-col justify-between min-h-[90px]">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Target Biaya Berkas</p>
            <p className="text-[20px] font-extrabold text-emerald-900 mt-1">Rp {financeStats.totalTarget.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col justify-between min-h-[90px]">
            <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Dana Masuk (Diterima)</p>
            <p className="text-[20px] font-extrabold text-blue-900 mt-1">Rp {financeStats.totalReceived.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col justify-between min-h-[90px]">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Piutang Berjalan (Outstanding)</p>
            <p className="text-[20px] font-extrabold text-amber-900 mt-1">Rp {financeStats.totalOutstanding.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Lower Bento Grid: Urgent Alerts + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-grid">
        <UrgentAlerts />
        <RecentActivity />
      </div>
    </div>
  );
};

export default OwnerDashboard;
