"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ChartData {
  [key: string]: any;
}

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData[];
  width?: number | string;
  height?: number;
  xAxisKey?: string;
  yAxisKey?: string;
  dataKey?: string;
  nameKey?: string;
  color?: string;
  colors?: string[];
  title?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatXAxis?: boolean;
  formatYAxis?: boolean;
}

const COLORS = [
  '#10b981', // primary-600 (green)
  '#3b82f6', // secondary-600 (blue)
  '#f59e0b', // yellow-600
  '#ef4444', // red-600
  '#8b5cf6', // purple-600
  '#ec4899', // pink-600
  '#14b8a6', // teal-600
  '#f97316', // orange-600
];

export default function AnalyticsChart({
  type,
  data,
  width = '100%',
  height = 300,
  xAxisKey = 'name',
  yAxisKey = 'value',
  dataKey = 'value',
  nameKey = 'name',
  color = '#10b981',
  colors = COLORS,
  title,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  formatXAxis = false,
  formatYAxis = false,
}: AnalyticsChartProps) {

  // Custom tooltip formatter
  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(value);
    }
    return value;
  };

  // Format date for X axis
  const formatXAxisTick = (tickItem: any) => {
    if (formatXAxis && typeof tickItem === 'string') {
      try {
        const date = parseISO(tickItem);
        return format(date, 'MMM yyyy');
      } catch {
        return tickItem;
      }
    }
    return tickItem;
  };

  // Format Y axis values
  const formatYAxisTick = (tickItem: any) => {
    if (formatYAxis && typeof tickItem === 'number') {
      if (tickItem >= 1000000) {
        return `${(tickItem / 1000000).toFixed(1)}M`;
      }
      if (tickItem >= 1000) {
        return `${(tickItem / 1000).toFixed(1)}K`;
      }
      return tickItem.toString();
    }
    return tickItem;
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} width={width} height={height}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatXAxisTick}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatYAxisTick}
            />
            {showTooltip && (
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            )}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data} width={width} height={height}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatXAxisTick}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatYAxisTick}
            />
            {showTooltip && (
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            )}
            {showLegend && <Legend />}
            <Bar dataKey={yAxisKey} fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart width={width} height={height}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(Number(height), Number(width)) / 3}
              fill={color}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            )}
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart data={data} width={width} height={height}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatXAxisTick}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatYAxisTick}
            />
            {showTooltip && (
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            )}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={color}
              fill={color}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      default:
        return <div>Invalid chart type</div>;
    }
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width={width} height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}