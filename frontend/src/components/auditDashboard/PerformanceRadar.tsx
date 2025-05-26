import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip 
} from 'recharts';

interface CategoryData {
  category: string;
  score: number;
  maxPossible: number;
}

interface PerformanceRadarProps {
  data: CategoryData[];
  title: string;
}

const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ data, title }) => {
  // Format data for radar chart
  const chartData = data.map(item => ({
    subject: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    score: item.score,
    fullMark: 10
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-primaryText">{payload[0].payload.subject}</p>
          <p className="text-sm text-primaryAccent">
            Score: {payload[0].value} / {payload[0].payload.fullMark}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-lg font-semibold text-primaryText mb-2">{title}</h3>
      
      {data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis 
                dataKey="subject"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 10]} 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Radar
                name="Performance"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-secondaryText">
          <p>No performance data available</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceRadar;