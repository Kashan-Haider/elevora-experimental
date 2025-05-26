import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Search } from 'lucide-react';

interface PageData {
  url: string;
  score: number;
  title: string;
}

interface PageListProps {
  pages: PageData[];
  title: string;
  maxItems?: number;
}

const PageList: React.FC<PageListProps> = ({
  pages,
  title,
  maxItems = 5
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter pages based on search term
  const filteredPages = pages.filter(page => 
    page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort pages by score (ascending)
  const sortedPages = [...filteredPages].sort((a, b) => a.score - b.score);
  
  // Display pages based on maxItems or all if searching
  const displayPages = searchTerm ? sortedPages : sortedPages.slice(0, maxItems);
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    return <AlertCircle className="h-4 w-4 text-rose-500" />;
  };
  
  return (
    <div className="bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-lg font-semibold text-primaryText mb-4">{title}</h3>
      
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-secondaryText" />
        </div>
        <input
          type="text"
          className="bg-surface border border-border rounded-lg py-2 pl-10 pr-4 w-full text-sm text-primaryText focus:outline-none focus:ring-1 focus:ring-primaryAccent"
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {displayPages.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayPages.map((page, index) => (
            <div 
              key={index} 
              className="flex items-center p-3 bg-surface rounded-lg hover:bg-surface/80 transition-colors"
            >
              <div className="mr-3">
                {getScoreIcon(page.score)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-primaryText truncate">
                    {page.title || 'Untitled Page'}
                  </h4>
                  <span className={`ml-2 font-medium ${getScoreColor(page.score)}`}>
                    {page.score}
                  </span>
                </div>
                <p className="text-xs text-secondaryText truncate mt-1">
                  {page.url}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-secondaryText">
          <p>No pages found</p>
        </div>
      )}
      
      {!searchTerm && pages.length > maxItems && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => setSearchTerm('')}
            className="text-xs text-primaryAccent hover:text-primaryAccent/80 transition-colors"
          >
            View all {pages.length} pages
          </button>
        </div>
      )}
    </div>
  );
};

export default PageList;