"use client";

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: LucideIcon;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray';
  description?: string;
  loading?: boolean;
}

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-500',
    border: 'border-green-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-500',
    border: 'border-blue-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'text-yellow-500',
    border: 'border-yellow-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'text-red-500',
    border: 'border-red-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-500',
    border: 'border-purple-200',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    icon: 'text-gray-500',
    border: 'border-gray-200',
  },
};

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'green',
  description,
  loading = false,
}: MetricCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format as currency for large numbers
      if (val >= 1000000) {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      }
      if (val >= 1000) {
        return new Intl.NumberFormat('id-ID').format(val);
      }
      return val.toString();
    }
    return val;
  };

  const renderChangeIndicator = () => {
    if (!change) return null;

    const { value: changeValue, type } = change;
    const isPositive = type === 'increase';
    const isNeutral = type === 'neutral';

    return (
      <div className={`flex items-center space-x-1 text-sm ${
        isPositive ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-red-600'
      }`}>
        {!isNeutral && (
          <svg
            className={`w-4 h-4 ${
              isPositive ? 'rotate-0' : 'rotate-180'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span>
          {isNeutral ? 'No change' : `${Math.abs(changeValue)}%`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {renderChangeIndicator()}
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`ml-4 p-3 rounded-lg ${colors.bg} ${colors.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}