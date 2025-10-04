import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ExpenseTrendChart = ({ data, loading, period }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No expense data available for the selected period</p>
      </div>
    );
  }

  // Format dates based on period
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      switch (period) {
        case 'day':
          return format(date, 'HH:mm');
        case 'week':
          return format(date, 'MMM dd');
        case 'month':
          return format(date, 'MMM dd');
        default:
          return format(date, 'MMM dd');
      }
    } catch (error) {
      return dateString;
    }
  };

  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Total Expenses',
        data: data.map(item => item.total),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: period === 'day' ? 'Time' : 'Date',
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount ($)',
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ExpenseTrendChart;
