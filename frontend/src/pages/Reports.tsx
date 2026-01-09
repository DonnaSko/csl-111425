import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface AttendanceDealer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  associationDate: string;
}

interface AttendanceTradeShow {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  dealers: AttendanceDealer[];
}

interface ReportTodo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  followUp: boolean;
  followUpDate: string | null;
  type: string;
}

interface TodosDealer {
  id: string;
  companyName: string;
  contactName: string | null;
  todos: ReportTodo[];
}

interface TodosTradeShow {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  dealers: TodosDealer[];
}

interface EmailHistoryItem {
  id: string;
  subject: string;
  sentDate: string;
}

interface EmailsDealer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  emails: EmailHistoryItem[];
}

interface EmailsTradeShow {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  dealers: EmailsDealer[];
}

interface CommunityBenchmarks {
  totalCompanies: number;
  yourMetrics: {
    avgQuality: number;
    taskCompletionRate: number;
    emailsPerLead: number;
    leadCoverageRate: number;
    speedToFollowUp: number;
  };
  communityAverages: {
    avgQuality: number;
    taskCompletionRate: number;
    emailsPerLead: number;
    leadCoverageRate: number;
    speedToFollowUp: number;
  };
  yourPercentiles: {
    quality: number;
    taskCompletion: number;
    emails: number;
    coverage: number;
    speed: number;
  };
}

const Reports = () => {
  const [exporting, setExporting] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [todosLoading, setTodosLoading] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [attendanceShows, setAttendanceShows] = useState<AttendanceTradeShow[]>([]);
  const [todosShows, setTodosShows] = useState<TodosTradeShow[]>([]);
  const [emailsShows, setEmailsShows] = useState<EmailsTradeShow[]>([]);
  const [updatingTodoId, setUpdatingTodoId] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [allDealers, setAllDealers] = useState<any[]>([]);
  const [dealersLoading, setDealersLoading] = useState(false);
  const [communityBenchmarks, setCommunityBenchmarks] = useState<CommunityBenchmarks | null>(null);
  const [benchmarksLoading, setBenchmarksLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAttendance();
    fetchTradeShowTodos();
    fetchTradeShowEmails();
    fetchAllDealers();
    fetchCommunityBenchmarks();
  }, []);

  const fetchAllDealers = async () => {
    try {
      setDealersLoading(true);
      const response = await api.get('/dealers?limit=5000'); // Get all dealers
      setAllDealers(response.data?.dealers || []);
    } catch (error) {
      console.error('Failed to load dealers:', error);
      setAllDealers([]); // Set empty array on error so page doesn't break
    } finally {
      setDealersLoading(false);
    }
  };

  const fetchCommunityBenchmarks = async () => {
    try {
      setBenchmarksLoading(true);
      const response = await api.get('/reports/community-benchmarks');
      setCommunityBenchmarks(response.data);
    } catch (error) {
      console.error('Failed to load community benchmarks:', error);
    } finally {
      setBenchmarksLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/reports/export/dealers', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dealers-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export dealers');
    } finally {
      setExporting(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const response = await api.get('/reports/trade-shows/attendance');
      setAttendanceShows(response.data.tradeShows || []);
    } catch (error) {
      console.error('Failed to load trade show attendance report:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchTradeShowTodos = async () => {
    try {
      setTodosLoading(true);
      const response = await api.get('/reports/trade-shows/todos');
      setTodosShows(response.data.tradeShows || []);
    } catch (error) {
      console.error('Failed to load trade show todos report:', error);
    } finally {
      setTodosLoading(false);
    }
  };

  const fetchTradeShowEmails = async () => {
    try {
      setEmailsLoading(true);
      const response = await api.get('/reports/trade-shows/emails');
      setEmailsShows(response.data.tradeShows || []);
    } catch (error) {
      console.error('Failed to load trade show emails report:', error);
    } finally {
      setEmailsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCompleteTodo = async (todoId: string) => {
    try {
      setUpdatingTodoId(todoId);
      await api.put(`/todos/${todoId}`, { completed: true });

      const completedAt = new Date().toISOString();
      setTodosShows(prev =>
        prev.map(show => ({
          ...show,
          dealers: show.dealers.map(dealer => ({
            ...dealer,
            todos: dealer.todos.map(todo =>
              todo.id === todoId ? { ...todo, completed: true, completedAt } : todo
            ),
          })),
        }))
      );
    } catch (error) {
      console.error('Failed to complete todo from report:', error);
      alert('Failed to complete this task. Please try again.');
    } finally {
      setUpdatingTodoId(null);
    }
  };

  // Calculate stats for gamification
  const totalDealers = attendanceShows.reduce((sum, show) => sum + show.dealers.length, 0);
  const totalTodos = todosShows.reduce((sum, show) => 
    sum + show.dealers.reduce((dSum, dealer) => dSum + dealer.todos.length, 0), 0
  );
  const completedTodos = todosShows.reduce((sum, show) => 
    sum + show.dealers.reduce((dSum, dealer) => 
      dSum + dealer.todos.filter(t => t.completed).length, 0
    ), 0
  );
  const pendingFollowUps = todosShows.reduce((sum, show) => 
    sum + show.dealers.reduce((dSum, dealer) => 
      dSum + dealer.todos.filter(t => !t.completed && t.followUp).length, 0
    ), 0
  );
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
  const totalEmailsSent = emailsShows.reduce((sum, show) => 
    sum + show.dealers.reduce((dSum, dealer) => dSum + dealer.emails.length, 0), 0
  );

  // Calculate Lead Quality Metrics
  const calculateQualityScore = (dealer: any) => {
    let score = 0;
    if (dealer.companyName) score += 1;
    if (dealer.contactName) score += 2;
    if (dealer.email) score += 2;
    if (dealer.phone) score += 2;
    if (dealer.notes) score += 2;
    // Use _count if available (from dealers list endpoint)
    const notesCount = dealer._count?.dealerNotes || 0;
    const todosCount = dealer._count?.todos || 0;
    if (notesCount > 0) score += 2;
    if (todosCount > 0) score += 3;
    // Can't check followUp from _count, so just add bonus if has todos
    if (todosCount > 1) score += 3; // Bonus for multiple todos
    return score; // Max 15
  };

  const dealersWithScores = allDealers.map(d => ({
    ...d,
    qualityScore: calculateQualityScore(d)
  }));

  const avgQualityScore = dealersWithScores.length > 0
    ? Math.round((dealersWithScores.reduce((sum, d) => sum + d.qualityScore, 0) / dealersWithScores.length) * 10) / 10
    : 0;
  
  const lowQualityLeads = dealersWithScores.filter(d => d.qualityScore < 6).length;
  const mediumQualityLeads = dealersWithScores.filter(d => d.qualityScore >= 6 && d.qualityScore < 11).length;
  const highQualityLeads = dealersWithScores.filter(d => d.qualityScore >= 11).length;

  // Speed-to-Follow-Up Metrics
  const now = new Date().getTime();
  const getHoursSinceCreated = (createdAt: string) => {
    return (now - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  };

  const dealersWithTiming = dealersWithScores.map(d => ({
    ...d,
    hoursSinceCreated: getHoursSinceCreated(d.createdAt),
    hasNextStep: (d._count?.todos || 0) > 0
  }));

  const within1Hour = dealersWithTiming.filter(d => d.hoursSinceCreated <= 1 && d.hasNextStep).length;
  const within24Hours = dealersWithTiming.filter(d => d.hoursSinceCreated <= 24 && d.hasNextStep).length;
  const untouched24Hours = dealersWithTiming.filter(d => d.hoursSinceCreated > 24 && !d.hasNextStep).length;
  const untouched48Hours = dealersWithTiming.filter(d => d.hoursSinceCreated > 48 && !d.hasNextStep).length;

  // Coverage Metrics
  const dealersWithNextStep = dealersWithScores.filter(d => (d._count?.todos || 0) > 0).length;
  const coverageRate = dealersWithScores.length > 0 
    ? Math.round((dealersWithNextStep / dealersWithScores.length) * 100) 
    : 0;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              🎪 TRADESHOW REPORTS
            </h1>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-4">
            💰 MONETIZE YOUR TRADESHOW LEADS
          </p>
          <p className="text-lg text-gray-600 mt-2">
            By Following Up & Staying Connected
          </p>
        </div>

        {/* Stats Dashboard - Gamification */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-3xl font-bold">{totalDealers}</div>
            <div className="text-sm opacity-90">Booth Visitors</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold">{completedTodos}/{totalTodos}</div>
            <div className="text-sm opacity-90">Tasks Complete</div>
            <div className="mt-2 bg-white bg-opacity-30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="text-xs mt-1 opacity-90">{completionRate}% Done! 🎉</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold">{pendingFollowUps}</div>
            <div className="text-sm opacity-90">Follow-Ups Needed</div>
            {pendingFollowUps === 0 && (
              <div className="text-xs mt-2 bg-white bg-opacity-30 rounded-full px-3 py-1">
                🏆 All Caught Up!
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="text-4xl mb-2">📧</div>
            <div className="text-3xl font-bold">{totalEmailsSent}</div>
            <div className="text-sm opacity-90">Emails Sent</div>
          </div>
        </div>

        {/* Lead Quality & Speed Metrics - NEW GAMIFICATION */}
        {!dealersLoading && dealersWithScores.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Lead Quality Score Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 border-2 border-yellow-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">⭐</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Lead Quality Score</h3>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                    Measures how <strong>sales-ready</strong> your leads are. Higher scores mean more complete contact info, 
                    notes, and follow-up plans. <strong className="text-orange-600">Low-quality leads need more data before they can convert to sales.</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    💡 Goal: Get all leads to <strong>11+</strong> (green zone) by adding contact details and next steps.
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Average Quality:</span>
                  <span className="text-3xl font-bold text-yellow-600">{avgQualityScore}/15</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(avgQualityScore / 15) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-100 rounded-lg p-3 text-center border-2 border-red-300">
                  <div className="text-2xl font-bold text-red-700">{lowQualityLeads}</div>
                  <div className="text-xs text-red-600 font-medium">🔴 Low (0-5)</div>
                  <div className="text-xs text-gray-600">Need info</div>
                </div>
                <div className="bg-yellow-100 rounded-lg p-3 text-center border-2 border-yellow-400">
                  <div className="text-2xl font-bold text-yellow-700">{mediumQualityLeads}</div>
                  <div className="text-xs text-yellow-600 font-medium">🟡 Med (6-10)</div>
                  <div className="text-xs text-gray-600">Okay</div>
                </div>
                <div className="bg-green-100 rounded-lg p-3 text-center border-2 border-green-400">
                  <div className="text-2xl font-bold text-green-700">{highQualityLeads}</div>
                  <div className="text-xs text-green-600 font-medium">🟢 High (11-15)</div>
                  <div className="text-xs text-gray-600">Sales ready!</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-600 bg-white rounded-lg p-3">
                <strong>Quality Score = </strong>
                Company(1) + Contact(2) + Email(2) + Phone(2) + Notes(2-4) + Next Steps(3-6)
              </div>
            </div>

            {/* Speed-to-Follow-Up Card */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-xl p-6 border-2 border-red-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">⚡</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Follow-Up Speed</h3>
                  <p className="text-sm text-gray-600">Faster = Higher conversion</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 border-2 border-green-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">⚡ Within 1 Hour</span>
                    <span className="text-2xl font-bold text-green-600">{within1Hour}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Speed demons! 🏃‍♂️</div>
                </div>

                <div className="bg-white rounded-xl p-4 border-2 border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">✅ Within 24 Hours</span>
                    <span className="text-2xl font-bold text-blue-600">{within24Hours}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Great response time!</div>
                </div>

                {untouched48Hours > 0 && (
                  <div className="bg-white rounded-xl p-4 border-2 border-red-400 animate-pulse">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">🔥 Untouched &gt; 48 Hours</span>
                      <span className="text-2xl font-bold text-red-600">{untouched48Hours}</span>
                    </div>
                    <div className="text-xs text-red-600 font-semibold mt-1">⚠️ URGENT: Follow up NOW!</div>
                  </div>
                )}

                {untouched24Hours > 0 && untouched48Hours === 0 && (
                  <div className="bg-white rounded-xl p-4 border-2 border-orange-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">⏰ Untouched &gt; 24 Hours</span>
                      <span className="text-2xl font-bold text-orange-600">{untouched24Hours}</span>
                    </div>
                    <div className="text-xs text-orange-600 font-medium mt-1">Need attention soon</div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-600 bg-white rounded-lg p-3">
                <strong>⏱️ Pro Tip:</strong> Leads contacted within 1 hour are 7x more likely to convert!
              </div>
            </div>

            {/* Coverage Rate Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-6 border-2 border-blue-300 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">🎯</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Lead Coverage</h3>
                  <p className="text-sm text-gray-600">How many leads have next steps assigned?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-6">
                  <div className="text-center mb-3">
                    <div className="text-5xl font-bold text-blue-600">{coverageRate}%</div>
                    <div className="text-sm text-gray-600 mt-1">Coverage Rate</div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${
                        coverageRate >= 90 ? 'bg-green-500' :
                        coverageRate >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${coverageRate}%` }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {dealersWithNextStep} / {dealersWithScores.length} leads have next steps
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">✅ With Next Step:</span>
                      <span className="font-bold text-green-600">{dealersWithNextStep}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm text-gray-700">⚠️ No Next Step:</span>
                      <span className="font-bold text-red-600">{dealersWithScores.length - dealersWithNextStep}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                      <span className="text-sm text-gray-700">📧 Emails Sent:</span>
                      <span className="font-bold text-purple-600">{totalEmailsSent}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="text-sm text-gray-700">🔥 Follow-Ups:</span>
                      <span className="font-bold text-orange-600">{pendingFollowUps}</span>
                    </div>
                  </div>
                </div>
              </div>

              {coverageRate === 100 && (
                <div className="mt-4 bg-green-500 text-white rounded-xl p-4 text-center font-bold animate-pulse">
                  🏆 PERFECT COVERAGE! Every lead has a next step! 🎉
                </div>
              )}

              {coverageRate < 70 && (
                <div className="mt-4 bg-red-500 text-white rounded-xl p-4 text-center font-semibold">
                  ⚠️ {dealersWithScores.length - dealersWithNextStep} leads need next steps assigned!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎮 COMMUNITY BENCHMARKS - Compare with all CSL users anonymously */}
        {!benchmarksLoading && communityBenchmarks && (
          <div className="mb-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl p-8 border-4 border-purple-300">
            <div className="text-center mb-6">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🏆 Community Leaderboard
                </h2>
              </div>
              <p className="text-gray-700 text-lg">
                See how you compare with <strong className="text-purple-700">{communityBenchmarks.totalCompanies} CSL users</strong> worldwide
              </p>
              <p className="text-sm text-gray-600 mt-1 italic">
                (Anonymous - No company names are shown)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Lead Quality Benchmark */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">⭐</div>
                  <h3 className="font-bold text-gray-800 text-lg">Lead Quality</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">You:</span>
                    <span className="text-2xl font-bold text-purple-600">{communityBenchmarks.yourMetrics.avgQuality.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Community Avg:</span>
                    <span className="text-lg font-semibold text-gray-500">{communityBenchmarks.communityAverages.avgQuality.toFixed(1)}</span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-purple-700">{communityBenchmarks.yourPercentiles.quality}%</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {communityBenchmarks.yourPercentiles.quality >= 75 ? '🔥 TOP PERFORMER!' :
                       communityBenchmarks.yourPercentiles.quality >= 50 ? '👍 Above Average' :
                       communityBenchmarks.yourPercentiles.quality >= 25 ? '⚡ Room to Grow' :
                       '💪 Keep Going!'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Completion Benchmark */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="font-bold text-gray-800 text-lg">Task Completion</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">You:</span>
                    <span className="text-2xl font-bold text-green-600">{communityBenchmarks.yourMetrics.taskCompletionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Community Avg:</span>
                    <span className="text-lg font-semibold text-gray-500">{communityBenchmarks.communityAverages.taskCompletionRate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-green-700">{communityBenchmarks.yourPercentiles.taskCompletion}%</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {communityBenchmarks.yourPercentiles.taskCompletion >= 75 ? '🔥 TOP PERFORMER!' :
                       communityBenchmarks.yourPercentiles.taskCompletion >= 50 ? '👍 Above Average' :
                       communityBenchmarks.yourPercentiles.taskCompletion >= 25 ? '⚡ Room to Grow' :
                       '💪 Keep Going!'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Speed to Follow-Up Benchmark */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">⚡</div>
                  <h3 className="font-bold text-gray-800 text-lg">Speed to Follow-Up</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">You:</span>
                    <span className="text-2xl font-bold text-orange-600">{communityBenchmarks.yourMetrics.speedToFollowUp.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Community Avg:</span>
                    <span className="text-lg font-semibold text-gray-500">{communityBenchmarks.communityAverages.speedToFollowUp.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-orange-700">{communityBenchmarks.yourPercentiles.speed}%</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {communityBenchmarks.yourPercentiles.speed >= 75 ? '🔥 TOP PERFORMER!' :
                       communityBenchmarks.yourPercentiles.speed >= 50 ? '👍 Above Average' :
                       communityBenchmarks.yourPercentiles.speed >= 25 ? '⚡ Room to Grow' :
                       '💪 Keep Going!'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emails Per Lead Benchmark */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">📧</div>
                  <h3 className="font-bold text-gray-800 text-lg">Emails Per Lead</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">You:</span>
                    <span className="text-2xl font-bold text-blue-600">{communityBenchmarks.yourMetrics.emailsPerLead.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Community Avg:</span>
                    <span className="text-lg font-semibold text-gray-500">{communityBenchmarks.communityAverages.emailsPerLead.toFixed(2)}</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-blue-700">{communityBenchmarks.yourPercentiles.emails}%</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {communityBenchmarks.yourPercentiles.emails >= 75 ? '🔥 TOP PERFORMER!' :
                       communityBenchmarks.yourPercentiles.emails >= 50 ? '👍 Above Average' :
                       communityBenchmarks.yourPercentiles.emails >= 25 ? '⚡ Room to Grow' :
                       '💪 Keep Going!'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Coverage Benchmark */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="font-bold text-gray-800 text-lg">Lead Coverage</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">You:</span>
                    <span className="text-2xl font-bold text-indigo-600">{communityBenchmarks.yourMetrics.leadCoverageRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Community Avg:</span>
                    <span className="text-lg font-semibold text-gray-500">{communityBenchmarks.communityAverages.leadCoverageRate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-indigo-700">{communityBenchmarks.yourPercentiles.coverage}%</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {communityBenchmarks.yourPercentiles.coverage >= 75 ? '🔥 TOP PERFORMER!' :
                       communityBenchmarks.yourPercentiles.coverage >= 50 ? '👍 Above Average' :
                       communityBenchmarks.yourPercentiles.coverage >= 25 ? '⚡ Room to Grow' :
                       '💪 Keep Going!'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Performance Summary */}
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg text-white">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🏅</div>
                  <h3 className="font-bold text-lg">Your Overall Rank</h3>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const avgPercentile = Math.round(
                      (communityBenchmarks.yourPercentiles.quality +
                       communityBenchmarks.yourPercentiles.taskCompletion +
                       communityBenchmarks.yourPercentiles.speed +
                       communityBenchmarks.yourPercentiles.emails +
                       communityBenchmarks.yourPercentiles.coverage) / 5
                    );
                    return (
                      <>
                        <div className="text-center">
                          <div className="text-6xl font-bold">{avgPercentile}%</div>
                          <div className="text-sm mt-2 opacity-90">Average Percentile</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                          <div className="font-bold text-xl">
                            {avgPercentile >= 90 ? '🌟 ELITE!' :
                             avgPercentile >= 75 ? '🔥 EXCELLENT!' :
                             avgPercentile >= 60 ? '💪 STRONG!' :
                             avgPercentile >= 50 ? '👍 GOOD!' :
                             avgPercentile >= 40 ? '⚡ IMPROVING!' :
                             '🚀 KEEP PUSHING!'}
                          </div>
                          <div className="text-xs mt-1 opacity-90">
                            You're in the <strong>top {100 - avgPercentile}%</strong> of CSL users
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Motivational Footer */}
            <div className="mt-6 text-center">
              {(() => {
                const avgPercentile = Math.round(
                  (communityBenchmarks.yourPercentiles.quality +
                   communityBenchmarks.yourPercentiles.taskCompletion +
                   communityBenchmarks.yourPercentiles.speed +
                   communityBenchmarks.yourPercentiles.emails +
                   communityBenchmarks.yourPercentiles.coverage) / 5
                );
                if (avgPercentile >= 75) {
                  return (
                    <p className="text-lg font-semibold text-purple-700">
                      🎉 Outstanding work! You're setting the standard for the community! 🎉
                    </p>
                  );
                } else if (avgPercentile >= 50) {
                  return (
                    <p className="text-lg font-semibold text-indigo-700">
                      💪 Great job! Keep it up to break into the top 25%! 💪
                    </p>
                  );
                } else {
                  return (
                    <p className="text-lg font-semibold text-gray-700">
                      🚀 Every lead you improve puts you higher on the leaderboard! 🚀
                    </p>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 font-semibold shadow-lg transform hover:scale-105 transition"
          >
            {exporting ? '⏳ Exporting...' : '📥 Export All Dealers to CSV'}
          </button>
        </div>

        {/* Report Cards */}
        <div className="space-y-6">
          {/* Attendance Report Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-blue-200 hover:border-blue-400 transition">
            <button
              onClick={() => setExpandedReport(expandedReport === 'attendance' ? null : 'attendance')}
              className="w-full p-6 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">👥</div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-900">
                    Tradeshow Attendees
                  </h3>
                  <p className="text-blue-700 mt-1">
                    Who visited your booth? ({totalDealers} visitors across {attendanceShows.length} shows)
                  </p>
                </div>
              </div>
              <div className="text-3xl text-blue-600">
                {expandedReport === 'attendance' ? '▼' : '▶'}
              </div>
            </button>
            
            {expandedReport === 'attendance' && (
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white">
                {attendanceLoading ? (
                  <p className="text-gray-500 text-center py-8">⏳ Loading...</p>
                ) : attendanceShows.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No trade shows with visitors yet.</p>
                ) : (
                  <div className="space-y-4">
                    {attendanceShows.map(show => (
                      <div key={show.id} className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">🎪 {show.name}</h4>
                            <p className="text-sm text-gray-600">
                              {show.startDate && `${formatDate(show.startDate)}${show.endDate ? ` - ${formatDate(show.endDate)}` : ''}`}
                            </p>
                            {show.location && <p className="text-sm text-gray-500">📍 {show.location}</p>}
                          </div>
                          <span className="px-4 py-2 bg-blue-500 text-white rounded-full font-bold text-sm">
                            {show.dealers.length} visitors
                          </span>
                        </div>
                        <div className="space-y-2">
                          {show.dealers.map(dealer => (
                            <button
                              key={dealer.id}
                              onClick={() => navigate(`/dealers/${dealer.id}`)}
                              className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex justify-between items-center"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{dealer.companyName}</p>
                                {dealer.contactName && <p className="text-sm text-gray-600">{dealer.contactName}</p>}
                              </div>
                              <span className="text-xs text-gray-500">
                                Visited: {formatDate(dealer.associationDate)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Follow-Ups Report Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-orange-200 hover:border-orange-400 transition">
            <button
              onClick={() => setExpandedReport(expandedReport === 'followups' ? null : 'followups')}
              className="w-full p-6 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">🔥</div>
                <div>
                  <h3 className="text-2xl font-bold text-orange-900">
                    Follow-Ups & To-Do's
                  </h3>
                  <p className="text-orange-700 mt-1">
                    Your action items ({pendingFollowUps} pending · {completionRate}% complete)
                  </p>
                  {completionRate === 100 && totalTodos > 0 && (
                    <p className="text-green-600 font-bold mt-1">🏆 Perfect Score! All tasks done!</p>
                  )}
                </div>
              </div>
              <div className="text-3xl text-orange-600">
                {expandedReport === 'followups' ? '▼' : '▶'}
              </div>
            </button>
            
            {expandedReport === 'followups' && (
              <div className="p-6 bg-gradient-to-br from-orange-50 to-white">
                {todosLoading ? (
                  <p className="text-gray-500 text-center py-8">⏳ Loading...</p>
                ) : todosShows.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks yet! 🎉</p>
                ) : (
                  <div className="space-y-4">
                    {todosShows.map(show => (
                      <div key={show.id} className="bg-white border-2 border-orange-200 rounded-xl p-4 shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">🎪 {show.name}</h4>
                            <p className="text-sm text-gray-600">
                              {show.startDate && `${formatDate(show.startDate)}${show.endDate ? ` - ${formatDate(show.endDate)}` : ''}`}
                            </p>
                          </div>
                        </div>
                        {show.dealers.map(dealer => (
                          <div key={dealer.id} className="mt-3 border-t border-orange-100 pt-3">
                            <button
                              onClick={() => navigate(`/dealers/${dealer.id}`)}
                              className="text-orange-600 hover:text-orange-800 font-semibold"
                            >
                              {dealer.companyName}
                              {dealer.contactName && ` – ${dealer.contactName}`}
                            </button>
                            <div className="mt-2 space-y-2">
                              {dealer.todos.map(todo => (
                                <div
                                  key={todo.id}
                                  className={`p-3 rounded-lg ${
                                    todo.completed 
                                      ? 'bg-green-50 border border-green-200' 
                                      : todo.followUp 
                                        ? 'bg-red-50 border-2 border-red-300 animate-pulse'
                                        : 'bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={todo.completed ? 'line-through text-gray-500' : 'text-gray-900 font-medium'}>
                                          {todo.title}
                                        </span>
                                        {todo.followUp && !todo.completed && (
                                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold animate-bounce">
                                            🔥 FOLLOW-UP
                                          </span>
                                        )}
                                        {todo.completed && (
                                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">
                                            ✅ DONE
                                          </span>
                                        )}
                                      </div>
                                      {todo.description && (
                                        <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                                      )}
                                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                        {todo.dueDate && <span>📅 Due: {formatDate(todo.dueDate)}</span>}
                                        {todo.followUp && todo.followUpDate && (
                                          <span className="text-red-600 font-semibold">
                                            🔥 Follow-up: {formatDate(todo.followUpDate)}
                                          </span>
                                        )}
                                        {todo.completed && todo.completedAt && (
                                          <span className="text-green-600">
                                            ✓ Done: {formatDateTime(todo.completedAt)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {!todo.completed && (
                                      <button
                                        onClick={() => handleCompleteTodo(todo.id)}
                                        disabled={updatingTodoId === todo.id}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold text-sm whitespace-nowrap transform hover:scale-105 transition"
                                      >
                                        {updatingTodoId === todo.id ? '⏳' : '✅ Complete'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Emails Report Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-purple-200 hover:border-purple-400 transition">
            <button
              onClick={() => setExpandedReport(expandedReport === 'emails' ? null : 'emails')}
              className="w-full p-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">📧</div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-900">
                    Emails Sent
                  </h3>
                  <p className="text-purple-700 mt-1">
                    Track your communication ({totalEmailsSent} emails sent)
                  </p>
                </div>
              </div>
              <div className="text-3xl text-purple-600">
                {expandedReport === 'emails' ? '▼' : '▶'}
              </div>
            </button>
            
            {expandedReport === 'emails' && (
              <div className="p-6 bg-gradient-to-br from-purple-50 to-white">
                {emailsLoading ? (
                  <p className="text-gray-500 text-center py-8">⏳ Loading...</p>
                ) : emailsShows.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No emails sent yet.</p>
                ) : (
                  <div className="space-y-4">
                    {emailsShows.map(show => (
                      <div key={show.id} className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">🎪 {show.name}</h4>
                            <p className="text-sm text-gray-600">
                              {show.startDate && `${formatDate(show.startDate)}${show.endDate ? ` - ${formatDate(show.endDate)}` : ''}`}
                            </p>
                          </div>
                          <span className="px-4 py-2 bg-purple-500 text-white rounded-full font-bold text-sm">
                            {show.dealers.reduce((sum, d) => sum + d.emails.length, 0)} emails
                          </span>
                        </div>
                        {show.dealers.map(dealer => (
                          <div key={dealer.id} className="mt-3 border-t border-purple-100 pt-3">
                            <button
                              onClick={() => navigate(`/dealers/${dealer.id}`)}
                              className="text-purple-600 hover:text-purple-800 font-semibold"
                            >
                              {dealer.companyName}
                              {dealer.contactName && ` – ${dealer.contactName}`}
                            </button>
                            {dealer.email && (
                              <p className="text-xs text-gray-500">{dealer.email}</p>
                            )}
                            <div className="mt-2 space-y-2">
                              {dealer.emails.map(email => (
                                <div key={email.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="text-sm text-gray-900 font-medium flex-1">
                                      📨 {email.subject}
                                    </p>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      {formatDateTime(email.sentDate)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Motivational Footer */}
        {pendingFollowUps > 0 && (
          <div className="mt-12 p-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl shadow-2xl text-center text-white">
            <p className="text-2xl font-bold mb-2">🔥 {pendingFollowUps} Follow-Ups Waiting!</p>
            <p className="text-lg">Every follow-up is a potential sale. Take action today! 💪</p>
          </div>
        )}

        {pendingFollowUps === 0 && totalTodos > 0 && (
          <div className="mt-12 p-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl shadow-2xl text-center text-white">
            <p className="text-3xl font-bold mb-2">🏆 ALL CAUGHT UP!</p>
            <p className="text-lg">You're crushing it! Keep the momentum going! 🎉</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
