import React from 'react';
import { SERVICE_TYPES } from '../../constants/serviceTypes';

export const StatusBadge = ({ type, label, variant = 'default' }) => {
  if (variant === 'service') {
    const service = SERVICE_TYPES[type] || {
      badgeBg: 'bg-tertiary-fixed-dim',
      badgeText: 'text-on-tertiary-fixed-variant',
    };

    return (
      <span className={`px-2 py-1 rounded text-label-bold font-bold text-[11px] whitespace-nowrap ${service.badgeBg} ${service.badgeText}`}>
        {type}
      </span>
    );
  }

  if (variant === 'document') {
    const isReady = label === 'LENGKAP';
    const bg = isReady 
      ? 'bg-secondary-container text-on-secondary-container' 
      : 'bg-error-container text-on-error-container';
    return (
      <span className={`px-3 py-1 rounded-full text-label-bold text-[10px] font-bold whitespace-nowrap ${bg}`}>
        {label}
      </span>
    );
  }

  // Fallback for generic state status
  let indicatorColor = 'bg-primary';
  let text = label;
  if (label === 'Selesai') {
    return (
      <span className="text-secondary font-bold text-body-md">
        Selesai
      </span>
    );
  } else if (label === 'Overdue') {
    return (
      <span className="text-error font-bold text-body-md">
        Overdue
      </span>
    );
  }

  // Running statuses E.g., 'Verifikasi Sertifikat', 'Validasi Pajak', etc.
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
      <span className="text-body-md text-on-surface">{text}</span>
    </div>
  );
};

export default StatusBadge;
