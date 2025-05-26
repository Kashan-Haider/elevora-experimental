import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'success' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  color = 'default'
}) => {
  const getBgColor = () => {
    switch (color) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'error': return 'bg-rose-500/10 border-rose-500/20';
      default: return 'bg-secondary border-border';
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-rose-500';
      default: return 'text-primaryAccent';
    }
  };

  return (
    <div className={`rounded-lg p-6 border ${getBgColor()} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-secondaryText">{title}</h3>
        </div>
        <div className={`p-2 rounded-lg ${color === 'default' ? 'bg-primaryAccent/10' : ''}`}>
          <div className={getIconColor()}>{icon}</div>
        </div>
      </div>
      
      <div className="mt-1">
        <p className="text-2xl font-bold text-primaryText">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-secondaryText">{description}</p>
        )}
      </div>
      
      {trend && (
        <div className="flex items-center mt-3">
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-500 mr-1" />
          )}
          <span className={`text-xs ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.value}% {trend.isPositive ? 'improvement' : 'decrease'} from last audit
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;