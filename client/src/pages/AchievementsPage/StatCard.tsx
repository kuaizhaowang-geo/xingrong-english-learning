import React from 'react';

export interface StatCardProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  label,
  value,
  subtext,
}) => {
  return (
     <div
       className="rounded-xl p-4 border text-center transition-all duration-300 hover:scale-105 backdrop-blur-xl"
       style={{
         backgroundColor: 'rgba(15, 23, 42, 0.6)',
         borderColor: 'rgba(139, 92, 246, 0.25)',
       }}
     >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
        style={{
          backgroundColor: `${iconColor}20`,
          color: iconColor,
          boxShadow: `0 0 15px ${iconColor}30`,
        }}
      >
        {icon}
      </div>
      <p
        className="text-xl md:text-2xl font-bold mb-0.5"
        style={{ color: '#F1F5F9' }}
      >
        {value}
      </p>
       <p className="text-xs" style={{ color: '#94A3B8' }}>
         {label}
         <span className="ml-1" style={{ color: '#64748B' }}>
           {subtext}
         </span>
       </p>
    </div>
  );
};

export default StatCard;
