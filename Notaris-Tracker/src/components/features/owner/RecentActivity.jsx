import React from 'react';
import { useCases } from '../../../hooks/useCases';
import { Activity, FileText, CheckCircle2, Clock, User } from 'lucide-react';

export const RecentActivity = () => {
  const { activities } = useCases();
  const displayActivities = (activities || []).slice(0, 5);

  return (
    <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(112,144,176,0.06)] text-left flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h4 className="text-[17px] font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#6366F1] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </span>
            Aktivitas Terkini
          </h4>
          <span className="text-[11px] font-bold text-slate-400">
            Realtime log
          </span>
        </div>
        
        {displayActivities.length === 0 ? (
          <p className="text-[13px] text-slate-400 text-center py-10">Belum ada aktivitas terekam.</p>
        ) : (
          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 text-left">
            {displayActivities.map((act) => (
              <div key={act.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 bg-[#6366F1] rounded-full border-2 border-white shadow-xs"></div>
                
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-800 font-bold text-[13px] flex items-center gap-2 flex-wrap">
                      <span>{act.user}</span> 
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                        act.category === 'PPAT' 
                          ? 'bg-[#F2F1FD] text-[#6366F1] border border-[#E4E2FB]' 
                          : 'bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4]'
                      }`}>
                        {act.category}
                      </span>
                      <span className="font-normal text-slate-400 text-[12px]">{act.action}</span>
                    </p>
                    <p className="text-[13px] text-emerald-600 font-bold mt-1 truncate">
                      {act.target}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      {act.timestamp}
                    </p>
                  </div>
                  
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
