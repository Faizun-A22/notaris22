import React from 'react';
import { useCases } from '../../../hooks/useCases';

export const RecentActivity = () => {
  const { activities } = useCases();
  const displayActivities = (activities || []).slice(0, 6);

  return (
    <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-7 rounded-xl card-shadow">
      <h4 className="text-[20px] font-bold text-on-surface mb-6 text-left">
        Recent Activity
      </h4>
      
      {displayActivities.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-8">Belum ada aktivitas terekam.</p>
      ) : (
        <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant text-left">
          {displayActivities.map((act) => (
            <div key={act.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[22px] top-2 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white shadow-sm"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-on-surface font-bold text-[14.5px] flex items-center gap-2 flex-wrap">
                    <span>{act.user}</span> 
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold shadow-sm ${
                      act.category === 'PPAT' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-primary'
                    }`}>
                      {act.category}
                    </span>
                    <span className="font-normal text-on-surface-variant/80">{act.action}</span>
                  </p>
                  <p className="text-[14px] text-success font-bold mt-1.5">
                    {act.target}
                  </p>
                  <p className="text-[12px] text-on-surface-variant/80 mt-1.5 font-medium">
                    {act.timestamp}
                  </p>
                </div>
                
                <div className="p-2 bg-surface-container-high rounded-lg text-on-surface-variant shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{act.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
