import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';

interface ScoreData {
  date: string;
  score: number;
}

interface ScoreTrendChartProps {
  data: ScoreData[];
  title: string;
}

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ data, title }) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-primaryText">{label}</p>
          <p className="text-sm text-primaryAccent">Score: {payload[0].value}</p>
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
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickMargin={10}
                angle={-45}
                height={60}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference lines for score thresholds */}
              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" />
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" />
              
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-secondaryText">
          <p>No trend data available</p>
        </div>
      )}
    </div>
  );
};

export default ScoreTrendChart;