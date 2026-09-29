import React, { useState, useMemo } from 'react';
import { useCases } from '../../hooks/useCases';
import { useRedAlert } from '../../hooks/useRedAlert';
import MetricCard from '../../components/common/MetricCard';
import UrgentAlerts from '../../components/features/owner/UrgentAlerts';
import RecentActivity from '../../components/features/owner/RecentActivity';
import DateFilter from '../../components/common/DateFilter';
import { 
  CalendarWidget, 
  ProgressWidget, 
  UpcomingTasksWidget, 
  TasksOverviewChart, 
  PriorityDonutChart 
} from '../../components/common/DashboardWidgets';
import { 
  FileText, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  Download, 
  CreditCard,
  Building,
  AlertCircle
} from 'lucide-react';

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

  // Calculations
  const totalCount = filteredCases.length;
  const completedCount = filteredCases.filter((c) => c.status === 'Selesai').length;
  const inProgressCount = filteredCases.filter((c) => c.status !== 'Selesai').length;
  const overdueNum = overdueCount || 0;

  const activeClientsCount = useMemo(() => {
    const clients = new Set(filteredCases.map(c => c.clientId || c.clientName));
    return clients.size;
  }, [filteredCases]);

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

  const upcomingList = useMemo(() => {
    return filteredCases
      .filter((c) => c.status !== 'Selesai')
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        title: `${c.serviceType} - ${c.clientName}`,
        date: c.estimationDate,
        priority: c.status === 'TERLAMBAT' ? 'High' : 'Medium',
      }));
  }, [filteredCases]);

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-left gap-4">
        <div>
          <h2 className="text-[26px] sm:text-[28px] font-black text-slate-800 tracking-tight">
            Ringkasan Eksekutif Notaris
          </h2>
          <p className="text-[13.5px] text-slate-400 font-medium mt-1">
            Pantauan kinerja berkas, perputaran keuangan, dan kepatuhan staf secara realtime.
          </p>
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
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 h-11 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-all text-slate-700 font-bold text-[12.5px] shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor Laporan</span>
          </button>
        </div>
      </div>

      {/* 4 Soft 3D Pastel Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Total Berkas"
          value={totalCount}
          icon={FileText}
          change={totalCount > 0 ? `${totalCount}` : null}
          changeText="total berkas"
          color="purple"
        />
        <MetricCard
          title="Klien Aktif"
          value={activeClientsCount}
          icon={Users}
          change={activeClientsCount > 0 ? `${activeClientsCount}` : null}
          changeText="klien terdaftar"
          color="mint"
        />
        <MetricCard
          title="Berkas Selesai"
          value={completedCount}
          icon={CheckCircle2}
          change={completedCount > 0 ? `${completedCount}` : null}
          changeText="berkas terselesaikan"
          color="amber"
        />
        <MetricCard
          title="Tingkat Penyelesaian"
          value={`${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%`}
          icon={TrendingUp}
          change={totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : null}
          changeText="kinerja kantor"
          color="cyan"
        />
      </div>

      {/* Financial Overview (3 Soft 3D Pastel Cards) */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </span>
            Ringkasan Keuangan Periode Terpilih
          </h3>
          <span className="text-[11px] font-bold text-slate-400">IDR Real-time</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#EDFAF3] border border-[#D5F5E4] p-5 rounded-2xl flex flex-col justify-between">
            <p className="text-[11.5px] font-bold text-emerald-800 uppercase tracking-wider">
              Total Target Biaya Berkas
            </p>
            <p className="text-[24px] font-black text-emerald-950 mt-2">
              Rp {financeStats.totalTarget.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-[#EEF9FD] border border-[#D2EEFB] p-5 rounded-2xl flex flex-col justify-between">
            <p className="text-[11.5px] font-bold text-sky-800 uppercase tracking-wider">
              Dana Masuk (Diterima)
            </p>
            <p className="text-[24px] font-black text-sky-950 mt-2">
              Rp {financeStats.totalReceived.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-[#FEF8EB] border border-[#FDEECC] p-5 rounded-2xl flex flex-col justify-between">
            <p className="text-[11.5px] font-bold text-amber-800 uppercase tracking-wider">
              Piutang Berjalan (Outstanding)
            </p>
            <p className="text-[24px] font-black text-amber-950 mt-2">
              Rp {financeStats.totalOutstanding.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Grid (Charts & Alerts + Right Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TasksOverviewChart cases={filteredCases} />
            <PriorityDonutChart 
              high={overdueNum} 
              medium={Math.max(0, inProgressCount - overdueNum)} 
              low={completedCount} 
            />
          </div>

          {/* Lower Bento Grid: Urgent Alerts + Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UrgentAlerts />
            <RecentActivity />
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Calendar Widget */}
          <CalendarWidget />

          {/* Progress Widget */}
          <ProgressWidget total={totalCount} completed={completedCount} />

          {/* Upcoming Tasks Widget */}
          <UpcomingTasksWidget tasks={upcomingList} />
        </div>

      </div>

    </div>
  );
};

export default OwnerDashboard;
