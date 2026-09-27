import React from 'react';

export const DateFilter = ({ date, month, year, onDateChange, onMonthChange, onYearChange }) => {
  return (
    <div className="flex gap-2 items-center flex-wrap select-none">
      {/* Day Selector */}
      <select
        value={date || 'ALL'}
        onChange={(e) => onDateChange && onDateChange(e.target.value)}
        className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 h-11 text-[13px] font-semibold text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        <option value="ALL">Tgl (Semua)</option>
        {Array.from({ length: 31 }, (_, i) => {
          const val = String(i + 1);
          return (
            <option key={val} value={val}>
              {val}
            </option>
          );
        })}
      </select>

      {/* Month Selector */}
      <select
        value={month || 'ALL'}
        onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
        className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 h-11 text-[13px] font-semibold text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
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

      {/* Year Selector */}
      <select
        value={year || 'ALL'}
        onChange={(e) => onYearChange && onYearChange(e.target.value)}
        className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 h-11 text-[13px] font-semibold text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        <option value="ALL">Tahun (Semua)</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
        <option value="2026">2026</option>
        <option value="2027">2027</option>
      </select>
    </div>
  );
};

export default DateFilter;
