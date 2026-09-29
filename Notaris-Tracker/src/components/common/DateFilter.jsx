import React from 'react';

export const DateFilter = ({ date, month, year, onDateChange, onMonthChange, onYearChange }) => {
  return (
    <div className="flex gap-2 items-center flex-wrap select-none">
      {/* Day Selector */}
      <div className="relative">
        <select
          value={date || 'ALL'}
          onChange={(e) => onDateChange && onDateChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl pl-3.5 pr-8 h-10 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-[#6366F1] shadow-xs cursor-pointer appearance-none transition-all"
        >
          <option value="ALL">Tgl (Semua)</option>
          {Array.from({ length: 31 }, (_, i) => {
            const val = String(i + 1);
            return (
              <option key={val} value={val}>
                Tgl {val}
              </option>
            );
          })}
        </select>
        <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
          expand_more
        </span>
      </div>

      {/* Month Selector */}
      <div className="relative">
        <select
          value={month || 'ALL'}
          onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl pl-3.5 pr-8 h-10 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-[#6366F1] shadow-xs cursor-pointer appearance-none transition-all"
        >
          <option value="ALL">Bulan (Semua)</option>
          {[
            { val: '1', name: 'Januari' },
            { val: '2', name: 'Februari' },
            { val: '3', name: 'Maret' },
            { val: '4', name: 'April' },
            { val: '5', name: 'Mei' },
            { val: '6', name: 'Juni' },
            { val: '7', name: 'Juli' },
            { val: '8', name: 'Agustus' },
            { val: '9', name: 'September' },
            { val: '10', name: 'Oktober' },
            { val: '11', name: 'November' },
            { val: '12', name: 'Desember' }
          ].map(m => (
            <option key={m.val} value={m.val}>
              {m.name}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
          expand_more
        </span>
      </div>

      {/* Year Selector */}
      <div className="relative">
        <select
          value={year || 'ALL'}
          onChange={(e) => onYearChange && onYearChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl pl-3.5 pr-8 h-10 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-[#6366F1] shadow-xs cursor-pointer appearance-none transition-all"
        >
          <option value="ALL">Tahun (Semua)</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>
        <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
};

export default DateFilter;
