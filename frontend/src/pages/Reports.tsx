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

const Reports = () => {
  const [exporting, setExporting] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [todosLoading, setTodosLoading] = useState(false);
  const [attendanceShows, setAttendanceShows] = useState<AttendanceTradeShow[]>([]);
  const [todosShows, setTodosShows] = useState<TodosTradeShow[]>([]);
  const [updatingTodoId, setUpdatingTodoId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAttendance();
    fetchTradeShowTodos();
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

      // Update local state: mark todo as completed and set completedAt
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

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export Dealers to CSV'}
          </button>
        </div>

        {/* Trade Shows Attended */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Trade Shows Attended</h2>
          <p className="text-sm text-gray-600 mb-4">
            List of trade shows you attended, with dealers who stopped by your booth or were associated
            with that show. Most recent shows appear first.
          </p>

          {attendanceLoading ? (
            <p className="text-gray-500">Loading trade show attendance...</p>
          ) : attendanceShows.length === 0 ? (
            <p className="text-gray-500">No trade shows with associated dealers yet.</p>
          ) : (
            <div className="space-y-4">
              {attendanceShows.map(show => (
                <div key={show.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{show.name}</h3>
                      <p className="text-sm text-gray-600">
                        {show.startDate && (
                          <>
                            {formatDate(show.startDate)}
                            {show.endDate && ` - ${formatDate(show.endDate)}`}
                          </>
                        )}
                      </p>
                      {show.location && (
                        <p className="text-sm text-gray-500 mt-1">📍 {show.location}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {show.dealers.length} dealer{show.dealers.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {show.dealers.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-2">
                      No dealers recorded for this trade show yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm text-gray-800">
                      {show.dealers.map(dealer => (
                        <li key={dealer.id} className="flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/dealers/${dealer.id}`)}
                            className="text-blue-600 hover:underline"
                          >
                            {dealer.companyName}
                            {dealer.contactName ? ` – ${dealer.contactName}` : ''}
                          </button>
                          <span className="text-xs text-gray-500">
                            Visited: {formatDate(dealer.associationDate)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* To-Dos & Follow Ups by Tradeshow */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            To-Do&apos;s &amp; Follow Ups by Tradeshow
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Tasks and follow-ups grouped by tradeshow and dealer. Click a dealer name to open their record.
            Click &quot;Complete&quot; to mark a task done (text will be crossed out and completion date saved).
          </p>

          {todosLoading ? (
            <p className="text-gray-500">Loading tasks and follow-ups...</p>
          ) : todosShows.length === 0 ? (
            <p className="text-gray-500">No tasks or follow-ups linked to tradeshows yet.</p>
          ) : (
            <div className="space-y-4">
              {todosShows.map(show => (
                <div key={show.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{show.name}</h3>
                      <p className="text-sm text-gray-600">
                        {show.startDate && (
                          <>
                            {formatDate(show.startDate)}
                            {show.endDate && ` - ${formatDate(show.endDate)}`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {show.dealers.map(dealer => (
                    <div key={dealer.id} className="mt-3 border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center mb-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/dealers/${dealer.id}`)}
                          className="text-blue-600 hover:underline font-medium text-sm"
                        >
                          {dealer.companyName}
                          {dealer.contactName ? ` – ${dealer.contactName}` : ''}
                        </button>
                        <span className="text-xs text-gray-500">
                          {dealer.todos.filter(t => !t.completed).length} open /{' '}
                          {dealer.todos.length} total
                        </span>
                      </div>

                      <ul className="space-y-1 text-sm text-gray-800">
                        {dealer.todos.map(todo => (
                          <li
                            key={todo.id}
                            className="flex justify-between items-start gap-2"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={
                                    todo.completed
                                      ? 'line-through text-gray-500'
                                      : 'text-gray-900'
                                  }
                                >
                                  {todo.title}
                                </span>
                                {todo.type && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                    {todo.type}
                                  </span>
                                )}
                              </div>
                              {todo.description && (
                                <p
                                  className={
                                    todo.completed
                                      ? 'text-xs text-gray-400 line-through mt-0.5'
                                      : 'text-xs text-gray-600 mt-0.5'
                                  }
                                >
                                  {todo.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                                {todo.dueDate && (
                                  <span>Due: {formatDate(todo.dueDate)}</span>
                                )}
                                {todo.followUp && todo.followUpDate && (
                                  <span>
                                    Follow-up: {formatDate(todo.followUpDate)}
                                  </span>
                                )}
                                {todo.completed && todo.completedAt && (
                                  <span className="text-green-600 font-medium">
                                    ✓ Completed: {formatDateTime(todo.completedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!todo.completed && (
                              <button
                                type="button"
                                onClick={() => handleCompleteTodo(todo.id)}
                                disabled={updatingTodoId === todo.id}
                                className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingTodoId === todo.id ? 'Completing...' : 'Complete'}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;

