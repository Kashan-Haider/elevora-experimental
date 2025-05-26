import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface Issue {
  issue: string;
  category: string;
  importance: number;
  count?: number;
}

interface IssueListProps {
  issues: Issue[];
  title: string;
  maxItems?: number;
  showCount?: boolean;
}

const IssueList: React.FC<IssueListProps> = ({
  issues,
  title,
  maxItems = 5,
  showCount = true
}) => {
  const getImportanceIcon = (importance: number) => {
    if (importance >= 8) return <AlertCircle className="h-4 w-4 text-rose-500" />;
    if (importance >= 5) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  };

  const getImportanceLabel = (importance: number) => {
    if (importance >= 8) return 'High';
    if (importance >= 5) return 'Medium';
    return 'Low';
  };

  const getCategoryDisplay = (category: string) => {
    const [mainCategory, subCategory] = category.split('.');
    return `${mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1)} • ${subCategory}`;
  };

  return (
    <div className="bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-lg font-semibold text-primaryText mb-4">{title}</h3>
      {issues.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {issues.slice(0, maxItems).map((issue, index) => (
            <div 
              key={index} 
              className="flex gap-3 p-3 bg-surface rounded-lg hover:bg-surface/80 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {getImportanceIcon(issue.importance)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-primaryText text-sm font-medium truncate">{issue.issue}</p>
                  {showCount && issue.count && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primaryAccent/20 text-primaryAccent">
                      {issue.count}
                    </span>
                  )}
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-secondaryText text-xs">
                    {getCategoryDisplay(issue.category)} • 
                    <span className={`ml-1 ${
                      issue.importance >= 8 ? 'text-rose-500' : 
                      issue.importance >= 5 ? 'text-amber-500' : 
                      'text-emerald-500'
                    }`}>
                      {getImportanceLabel(issue.importance)} Priority
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-secondaryText">
          <p>No issues found</p>
        </div>
      )}
    </div>
  );
};

export default IssueList;