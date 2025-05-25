import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Globe, AlertCircle, CheckCircle, Eye, Search, Image, Link, LucideIcon } from 'lucide-react';
import { useProjectStore } from '../../store/ProjectStore'; // Update this import path

// Type definitions
interface Project {
  id: string;
  name: string;
}

interface Issue {
  issue: string;
  count?: number;
  importance?: number;
}

interface Audit {
  id: string;
  page_id: string;
  audit_type: string;
  score?: number;
  issues?: string;
  recommendations?: string;
  created_at?: string;
}

interface ScoreDistribution {
  range: string;
  count: number;
}

interface ScoreTrend {
  date: string;
  score: number;
  audit_type: string;
}

interface TopIssue {
  issue: string;
  count: number;
  importance: number;
}

interface CategoryPerformance {
  category: string;
  average: number;
  max: number;
}

interface DashboardOverview {
  totalPages: number;
  totalAudits: number;
  averageScore: number;
  lastAuditDate: string;
}

interface DashboardData {
  overview: DashboardOverview;
  scoreDistribution: ScoreDistribution[];
  scoreTrend: ScoreTrend[];
  topIssues: TopIssue[];
  categoryPerformance: CategoryPerformance[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
}

interface ProjectStore {
  selectedProject: Project | null;
}

const AuditDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  
  const navigate = useNavigate();
  const { selectedProject }: ProjectStore = useProjectStore();

  // Get access token from localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    setAccessToken(token);
  }, []);

  // Check if user has projects
  const checkNewUser = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    
    try {
      const res = await fetch("http://localhost:8000/has-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}` 
        }
      });

      if (!res.ok) {
        throw new Error('Failed to check user projects');
      }

      const has_project: boolean = await res.json();
      if (!has_project) {
        navigate("/get-started");
      }
    } catch (error) {
      console.error('Error checking user projects:', error);
      setError('Failed to verify user access');
    }
  }, [accessToken, navigate]);

  // Check user access when component mounts
  useEffect(() => {
    if (accessToken) {
      checkNewUser();
    }
  }, [checkNewUser, accessToken]);

  // Fetch dashboard data when project or token changes
  useEffect(() => {
    if (selectedProject?.id && accessToken) {
      fetchDashboardData();
    }
  }, [selectedProject?.id, accessToken]);

  const fetchDashboardData = async (): Promise<void> => {
    if (!selectedProject?.id || !accessToken) {
      setError('No project selected or missing authentication');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = 'http://localhost:8000';
      
      // Use the new endpoint
      const response = await fetch(`${baseUrl}/get-audit-data?project_id=${selectedProject.id}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit data: ${response.status}`);
      }

      const auditsData: Audit[] = await response.json();

      // Process the data for dashboard display
      const processedData = processAuditData(auditsData);
      setDashboardData(processedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const processAuditData = (audits: Audit[]): DashboardData => {
    // Ensure we have an array
    const auditsArray = Array.isArray(audits) ? audits : [];

    // Get unique pages from audits
    const uniquePageIds = new Set(auditsArray.map(audit => audit.page_id));
    const totalPages = uniquePageIds.size;

    // Calculate overview metrics
    const totalAudits = auditsArray.length;
    const averageScore = auditsArray.length > 0 
      ? auditsArray.reduce((sum, audit) => sum + (audit.score || 0), 0) / auditsArray.length 
      : 0;
    
    // Score distribution
    const scoreRanges: Record<string, number> = { 
      'Excellent (80-100)': 0, 
      'Good (60-79)': 0, 
      'Fair (40-59)': 0, 
      'Poor (0-39)': 0 
    };
    
    auditsArray.forEach(audit => {
      const score = audit.score || 0;
      if (score >= 80) scoreRanges['Excellent (80-100)']++;
      else if (score >= 60) scoreRanges['Good (60-79)']++;
      else if (score >= 40) scoreRanges['Fair (40-59)']++;
      else scoreRanges['Poor (0-39)']++;
    });

    // Score trend over time
    const scoreTrend: ScoreTrend[] = auditsArray
      .filter(audit => audit.created_at && audit.score !== undefined)
      .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
      .map(audit => ({
        date: new Date(audit.created_at!).toLocaleDateString(),
        score: audit.score || 0,
        audit_type: audit.audit_type || 'SEO'
      }));

    // Issue analysis
    const allIssues: Issue[] = auditsArray.flatMap(audit => {
      try {
        return JSON.parse(audit.issues || '[]');
      } catch {
        return [];
      }
    });
    
    const issueCount: Record<string, number> = {};
    const issueImportance: Record<string, number> = {};
    
    allIssues.forEach(issue => {
      if (issue.issue) {
        issueCount[issue.issue] = (issueCount[issue.issue] || 0) + (issue.count || 1);
        issueImportance[issue.issue] = issue.importance || 5;
      }
    });

    const topIssues: TopIssue[] = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([issue, count]) => ({
        issue: issue.substring(0, 50) + (issue.length > 50 ? '...' : ''),
        count,
        importance: issueImportance[issue] || 5
      }));

    // Category performance based on audit types
    const auditTypeScores: Record<string, number[]> = {};
    
    auditsArray.forEach(audit => {
      if (audit.audit_type && audit.score !== undefined) {
        if (!auditTypeScores[audit.audit_type]) {
          auditTypeScores[audit.audit_type] = [];
        }
        auditTypeScores[audit.audit_type].push(audit.score);
      }
    });

    const categoryPerformance: CategoryPerformance[] = Object.entries(auditTypeScores).map(([type, scores]) => ({
      category: type.charAt(0).toUpperCase() + type.slice(1),
      average: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
      max: scores.length > 0 ? Math.max(...scores) : 0
    }));

    // Get last audit date
    const lastAuditDate = auditsArray.length > 0 
      ? new Date(Math.max(...auditsArray.map(a => new Date(a.created_at || 0).getTime()))).toLocaleDateString() 
      : 'N/A';

    return {
      overview: {
        totalPages,
        totalAudits,
        averageScore: Math.round(averageScore),
        lastAuditDate
      },
      scoreDistribution: Object.entries(scoreRanges).map(([range, count]) => ({ range, count })),
      scoreTrend: scoreTrend.slice(-10), // Last 10 audits
      topIssues,
      categoryPerformance
    };
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="bg-secondary rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondaryText text-sm font-medium">{title}</p>
          <p className="text-primaryText text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-secondaryText text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="bg-primaryAccent/10 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-primaryAccent" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-success mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-error mr-1" />
          )}
          <span className={`text-sm ${trend > 0 ? 'text-success' : 'text-error'}`}>
            {Math.abs(trend)}% from last audit
          </span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryAccent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
            <h3 className="text-primaryText text-lg font-medium">Error Loading Dashboard</h3>
            <p className="text-secondaryText mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="bg-primaryAccent text-white px-4 py-2 rounded-lg hover:bg-primaryAccent/80 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Globe className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-primaryText text-lg font-medium">No Project Selected</h3>
            <p className="text-secondaryText">Please select a project to view the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-primaryText text-lg font-medium">No data available</h3>
            <p className="text-secondaryText">Start by running an SEO audit on your pages.</p>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primaryText mb-2">SEO Dashboard</h1>
          <p className="text-secondaryText">
            Monitor your website's SEO performance and track improvements
            {selectedProject && (
              <span className="ml-2 text-primaryAccent">• {selectedProject.name}</span>
            )}
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Pages"
            value={dashboardData.overview.totalPages}
            subtitle="Pages monitored"
            icon={Globe}
          />
          <StatCard
            title="Total Audits"
            value={dashboardData.overview.totalAudits}
            subtitle="Audits completed"
            icon={Search}
          />
          <StatCard
            title="Average Score"
            value={`${dashboardData.overview.averageScore}/100`}
            subtitle="Overall SEO health"
            icon={CheckCircle}
          />
          <StatCard
            title="Last Audit"
            value={dashboardData.overview.lastAuditDate}
            subtitle="Most recent scan"
            icon={Eye}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Trend */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <h3 className="text-primaryText text-lg font-semibold mb-4">Score Trend</h3>
            {dashboardData.scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f26',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-secondaryText">
                No audit data available
              </div>
            )}
          </div>

          {/* Score Distribution */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <h3 className="text-primaryText text-lg font-semibold mb-4">Score Distribution</h3>
            {dashboardData.scoreDistribution.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.scoreDistribution.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, count }: { range: string; count: number }) => `${range}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData.scoreDistribution.filter(d => d.count > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f26',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-secondaryText">
                No score data available
              </div>
            )}
          </div>
        </div>

        {/* Category Performance & Top Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <h3 className="text-primaryText text-lg font-semibold mb-4">Audit Type Performance</h3>
            {dashboardData.categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={dashboardData.categoryPerformance}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Radar
                    name="Average Score"
                    dataKey="average"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-secondaryText">
                No category data available
              </div>
            )}
          </div>

          {/* Top Issues */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <h3 className="text-primaryText text-lg font-semibold mb-4">Top Issues</h3>
            {dashboardData.topIssues.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {dashboardData.topIssues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div className="flex-1">
                      <p className="text-primaryText text-sm font-medium">{issue.issue}</p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          issue.importance >= 8 ? 'bg-error' :
                          issue.importance >= 6 ? 'bg-warning' : 'bg-success'
                        }`} />
                        <span className="text-secondaryText text-xs">
                          Priority: {issue.importance >= 8 ? 'High' : issue.importance >= 6 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="bg-primaryAccent/20 text-primaryAccent px-2 py-1 rounded-full text-xs font-medium">
                        {issue.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-72 text-secondaryText">
                No issues found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;