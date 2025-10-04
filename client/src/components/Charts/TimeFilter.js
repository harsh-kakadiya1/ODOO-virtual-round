import React from 'react';
import { Calendar, Clock, BarChart3 } from 'lucide-react';

const TimeFilter = ({ selectedPeriod, onPeriodChange, loading }) => {
  const periods = [
    {
      value: 'day',
      label: 'Today',
      icon: Clock,
      description: 'Last 24 hours'
    },
    {
      value: 'week',
      label: 'This Week',
      icon: Calendar,
      description: 'Last 7 days'
    },
    {
      value: 'month',
      label: 'This Month',
      icon: BarChart3,
      description: 'Last 30 days'
    }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Period:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        {periods.map((period) => {
          const Icon = period.icon;
          const isSelected = selectedPeriod === period.value;
          
          return (
            <button
              key={period.value}
              onClick={() => onPeriodChange(period.value)}
              disabled={loading}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={period.description}
            >
              <Icon className="h-4 w-4" />
              <span>{period.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeFilter;
