import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DistributionItem {
  range: string;
  count: number;
}

interface ScoreDistributionProps {
  data: DistributionItem[];
  title: string;
}

const ScoreDistribution: React.FC<ScoreDistributionProps> = ({ data, title }) => {
  // Define colors for different score ranges
  const COLORS = {
    'Excellent (80-100)': '#10b981',
    'Good (60-79)': '#3b82f6',
    'Fair (40-59)': '#f59e0b',
    'Poor (0-39)': '#ef4444',
  };
  
  // Filter out ranges with count of 0
  const filteredData = data.filter(item => item.count > 0);
  
  // Calculate total count
  const totalCount = filteredData.reduce((sum, item) => sum + item.count, 0);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = Math.round((data.count / totalCount) * 100);
      
      return (
        <div className="bg-surface p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-primaryText">{data.range}</p>
          <p className="text-sm text-secondaryText">
            {data.count} pages ({percentage}%)
          </p>
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
      
      {filteredData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.range as keyof typeof COLORS] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-secondaryText">
          <p>No distribution data available</p>
        </div>
      )}
    </div>
  );
};

export default ScoreDistribution;