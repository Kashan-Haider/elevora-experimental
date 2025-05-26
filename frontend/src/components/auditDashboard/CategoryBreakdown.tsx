import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryScore {
  name: string;
  score: number;
  value: number;
  maxValue: number;
}

interface CategoryBreakdownProps {
  categories: CategoryScore[];
  title: string;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories, title }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Format categories for pie chart
  const pieData = categories.map(cat => ({
    name: cat.name,
    value: cat.value,
    score: cat.score,
    maxValue: cat.maxValue,
    fill: COLORS[Math.floor(Math.random() * COLORS.length)]
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-primaryText">{data.name}</p>
          <p className="text-sm text-secondaryText">Score: {data.score}%</p>
          <p className="text-xs text-secondaryText">{data.value} / {data.maxValue} points</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-xs">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-secondaryText">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-lg font-semibold text-primaryText mb-2">{title}</h3>
      
      {categories.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      fill="#94a3b8" 
                      textAnchor={x > cx ? 'start' : 'end'} 
                      dominantBaseline="central"
                      fontSize={12}
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-secondaryText">
          <p>No category data available</p>
        </div>
      )}
    </div>
  );
};

export default CategoryBreakdown;