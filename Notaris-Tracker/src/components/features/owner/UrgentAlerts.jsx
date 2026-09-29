import React from 'react';
import { useRedAlert } from '../../../hooks/useRedAlert';
import { formatDate } from '../../../utils/formatDate';
import { AlertTriangle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UrgentAlerts = () => {
  const { overdueCases, count, hasAlerts } = useRedAlert();
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h4 className="text-[17px] font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
            Tenggat Waktu Kritis
          </h4>
          <span className="text-[11px] font-extrabold px-3 py-1 bg-[#FDF0F3] text-[#EF4444] border border-[#FCDCE3] rounded-full shadow-xs">
            {count} Berkas Kritis
          </span>
        </div>

        <div className="space-y-3">
          {hasAlerts ? (
            overdueCases.slice(0, 4).map((c) => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/staff/documents/${c.id}`)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FEF2F2]/50 hover:bg-[#FEF2F2] border border-[#FECACA]/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EF4444] to-[#F87171] text-white flex items-center justify-center font-bold text-[12px] shadow-sm shrink-0">
                    {c.serviceType === 'CV_PT' ? 'PT' : c.serviceType}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-[13px] truncate group-hover:text-rose-600 transition-colors">
                      {c.clientName}
                    </p>
                    <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                      Staf Penanggung Jawab: {c.assignedStaff || 'Staf Notaris'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 bg-white text-rose-600 text-[10.5px] font-bold rounded-full border border-rose-200 shadow-xs">
                    Batas: {formatDate(c.estimationDate)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center bg-[#F8FAFC] rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto mb-2 opacity-90" />
              <p className="text-slate-600 text-[13px] font-bold">
                Semua berkas aman dan sesuai jadwal!
              </p>
              <p className="text-slate-400 text-[11.5px] mt-0.5">Tidak ada kasus tertunda saat ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrgentAlerts;
