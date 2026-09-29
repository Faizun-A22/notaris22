import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ArrowRight,
  FileCheck2,
  FileClock,
  FileWarning,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * 1. Calendar Widget
 * Beautiful interactive soft-neumorphic calendar
 */
export const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Convert to Monday-start index (0: Mon, 1: Tue ... 6: Sun)
  const startingCol = (firstDayIndex + 6) % 7;

  // Previous month trailing days
  const prevMonthDays = new Date(year, month, 0).getDate();

  const daysArray = [];
  // trailing days
  for (let i = startingCol - 1; i >= 0; i--) {
    daysArray.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  // current days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({ day: i, isCurrentMonth: true });
  }
  // next month leading days to complete grid (up to 35 or 42)
  const remaining = (7 - (daysArray.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    daysArray.push({ day: i, isCurrentMonth: false });
  }

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Calendar</h4>
          <p className="text-[12px] font-bold text-slate-400">
            {monthNames[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 rounded-xl p-0.5">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {daysOfWeek.map((d, idx) => (
          <div key={idx} className="text-[11px] font-bold text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysArray.map((item, idx) => {
          const isSelected = item.isCurrentMonth && item.day === selectedDay;
          return (
            <button
              key={idx}
              onClick={() => item.isCurrentMonth && setSelectedDay(item.day)}
              className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-[12px] font-bold transition-all ${
                isSelected
                  ? 'bg-[#6366F1] text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)] scale-105'
                  : item.isCurrentMonth
                  ? 'text-slate-700 hover:bg-[#F3F4FB] hover:text-[#6366F1]'
                  : 'text-slate-300 pointer-events-none'
              }`}
            >
              {item.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 2. Progress Widget
 * Overall completion tracker with smooth mint gradient progress bar
 */
export const ProgressWidget = ({ total = 0, completed = 0 }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left select-none">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Progress</h4>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[12.5px] font-bold text-slate-400">Overall Progress</span>
        <span className="text-[16px] font-extrabold text-slate-800">{percentage}%</span>
      </div>

      {/* Smooth Rounded Gradient Progress Bar */}
      <div className="w-full bg-[#EBF8F2] h-3.5 rounded-full overflow-hidden p-0.5 border border-emerald-100/60">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-700 shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[11.5px] font-semibold text-slate-400 mt-2.5">
        {completed} dari {total} berkas selesai
      </p>
    </div>
  );
};

/**
 * 3. Upcoming Tasks Widget
 * List of upcoming tasks with colorful 3D square icon badges
 */
export const UpcomingTasksWidget = ({ tasks = [] }) => {
  const navigate = useNavigate();

  const items = (tasks || []).slice(0, 3);

  return (
    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left flex flex-col justify-between min-h-[220px]">
      <div>
        <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight mb-3.5">
          Tugas Mendatang
        </h4>

        {items.length === 0 ? (
          <p className="text-[12.5px] font-medium text-slate-400 py-8 text-center">
            Tidak ada tugas mendatang.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((t, idx) => {
              const isRose = t.priority === 'High' || t.color === 'rose';
              const isAmber = t.priority === 'Medium' || t.color === 'amber';

              return (
                <div 
                  key={t.id || idx}
                  onClick={() => t.id && navigate(`/staff/documents/${t.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isRose 
                        ? 'bg-gradient-to-tr from-[#EF4444] to-[#F87171] text-white shadow-[0_4px_10px_rgba(239,68,68,0.3)]'
                        : isAmber
                        ? 'bg-gradient-to-tr from-[#0EA5E9] to-[#38BDF8] text-white shadow-[0_4px_10px_rgba(14,165,233,0.3)]'
                        : 'bg-gradient-to-tr from-[#10B981] to-[#34D399] text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)]'
                    }`}>
                      {isRose ? <FileWarning className="w-4 h-4" /> : isAmber ? <FileClock className="w-4 h-4" /> : <FileCheck2 className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <h5 className="text-[12.5px] font-bold text-slate-800 truncate group-hover:text-[#6366F1] transition-colors">
                        {t.title || t.serviceType}
                      </h5>
                      <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">
                        {t.date || t.estimationDate || 'Sesuai Jadwal'}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${
                    isRose 
                      ? 'bg-[#FDF0F3] text-[#EF4444] border border-[#FCDCE3]' 
                      : isAmber
                      ? 'bg-[#FEF8EB] text-[#D97706] border border-[#FDEECC]'
                      : 'bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4]'
                  }`}>
                    {t.priority || 'Normal'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/staff/documents')}
        className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11.5px] font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors group w-full"
      >
        <span>Lihat semua berkas</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

/**
 * 4. Tasks Overview (Interactive Smooth Wave Chart)
 * SVG spline line and area chart derived from real cases data
 */
export const TasksOverviewChart = ({ cases = [] }) => {
  const [period, setPeriod] = useState('This Week');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'];
  
  const values = useMemo(() => {
    if (!cases || cases.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    cases.forEach(c => {
      if (c.createdAt || c.entryDate) {
        const d = new Date(c.createdAt || c.entryDate);
        const dayIdx = (d.getDay() + 6) % 7;
        counts[dayIdx] = (counts[dayIdx] || 0) + 1;
      }
    });
    return counts;
  }, [cases]);

  const maxVal = Math.max(...values, 5);

  const points = values.map((val, idx) => {
    const x = 30 + idx * 65;
    const y = 140 - (val / maxVal) * 100;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, i, a) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = a[i - 1];
    const cx1 = prev.x + 30;
    const cy1 = prev.y;
    const cx2 = pt.x - 30;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L 420,175 L 30,175 Z`;

  return (
    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left select-none">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Ringkasan Tugas</h4>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-[#F8F9FA] border border-slate-200 rounded-xl px-3 py-1 text-[11.5px] font-bold text-slate-500 focus:outline-none focus:border-[#6366F1] cursor-pointer"
        >
          <option value="This Week">Minggu Ini</option>
          <option value="Last Week">Minggu Lalu</option>
          <option value="This Month">Bulan Ini</option>
        </select>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[180px] mt-2">
        <svg viewBox="0 0 450 180" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="purpleAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background grid lines */}
          <line x1="30" y1="40" x2="420" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="30" y1="85" x2="420" y2="85" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="30" y1="130" x2="420" y2="130" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#purpleAreaGrad)" />

          {/* Smooth Line Curve */}
          <path d={pathD} fill="none" stroke="#6366F1" strokeWidth="3" filter="url(#glowShadow)" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint === idx;
            return (
              <g key={idx} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                {isHovered && (
                  <circle cx={pt.x} cy={pt.y} r="8" fill="#818CF8" fillOpacity="0.25" />
                )}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={isHovered ? "5" : "3.5"} 
                  fill="#6366F1" 
                  stroke="#FFFFFF" 
                  strokeWidth="2.5" 
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint !== null && (
          <div 
            className="absolute -top-1 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1 shadow-md text-center pointer-events-none transform -translate-x-1/2 animate-in fade-in zoom-in-95 duration-150"
            style={{ 
              left: `${(points[hoveredPoint].x / 450) * 100}%`,
              top: `${Math.max(5, (points[hoveredPoint].y / 180) * 100 - 24)}%` 
            }}
          >
            <span className="text-[11.5px] font-black text-[#6366F1]">
              {points[hoveredPoint].val}
            </span>
            <span className="text-[10px] font-bold text-slate-400 block -mt-0.5">Berkas</span>
          </div>
        )}
      </div>

      {/* X Axis Labels */}
      <div className="flex justify-between px-3 text-[11px] font-bold text-slate-400 -mt-2">
        {days.map((d, i) => (
          <span key={i} className={hoveredPoint === i ? 'text-[#6366F1]' : ''}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * 5. Tasks by Priority (Pastel 3D Donut Chart)
 * High (Pink), Medium (Yellow), Low (Mint)
 */
export const PriorityDonutChart = ({ high = 0, medium = 0, low = 0 }) => {
  const total = high + medium + low;
  const denominator = total > 0 ? total : 1;
  const highPercent = total > 0 ? Math.round((high / denominator) * 100) : 0;
  const mediumPercent = total > 0 ? Math.round((medium / denominator) * 100) : 0;
  const lowPercent = total > 0 ? Math.round((low / denominator) * 100) : 0;

  // SVG Donut calculations
  const radius = 36;
  const circ = 2 * Math.PI * radius; // ~226.19

  const highOffset = 0;
  const highDash = (high / denominator) * circ;

  const mediumOffset = -highDash;
  const mediumDash = (medium / denominator) * circ;

  const lowOffset = -(highDash + mediumDash);
  const lowDash = (low / denominator) * circ;

  return (
    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left select-none flex flex-col justify-between">
      <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight mb-2">
        Tugas Berdasarkan Prioritas
      </h4>

      <div className="flex items-center justify-between gap-4 my-auto py-2">
        {/* Donut graphic */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="14" />
            
            {total > 0 && (
              <>
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#F472B6"
                  strokeWidth="14"
                  strokeDasharray={`${highDash} ${circ - highDash}`}
                  strokeDashoffset={highOffset}
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth="14"
                  strokeDasharray={`${mediumDash} ${circ - mediumDash}`}
                  strokeDashoffset={mediumOffset}
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#6EE7B7"
                  strokeWidth="14"
                  strokeDasharray={`${lowDash} ${circ - lowDash}`}
                  strokeDashoffset={lowOffset}
                />
              </>
            )}
          </svg>

          {/* Central cutout indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[14px] font-black text-slate-800 leading-none">{total}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Berkas</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-[12px] font-semibold text-slate-600 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F472B6]" />
              <span>Tinggi (Overdue)</span>
            </div>
            <span className="font-bold text-slate-800">{high} <span className="text-slate-400 font-normal text-[11px]">({highPercent}%)</span></span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D]" />
              <span>Sedang (Proses)</span>
            </div>
            <span className="font-bold text-slate-800">{medium} <span className="text-slate-400 font-normal text-[11px]">({mediumPercent}%)</span></span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6EE7B7]" />
              <span>Rendah (Selesai)</span>
            </div>
            <span className="font-bold text-slate-800">{low} <span className="text-slate-400 font-normal text-[11px]">({lowPercent}%)</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
