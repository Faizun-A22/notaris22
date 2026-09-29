import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCases } from '../../hooks/useCases';
import { useRedAlert } from '../../hooks/useRedAlert';
import { useAuth } from '../../hooks/useAuth';
import MetricCard from '../../components/common/MetricCard';
import CaseTable from '../../components/features/staff/CaseTable';
import { 
  CalendarWidget, 
  ProgressWidget, 
  UpcomingTasksWidget, 
  TasksOverviewChart, 
  PriorityDonutChart 
} from '../../components/common/DashboardWidgets';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus 
} from 'lucide-react';

export const StaffDashboard = () => {
  const { cases } = useCases();
  const { count: overdueCount } = useRedAlert();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Search filter
  const [searchVal, setSearchVal] = useState('');

  // Computations
  const totalCount = cases.length;
  const completedCount = cases.filter((c) => c.status === 'Selesai').length;
  const inProgressCount = cases.filter((c) => c.status !== 'Selesai' && !c.isComplete).length;
  const overdueNum = overdueCount || cases.filter((c) => c.status === 'TERLAMBAT').length;

  // Counts for priority donut
  const highCount = overdueNum;
  const mediumCount = Math.max(0, inProgressCount - highCount);
  const lowCount = completedCount;

  // Upcoming items for the widget
  const upcomingList = useMemo(() => {
    return cases
      .filter((c) => c.status !== 'Selesai')
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        title: `${c.serviceType} - ${c.clientName}`,
        date: c.estimationDate,
        priority: c.status === 'TERLAMBAT' ? 'High' : 'Medium',
      }));
  }, [cases]);

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Header Greeting & "+ New Task" Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-[26px] sm:text-[28px] font-black text-slate-800 tracking-tight flex items-center gap-2">
            Selamat Pagi, {profile?.full_name?.split(' ')[0] || 'Alex'}! <span className="inline-block animate-bounce">👋</span>
          </h2>
          <p className="text-[13.5px] font-medium text-slate-400 mt-1">
            Berikut ringkasan berkas dan agenda tugas notaris Anda hari ini.
          </p>
        </div>

        {/* Purple 3D CTA Button "+ New Task" */}
        <button
          onClick={() => navigate('/staff/buat-berkas')}
          className="btn-primary-3d flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13.5px] shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Buat Berkas Baru</span>
        </button>
      </div>

      {/* Row of 4 Soft 3D Pastel Stat Cards */}
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
          title="Selesai"
          value={completedCount}
          icon={CheckCircle2}
          change={completedCount > 0 ? `${completedCount}` : null}
          changeText="berkas selesai"
          color="mint"
        />
        <MetricCard
          title="Dalam Proses"
          value={inProgressCount}
          icon={Clock}
          change={inProgressCount > 0 ? `${inProgressCount}` : null}
          changeText="berkas berjalan"
          color="amber"
        />
        <MetricCard
          title="Terlambat"
          value={overdueNum}
          icon={AlertCircle}
          change={overdueNum > 0 ? `-${overdueNum}` : null}
          changeText="perlu tindakan"
          color="rose"
        />
      </div>

      {/* Main Split Grid (Left/Center: Tasks & Charts | Right: Calendar, Progress, Upcoming) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center Column (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-6">
          {/* My Tasks Table */}
          <CaseTable searchVal={searchVal} casesList={cases} />

          {/* Bottom Split: Tasks Overview Chart + Tasks by Priority Donut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TasksOverviewChart cases={cases} />
            <PriorityDonutChart high={highCount} medium={mediumCount} low={lowCount} />
          </div>
        </div>

        {/* Right Sidebar Column (4 cols on large screens) */}
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

export default StaffDashboard;
