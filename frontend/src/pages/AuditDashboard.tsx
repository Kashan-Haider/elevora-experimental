import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  Award, AlertCircle, Globe, FileText, Zap, Database, 
  BarChart2, Search, CheckCircle, ArrowUpRight, Calendar,
  AlertTriangle, BookOpen, Code, Link, Laptop, Flag
} from 'lucide-react';
import { useProjectStore } from '../../store/ProjectStore'

// Import custom components
import MetricCard from '../components/auditDashboard/MetricCard';
import ScoreGauge from '../components/auditDashboard/ScoreGauge';
import IssueList from '../components/auditDashboard/IssueList';
import CategoryBreakdown from '../components/auditDashboard/CategoryBreakdown';
import PerformanceRadar from '../components/auditDashboard/PerformanceRadar';
import ScoreTrendChart from '../components/auditDashboard/ScoreTrendingChart';
import PageList from '../components/auditDashboard/PageList';
import ScoreDistribution from '../components/auditDashboard/ScoreDistribution';

// Type definitions
interface Project {
  id: string;
  name: string;
}

interface AuditMetric {
  id: string;
  audit_id: string;
  category: string;
  subcategory: string;
  metric_name: string;
  metric_value: string | null;
  text_value: string | null;
  boolean_value: boolean | null;
  json_value: any | null;
  created_at: string;
}

interface CategoryScore {
  category: string;
  score: number;
  count: number;
}

interface ScoreDistributionItem {
  range: string;
  count: number;
}

interface ScoreTrend {
  date: string;
  score: number;
}

interface TopIssue {
  issue: string;
  category: string;
  subcategory: string;
  importance: number;
  count?: number;
}

interface CategoryPerformance {
  category: string;
  score: number;
  maxPossible: number;
}

interface DashboardOverview {
  totalAudits: number;
  averageScore: number;
  lastAuditDate: string;
  totalPages: number;
  totalIssues?: number;
  highPriorityIssues?: number;
}

interface PageData {
  url: string;
  score: number;
  title: string;
}

interface DashboardData {
  overview: DashboardOverview;
  scoreDistribution: ScoreDistributionItem[];
  scoreTrend: ScoreTrend[];
  topIssues: TopIssue[];
  categoryPerformance: CategoryPerformance[];
  categoryBreakdown?: Array<{name: string; score: number; value: number; maxValue: number}>;
  pages?: PageData[];
}

const AuditDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'pages'>('overview');
  
  const navigate = useNavigate();
  const { selectedProject } = useProjectStore();

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
      
      // Fetch the audit metrics data
      const response = await fetch(`${baseUrl}/get-audit-data?project_id=${selectedProject.id}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit data: ${response.status}`);
      }

      const metricsData: AuditMetric[] = await response.json();
      
      // Process the data format
      const processedData = processAuditMetricsData(metricsData);
      console.log(processedData)
      setDashboardData(processedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const processAuditMetricsData = (metrics: AuditMetric[]): DashboardData => {
    // Ensure we have an array
    const metricsArray = Array.isArray(metrics) ? metrics : [];
    
    // Get unique audit IDs to count total audits
    const uniqueAuditIds = new Set(metricsArray.map(metric => metric.audit_id));
    const totalAudits = uniqueAuditIds.size;
    
    // Get unique page IDs by assuming different audit_ids are for different pages
    const uniquePageUrls = new Set();
    const pageScores: Record<string, {score: number, title: string}> = {};
    
    metricsArray.forEach(metric => {
      if (metric.metric_name === 'page_url' && metric.text_value) {
        uniquePageUrls.add(metric.text_value);
      }
      
      // Collect page scores and titles
      if (metric.metric_name === 'score' && metric.category === 'overview' && metric.audit_id) {
        // Find the associated page URL
        const pageUrlMetric = metricsArray.find(m => 
          m.audit_id === metric.audit_id && m.metric_name === 'page_url' && m.text_value
        );
        
        const pageTitleMetric = metricsArray.find(m => 
          m.audit_id === metric.audit_id && m.metric_name === 'title' && m.text_value
        );
        
        if (pageUrlMetric?.text_value) {
          pageScores[pageUrlMetric.text_value] = {
            score: metric.metric_value ? parseInt(metric.metric_value) : 0,
            title: pageTitleMetric?.text_value || 'Untitled Page'
          };
        }
      }
    });
    
    const totalPages = uniquePageUrls.size || Math.min(uniqueAuditIds.size, 10);
    
    // Get the latest date from the metrics
    const lastAuditDate = metricsArray.length > 0 
      ? new Date(Math.max(...metricsArray.map(m => new Date(m.created_at).getTime()))).toLocaleDateString() 
      : 'N/A';
    
    // Calculate category scores
    const categoryScores: Record<string, CategoryScore> = {};
    
    metricsArray.forEach(metric => {
      if (metric.category && metric.metric_name === 'score' && metric.metric_value) {
        if (!categoryScores[metric.category]) {
          categoryScores[metric.category] = {
            category: metric.category,
            score: 0,
            count: 0
          };
        }
        categoryScores[metric.category].score += parseFloat(metric.metric_value);
        categoryScores[metric.category].count += 1;
      }
    });
    
    // Calculate average scores per category
    const averageScores = Object.values(categoryScores).map(cat => ({
      category: cat.category,
      score: cat.count > 0 ? cat.score / cat.count : 0,
      maxPossible: 10 // Assuming scores are on a scale of 0-10
    }));
    
    // More detailed category breakdown for visualization
    const categoryBreakdown = Object.entries(categoryScores).map(([category, data]) => {
      // Find subcategories
      const subcategories: Record<string, {score: number, count: number, maxValue: number}> = {};
      
      metricsArray.forEach(metric => {
        if (metric.category === category && metric.subcategory && 
            metric.metric_name === 'score' && metric.metric_value) {
              
          if (!subcategories[metric.subcategory]) {
            subcategories[metric.subcategory] = {
              score: 0,
              count: 0,
              maxValue: 10 // Default max value
            };
          }
          
          subcategories[metric.subcategory].score += parseFloat(metric.metric_value);
          subcategories[metric.subcategory].count += 1;
          
          // Try to find max value from corresponding max_score metric
          const maxScoreMetric = metricsArray.find(m => 
            m.category === category && 
            m.subcategory === metric.subcategory && 
            m.metric_name === 'max_score' &&
            m.metric_value
          );
          
          if (maxScoreMetric?.metric_value) {
            subcategories[metric.subcategory].maxValue = parseFloat(maxScoreMetric.metric_value);
          }
        }
      });
      
      // Calculate average score for each subcategory
      return Object.entries(subcategories).map(([subcat, data]) => ({
        name: `${category}.${subcat}`,
        score: data.count > 0 ? Math.round((data.score / data.count) * 10) : 0,
        value: data.count > 0 ? Math.round(data.score / data.count) : 0,
        maxValue: data.maxValue
      }));
    }).flat();
    
    // Calculate overall average score
    const totalScorePoints = Object.values(categoryScores).reduce((sum, cat) => sum + cat.score, 0);
    const totalScoreCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.count, 0);
    const averageScore = totalScoreCount > 0 ? Math.round((totalScorePoints / totalScoreCount) * 10) : 0; // Scale to 0-100
    
    // Group scores for distribution
    const scoreDistribution = [
      { range: 'Excellent (80-100)', count: 0 },
      { range: 'Good (60-79)', count: 0 },
      { range: 'Fair (40-59)', count: 0 },
      { range: 'Poor (0-39)', count: 0 }
    ];
    
    // Count pages in each score range
    Object.values(pageScores).forEach(page => {
      const score = page.score;
      if (score >= 80) scoreDistribution[0].count++;
      else if (score >= 60) scoreDistribution[1].count++;
      else if (score >= 40) scoreDistribution[2].count++;
      else scoreDistribution[3].count++;
    });
    
    // Generate score trend - group by audit date and get average scores
    const auditDates: Record<string, { sum: number; count: number }> = {};
    
    metricsArray.forEach(metric => {
      if (metric.metric_name === 'score' && metric.metric_value) {
        const date = new Date(metric.created_at).toLocaleDateString();
        if (!auditDates[date]) {
          auditDates[date] = { sum: 0, count: 0 };
        }
        auditDates[date].sum += parseFloat(metric.metric_value);
        auditDates[date].count += 1;
      }
    });
    
    const scoreTrend = Object.entries(auditDates)
      .map(([date, data]) => ({
        date,
        score: data.count > 0 ? Math.round((data.sum / data.count) * 10) : 0 // Scale to 0-100
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Identify top issues based on low scores and status !== "good"
    const potentialIssues: TopIssue[] = [];
    
    metricsArray.forEach(metric => {
      if (metric.metric_name === 'status' && metric.text_value && metric.text_value !== 'good') {
        potentialIssues.push({
          issue: `${metric.subcategory}: ${metric.text_value}`,
          category: `${metric.category}.${metric.subcategory}`,
          subcategory: metric.subcategory,
          importance: getIssueImportance(metric.category, metric.subcategory)
        });
      }
      
      // Also check for low scores
      if (metric.metric_name === 'score' && metric.metric_value && parseFloat(metric.metric_value) < 5) {
        potentialIssues.push({
          issue: `Low ${metric.subcategory} score: ${metric.metric_value}/10`,
          category: `${metric.category}.${metric.subcategory}`,
          subcategory: metric.subcategory,
          importance: getIssueImportance(metric.category, metric.subcategory)
        });
      }
      
      // Check for recommendations
      if (metric.metric_name === 'recommendations' && metric.json_value) {
        const recommendations = Array.isArray(metric.json_value) ? metric.json_value : [];
        recommendations.forEach((rec: string) => {
          potentialIssues.push({
            issue: rec,
            category: `${metric.category}.${metric.subcategory}`,
            subcategory: metric.subcategory,
            importance: getIssueImportance(metric.category, metric.subcategory)
          });
        });
      }
    });
    
    // Deduplicate and count issues
    const issueCounter: Record<string, {count: number, issue: TopIssue}> = {};
    potentialIssues.forEach(issue => {
      const key = `${issue.issue}-${issue.category}`;
      if (!issueCounter[key]) {
        issueCounter[key] = {
          count: 0,
          issue
        };
      }
      issueCounter[key].count += 1;
    });
    
    // Add counts to issues and sort by importance
    const issuesWithCounts = Object.values(issueCounter)
      .map(({ count, issue }) => ({ ...issue, count }))
      .sort((a, b) => b.importance - a.importance || b.count! - a.count!);
    
    // Count high priority issues
    const highPriorityIssues = issuesWithCounts.filter(issue => issue.importance >= 8).length;
    
    // Convert page scores to array
    const pagesArray = Object.entries(pageScores).map(([url, data]) => ({
      url,
      score: data.score,
      title: data.title
    }));
    
    return {
      overview: {
        totalAudits,
        averageScore,
        lastAuditDate,
        totalPages,
        totalIssues: issuesWithCounts.length,
        highPriorityIssues
      },
      scoreDistribution,
      scoreTrend: scoreTrend.slice(-10), // Last 10 dates
      topIssues: issuesWithCounts.slice(0, 20), // Top 20 issues
      categoryPerformance: averageScores,
      categoryBreakdown,
      pages: pagesArray
    };
  };
  
  // Helper function to assign importance to issues based on category
  const getIssueImportance = (category: string, subcategory: string): number => {
    // These values are heuristics and can be adjusted based on SEO knowledge
    const highImportanceCategories = ['content', 'metadata', 'technical'];
    const highImportanceSubcategories = [
      'keyword_optimization', 'title', 'meta_description', 
      'mobile_friendly', 'page_speed_indicators', 'structured_data',
      'security'
    ];
    
    if (highImportanceCategories.includes(category) && highImportanceSubcategories.includes(subcategory)) {
      return 9; // High importance
    } else if (highImportanceCategories.includes(category) || highImportanceSubcategories.includes(subcategory)) {
      return 7; // Medium importance
    }
    return 5; // Standard importance
  };

  // Helper to get the appropriate icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'metadata': return <Database className="h-5 w-5" />;
      case 'content': return <FileText className="h-5 w-5" />;
      case 'media': return <BarChart2 className="h-5 w-5" />;
      case 'technical': return <Code className="h-5 w-5" />;
      case 'links': return <Link className="h-5 w-5" />;
      case 'international': return <Flag className="h-5 w-5" />;
      default: return <Search className="h-5 w-5" />;
    }
  };

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
          <div className="bg-secondary rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-primaryText text-xl font-medium mb-2">Error Loading Dashboard</h3>
            <p className="text-secondaryText mb-6">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="bg-primaryAccent text-white px-5 py-2 rounded-lg hover:bg-primaryAccent/90 transition-colors"
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
          <div className="bg-secondary rounded-lg p-8 text-center">
            <Globe className="h-12 w-12 text-secondaryText mx-auto mb-4" />
            <h3 className="text-primaryText text-xl font-medium mb-2">No Project Selected</h3>
            <p className="text-secondaryText mb-6">Please select a project to view the SEO audit dashboard.</p>
            <button
              onClick={() => navigate("/projects")}
              className="bg-primaryAccent text-white px-5 py-2 rounded-lg hover:bg-primaryAccent/90 transition-colors"
            >
              Select Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-secondary rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-primaryText text-xl font-medium mb-2">No Audit Data Available</h3>
            <p className="text-secondaryText mb-6">Start by running an SEO audit on your project pages.</p>
            <button
              onClick={() => navigate("/audit")}
              className="bg-primaryAccent text-white px-5 py-2 rounded-lg hover:bg-primaryAccent/90 transition-colors"
            >
              Run Audit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pb-12">
      {/* Header Section */}
      <div className="bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto p-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-primaryText sm:text-3xl sm:tracking-tight flex items-center">
                SEO Audit Dashboard
                {selectedProject && (
                  <span className="ml-3 px-3 py-1 text-sm bg-primaryAccent/10 text-primaryAccent rounded-full">
                    {selectedProject.name}
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-secondaryText">
                Technical SEO performance analysis and monitoring
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                type="button"
                onClick={() => navigate("/audit")}
                className="ml-3 inline-flex items-center rounded-md bg-primaryAccent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primaryAccent/90 focus:outline-none"
              >
                <ArrowUpRight className="-ml-0.5 mr-1.5 h-4 w-4" />
                Run New Audit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-primaryAccent text-primaryAccent'
                  : 'border-transparent text-secondaryText hover:border-border hover:text-primaryText'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`py-4 px-1 text-sm font-medium border-b-2 flex items-center ${
                activeTab === 'issues'
                  ? 'border-primaryAccent text-primaryAccent'
                  : 'border-transparent text-secondaryText hover:border-border hover:text-primaryText'
              }`}
            >
              Issues
              {dashboardData.overview.totalIssues ? (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-500">
                  {dashboardData.overview.totalIssues}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'pages'
                  ? 'border-primaryAccent text-primaryAccent'
                  : 'border-transparent text-secondaryText hover:border-border hover:text-primaryText'
              }`}
            >
              Pages
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Top Stats and Score */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Score Gauge */}
              <div className="lg:col-span-1 bg-secondary rounded-lg border border-border p-6 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-primaryText mb-4">Overall Score</h3>
                <ScoreGauge 
                  value={dashboardData.overview.averageScore} 
                  size="lg"
                  label="SEO HEALTH" 
                />
                <div className="mt-4 text-center">
                  <p className="text-sm text-secondaryText">
                    Last updated: {dashboardData.overview.lastAuditDate}
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Pages Audited"
                  value={dashboardData.overview.totalPages}
                  description="Total monitored pages"
                  icon={<Globe className="h-5 w-5" />}
                />
                <MetricCard
                  title="Total Audits"
                  value={dashboardData.overview.totalAudits}
                  description="Completed audits"
                  icon={<FileText className="h-5 w-5" />}
                />
                <MetricCard
                  title="Issues Found"
                  value={dashboardData.overview.totalIssues || 0}
                  description={`${dashboardData.overview.highPriorityIssues || 0} high priority`}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  color={dashboardData.overview.highPriorityIssues && dashboardData.overview.highPriorityIssues > 3 ? 'warning' : 'default'}
                />
                <MetricCard
                  title="Last Audit"
                  value={dashboardData.overview.lastAuditDate}
                  description="Most recent scan"
                  icon={<Calendar className="h-5 w-5" />}
                />
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ScoreTrendChart
                data={dashboardData.scoreTrend}
                title="Score Trend"
              />
              <ScoreDistribution
                data={dashboardData.scoreDistribution}
                title="Score Distribution"
              />
            </div>

            {/* Category Performance and Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-1">
                <PerformanceRadar
                  data={dashboardData.categoryPerformance}
                  title="Category Performance"
                />
              </div>
              <div className="lg:col-span-2">
                <IssueList
                  issues={dashboardData.topIssues.slice(0, 5)}
                  title="Top Issues"
                  showCount={true}
                />
              </div>
            </div>

            {/* Category Breakdown and Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CategoryBreakdown
                  categories={dashboardData.categoryBreakdown || []}
                  title="SEO Health by Category"
                />
              </div>
              <div className="lg:col-span-2">
                <div className="bg-secondary rounded-lg p-5 border border-border">
                  <h3 className="text-lg font-semibold text-primaryText mb-4">Category Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {dashboardData.categoryPerformance.map((category, index) => (
                      <div 
                        key={index} 
                        className="bg-surface p-4 rounded-lg border border-border hover:border-primaryAccent/50 transition-all"
                      >
                        <div className="flex items-center mb-2">
                          {getCategoryIcon(category.category)}
                          <h4 className="ml-2 text-sm font-medium text-primaryText capitalize">
                            {category.category}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-primaryText">
                              {Math.round(category.score * 10)}%
                            </p>
                          </div>
                          <div>
                            {category.score * 10 >= 70 ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : category.score * 10 >= 40 ? (
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-rose-500" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-surface border border-border rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                category.score * 10 >= 70 ? 'bg-emerald-500' : 
                                category.score * 10 >= 40 ? 'bg-amber-500' : 
                                'bg-rose-500'
                              }`}
                              style={{ width: `${Math.round(category.score * 10)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total Issues"
                value={dashboardData.overview.totalIssues || 0}
                description="All detected issues"
                icon={<AlertCircle className="h-5 w-5" />}
              />
              <MetricCard
                title="High Priority"
                value={dashboardData.overview.highPriorityIssues || 0}
                description="Critical SEO problems"
                icon={<AlertTriangle className="h-5 w-5" />}
                color={dashboardData.overview.highPriorityIssues && dashboardData.overview.highPriorityIssues > 3 ? 'error' : 'warning'}
              />
              <MetricCard
                title="SEO Health Score"
                value={`${dashboardData.overview.averageScore}/100`}
                description="Overall site health"
                icon={<Award className="h-5 w-5" />}
                color={dashboardData.overview.averageScore >= 70 ? 'success' : 
                       dashboardData.overview.averageScore >= 40 ? 'warning' : 'error'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-secondary rounded-lg p-5 border border-border">
                <h3 className="text-lg font-semibold text-primaryText mb-4">Issues by Priority</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-rose-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        High Priority
                      </span>
                      <span className="text-sm text-secondaryText">
                        {dashboardData.topIssues.filter(i => i.importance >= 8).length} issues
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-rose-500"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.topIssues.filter(i => i.importance >= 8).length / 
                            (dashboardData.overview.totalIssues || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-amber-500 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Medium Priority
                      </span>
                      <span className="text-sm text-secondaryText">
                        {dashboardData.topIssues.filter(i => i.importance >= 5 && i.importance < 8).length} issues
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-amber-500"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.topIssues.filter(i => i.importance >= 5 && i.importance < 8).length / 
                            (dashboardData.overview.totalIssues || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-emerald-500 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Low Priority
                      </span>
                      <span className="text-sm text-secondaryText">
                        {dashboardData.topIssues.filter(i => i.importance < 5).length} issues
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.topIssues.filter(i => i.importance < 5).length / 
                            (dashboardData.overview.totalIssues || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-5 border border-border">
                <h3 className="text-lg font-semibold text-primaryText mb-4">Issues by Category</h3>
                <div className="space-y-4">
                  {['metadata', 'content', 'technical', 'links', 'media', 'international'].map(category => {
                    const count = dashboardData.topIssues.filter(i => i.category.startsWith(category)).length;
                    const percentage = Math.round((count / (dashboardData.overview.totalIssues || 1)) * 100);
                    
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-primaryText flex items-center">
                            {getCategoryIcon(category)}
                            <span className="ml-1 capitalize">{category}</span>
                          </span>
                          <span className="text-sm text-secondaryText">
                            {count} issues ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface border border-border rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primaryAccent"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <IssueList
                issues={dashboardData.topIssues}
                title="All Issues"
                maxItems={20}
                showCount={true}
              />
            </div>
          </>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Pages Audited"
                value={dashboardData.overview.totalPages}
                description="Total monitored pages"
                icon={<Globe className="h-5 w-5" />}
              />
              <MetricCard
                title="Average Page Score"
                value={`${dashboardData.overview.averageScore}/100`}
                description="Mean of all page scores"
                icon={<Award className="h-5 w-5" />}
                color={dashboardData.overview.averageScore >= 70 ? 'success' : 
                       dashboardData.overview.averageScore >= 40 ? 'warning' : 'error'}
              />
              <MetricCard
                title="Last Audit"
                value={dashboardData.overview.lastAuditDate}
                description="Most recent scan"
                icon={<Calendar className="h-5 w-5" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ScoreDistribution
                data={dashboardData.scoreDistribution}
                title="Page Score Distribution"
              />
              
              <div className="bg-secondary rounded-lg p-5 border border-border">
                <h3 className="text-lg font-semibold text-primaryText mb-4">Performance Summary</h3>
                <div className="space-y-4">
                  {/* Excellent pages */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-emerald-500 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Excellent Pages (80-100)
                      </span>
                      <span className="text-sm text-secondaryText">
                        {dashboardData.scoreDistribution[0].count} pages
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.scoreDistribution[0].count / 
                            dashboardData.overview.totalPages) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Good pages */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-primaryAccent flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Good Pages (60-79)
                      </span>
                      <span className="text-sm text-secondaryText">
                        {dashboardData.scoreDistribution[1].count} pages
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primaryAccent"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.scoreDistribution[1].count / 
                            dashboardData.overview.totalPages) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Fair pages */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-amber-500 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Fair Pages (40-59)
                      </span>
                      <span className="text-sm text-secondaryText">
                        {dashboardData.scoreDistribution[2].count} pages
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-amber-500"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.scoreDistribution[2].count / 
                            dashboardData.overview.totalPages) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Poor pages */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-rose-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Poor Pages (0-39)
                      </span>
                      <span className="text-sm text-secondaryText">
                        {dashboardData.scoreDistribution[3].count} pages
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-rose-500"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.scoreDistribution[3].count / 
                            dashboardData.overview.totalPages) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <PageList
                pages={dashboardData.pages || []}
                title="All Pages"
                maxItems={20}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditDashboard;