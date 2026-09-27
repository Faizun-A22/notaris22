import React from 'react';

export const MetricCard = ({ title, value, icon, change, changeText, color = 'primary', footerText }) => {
  // Styles based on color theme
  let iconBg = 'bg-primary-container/20 text-primary';
  let decorBg = 'bg-primary/5';
  let titleColor = 'text-primary';

  if (color === 'secondary') {
    iconBg = 'bg-secondary-container/30 text-secondary';
    decorBg = 'bg-secondary-container/20';
    titleColor = 'text-secondary';
  } else if (color === 'error') {
    iconBg = 'bg-error-container/30 text-error';
    decorBg = 'bg-error-container/20';
    titleColor = 'text-error';
  } else if (color === 'tertiary') {
    iconBg = 'bg-tertiary-fixed text-on-tertiary-fixed';
    decorBg = 'bg-tertiary-fixed-dim/25';
    titleColor = 'text-on-surface';
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-7 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className={`absolute right-0 top-0 w-28 h-28 ${decorBg} rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform`}></div>
      
      <div className="flex items-start justify-between mb-3">
        <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
            {icon}
          </span>
        </div>
        {change && (
          <span className={`${color === 'primary' ? 'text-primary' : color === 'secondary' ? 'text-secondary' : 'text-error'} font-bold text-[13px]`}>
            {change}
          </span>
        )}
      </div>

      <p className="text-on-surface-variant/80 font-semibold text-[13px] uppercase tracking-wider">
        {title}
      </p>
      
      <h3 className={`text-[36px] font-extrabold tracking-tight leading-none ${titleColor} mt-2 mb-2`}>
        {value}
      </h3>

      {footerText && (
        <div className="mt-3 pt-3 border-t border-outline-variant">
          <p className="text-[12px] font-medium text-on-surface-variant/80">{footerText}</p>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
