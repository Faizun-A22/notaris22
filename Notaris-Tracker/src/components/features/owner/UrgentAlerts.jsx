import React from 'react';
import { useRedAlert } from '../../../hooks/useRedAlert';
import { checkOverdue } from '../../../utils/checkOverdue';
import { formatDate } from '../../../utils/formatDate';

export const UrgentAlerts = () => {
  const { overdueCases, count, hasAlerts } = useRedAlert();

  return (
    <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-7 rounded-xl card-shadow">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[20px] font-bold text-on-surface flex items-center gap-2.5">
          <span className="material-symbols-outlined text-error text-[24px]">warning</span>
          Tenggat Waktu Dekat
        </h4>
        <span className="text-[12px] font-bold px-3 py-1 bg-error-container text-on-error-container rounded-full shadow-sm">
          {count} Berkas Kritis
        </span>
      </div>

      <div className="space-y-4">
        {hasAlerts ? (
          overdueCases.map((c) => (
            <div 
              key={c.id} 
              className="flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:bg-[#F8F9FA] transition-all group cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="bg-error-container text-on-error-container w-12 h-12 rounded-lg flex items-center justify-center font-bold text-[14px] shadow-sm">
                  {c.serviceType === 'CV_PT' ? 'PT' : c.serviceType}
                </div>
                <div className="text-left">
                  <p className="font-bold text-on-surface text-[14.5px]">
                    {c.serviceType === 'CV_PT' ? `Akte Pendirian ${c.clientName}` : `${c.serviceType} No. ${c.caseNumber} - ${c.clientName}`}
                  </p>
                  <p className="text-on-surface-variant/80 text-[12px] mt-1 font-medium">
                    Staf: {c.assignedStaff}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-error-container text-on-error-container text-[12px] font-bold rounded-full animate-pulse shadow-sm">
                Overdue ({formatDate(c.estimationDate)})
              </span>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-[#F8F9FA] rounded-xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-[48px] text-secondary mb-3">check_circle</span>
            <p className="text-on-surface-variant text-[14px] font-semibold">
              Semua berkas aman! Tidak ada berkas yang overdue saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrgentAlerts;
