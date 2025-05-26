import React from 'react';

interface ScoreGaugeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  value,
  size = 'md',
  showLabel = true,
  label
}) => {
  // Normalize value between 0 and 100
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  // Calculate angle based on normalized value (0 = -90deg, 100 = 270deg)
  const angle = (normalizedValue / 100) * 360 - 90;
  
  // Get color based on value
  const getColor = () => {
    if (normalizedValue >= 70) return '#10b981'; // Green
    if (normalizedValue >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };
  
  // Get size based on prop
  const getSize = () => {
    switch (size) {
      case 'sm': return { outer: 80, inner: 64 };
      case 'lg': return { outer: 160, inner: 132 };
      default: return { outer: 120, inner: 96 };
    }
  };
  
  const { outer, inner } = getSize();
  const strokeWidth = outer - inner;
  const radius = inner / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalizedValue / 100);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: outer, height: outer }}>
        {/* Background circle */}
        <svg width={outer} height={outer} className="absolute top-0 left-0">
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
        </svg>
        
        {/* Progress circle */}
        <svg width={outer} height={outer} className="absolute top-0 left-0 transform -rotate-90">
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="transparent"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Value text */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-primaryText font-bold" style={{ fontSize: inner / 3 }}>
            {normalizedValue}
          </span>
          {showLabel && (
            <span className="text-secondaryText mt-1" style={{ fontSize: inner / 10 }}>
              {label || 'SCORE'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;