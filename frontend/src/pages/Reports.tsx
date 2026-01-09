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

  const navigate = useNavigate();

  useEffect(() => {
    fetchAttendance();
    fetchTradeShowTodos();
    fetchTradeShowEmails();
  }, []);

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
