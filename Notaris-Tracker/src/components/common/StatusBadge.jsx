import React from 'react';
import { SERVICE_TYPES } from '../../constants/serviceTypes';

export const StatusBadge = ({ type, label, variant = 'default', priority }) => {
  // Service Type Tag (PPAT / Notaris / etc.)
  if (variant === 'service') {
    const isPPAT = ['AJB', 'HIBAH', 'APHB', 'APHT', 'WARIS', 'ROYA', 'PECAH', 'GANTI', 'KONVERSI', 'HT'].includes(type);
    
    if (isPPAT) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold tracking-wide uppercase bg-[#F2F1FD] text-[#6366F1] border border-[#E4E2FB] shadow-xs inline-flex items-center">
          {type}
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold tracking-wide uppercase bg-[#EEF9FD] text-[#0284C7] border border-[#D2EEFB] shadow-xs inline-flex items-center">
        {type === 'CV_PT' ? 'PT / CV' : type}
      </span>
    );
  }

  // Priority Pill (High / Medium / Low) like in screenshot
  if (variant === 'priority' || priority) {
    const p = (priority || label || '').toLowerCase();
    if (p.includes('high') || p.includes('tinggi') || p.includes('kritis') || p.includes('overdue')) {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FDF0F3] text-[#EF4444] border border-[#FCDCE3] inline-flex items-center gap-1 shadow-xs">
          High
        </span>
      );
    }
    if (p.includes('medium') || p.includes('sedang') || p.includes('proses')) {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF8EB] text-[#D97706] border border-[#FDEECC] inline-flex items-center gap-1 shadow-xs">
          Medium
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4] inline-flex items-center gap-1 shadow-xs">
        Low
      </span>
    );
  }

  // Document Ready status
  if (variant === 'document') {
    const isReady = label === 'LENGKAP';
    return (
      <span className={`px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wide ${
        isReady 
          ? 'bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4]' 
          : 'bg-[#FDF0F3] text-[#EF4444] border border-[#FCDCE3]'
      }`}>
        {label}
      </span>
    );
  }

  // General Case Status Badges
  if (label === 'Selesai') {
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4] inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
        Selesai
      </span>
    );
  }

  if (label === 'Overdue' || label === 'TERLAMBAT') {
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FDF0F3] text-[#EF4444] border border-[#FCDCE3] inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse"></span>
        Terlambat
      </span>
    );
  }

  // Running status
  return (
    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#F4F6FB] text-slate-700 border border-slate-200/80 inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse"></span>
      {label || 'Dalam Proses'}
    </span>
  );
};

export default StatusBadge;
