import React from 'react';

// Color accent for stats: maroon (primary), gold, blue (secondary), purple, green
const colorMap = {
  maroon: 'bg-[#7A0019]/10 text-[#7A0019]',
  primary: 'bg-[#7A0019]/10 text-[#7A0019]',
  gold: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-[#0038A8]/10 text-[#0038A8]',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
};

const AdminCard = ({ title, value, icon, subtitle, change, changeType, color }) => {
  const accent = color ? colorMap[color] || colorMap.maroon : 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {change && (
            <p className={`text-xs mt-2 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'positive' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        {icon && <div className={`p-3 rounded-xl ${accent}`}>{icon}</div>}
      </div>
    </div>
  );
};

export default AdminCard;