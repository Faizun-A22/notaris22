import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles
} from 'lucide-react';

export const MetricCard = ({ 
  title, 
  value, 
  icon: IconComponent, 
  change, 
  changeText = 'vs minggu lalu', 
  color = 'purple', // 'purple' | 'mint' | 'amber' | 'rose' | 'cyan'
  footerText 
}) => {
  // Color configuration matching screenshot exactly
  const colorThemes = {
    purple: {
      cardBg: 'bg-[#F3F2FD] border-[#E4E2FB]',
      iconGradient: 'bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] shadow-[0_8px_16px_rgba(99,102,241,0.32)]',
      textColor: 'text-slate-800',
      badgeColor: 'text-emerald-600 bg-emerald-100/60',
    },
    mint: {
      cardBg: 'bg-[#EDFAF3] border-[#D5F5E4]',
      iconGradient: 'bg-gradient-to-tr from-[#059669] to-[#10B981] shadow-[0_8px_16px_rgba(16,185,129,0.32)]',
      textColor: 'text-slate-800',
      badgeColor: 'text-emerald-600 bg-emerald-100/60',
    },
    amber: {
      cardBg: 'bg-[#FEF8EB] border-[#FDEECC]',
      iconGradient: 'bg-gradient-to-tr from-[#D97706] to-[#F59E0B] shadow-[0_8px_16px_rgba(245,158,11,0.32)]',
      textColor: 'text-slate-800',
      badgeColor: 'text-amber-700 bg-amber-100/60',
    },
    rose: {
      cardBg: 'bg-[#FDF0F3] border-[#FCDCE3]',
      iconGradient: 'bg-gradient-to-tr from-[#DC2626] to-[#EF4444] shadow-[0_8px_16px_rgba(239,68,68,0.32)]',
      textColor: 'text-slate-800',
      badgeColor: 'text-rose-600 bg-rose-100/60',
    },
    cyan: {
      cardBg: 'bg-[#EEF9FD] border-[#D2EEFB]',
      iconGradient: 'bg-gradient-to-tr from-[#0284C7] to-[#0EA5E9] shadow-[0_8px_16px_rgba(14,165,233,0.32)]',
      textColor: 'text-slate-800',
      badgeColor: 'text-sky-700 bg-sky-100/60',
    }
  };

  // Map legacy color prop if passed (primary/secondary/tertiary/error)
  let activeThemeKey = color;
  if (color === 'primary') activeThemeKey = 'purple';
  else if (color === 'secondary') activeThemeKey = 'mint';
  else if (color === 'warning') activeThemeKey = 'amber';
  else if (color === 'tertiary') activeThemeKey = 'cyan';
  else if (color === 'error') activeThemeKey = 'rose';

  const theme = colorThemes[activeThemeKey] || colorThemes.purple;

  // Render icon safely
  const renderIcon = () => {
    if (!IconComponent) return <FileText className="w-5 h-5 text-white" />;
    if (typeof IconComponent === 'string') {
      // Legacy material symbol name fallback
      if (IconComponent === 'description') return <FileText className="w-5 h-5 text-white" />;
      if (IconComponent === 'group') return <FileText className="w-5 h-5 text-white" />;
      if (IconComponent === 'task_alt') return <CheckCircle2 className="w-5 h-5 text-white" />;
      return <Sparkles className="w-5 h-5 text-white" />;
    }
    return <IconComponent className="w-5 h-5 text-white stroke-[2.2]" />;
  };

  const isPositive = change && (change.startsWith('+') || change.includes('↑'));
  const isNegative = change && (change.startsWith('-') || change.includes('↓'));

  return (
    <div className={`${theme.cardBg} border rounded-[22px] p-5 text-left relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md group flex flex-col justify-between select-none`}>
      {/* Top Header: 3D Icon & Title / Change Pill */}
      <div className="flex items-center gap-3.5 mb-3">
        {/* Soft 3D Raised Icon Badge */}
        <div className={`w-11 h-11 rounded-2xl ${theme.iconGradient} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
          {renderIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-slate-500 tracking-tight truncate">
            {title}
          </p>
          <h3 className={`text-[28px] font-black tracking-tight leading-none ${theme.textColor} mt-1`}>
            {value}
          </h3>
        </div>
      </div>

      {/* Bottom Subtext / Trend Pill */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
        {change ? (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${theme.badgeColor}`}>
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              {change}
            </span>
            <span className="text-slate-400 text-[10.5px] truncate">{changeText}</span>
          </div>
        ) : footerText ? (
          <span className="text-slate-400 text-[11px]">{footerText}</span>
        ) : null}
      </div>
    </div>
  );
};

export default MetricCard;
