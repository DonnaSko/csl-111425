import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  type: string;
  dueDate: string | null;
  followUpDate: string | null;
  followUp: boolean;
  completed: boolean;
  completedAt: string | null;
  dealer: {
    id: string;
    companyName: string;
    contactName: string | null;
  } | null;
}

const Todos = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/todos');
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTodo = async (todoId: string) => {
    try {
      await api.put(`/todos/${todoId}`, { completed: true });
      await fetchTodos();
    } catch (error) {
      console.error('Failed to complete todo:', error);
      alert('Failed to complete todo. Please try again.');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this to-do?')) {
      return;
    }

    try {
      await api.delete(`/todos/${todoId}`);
      await fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      alert('Failed to delete todo. Please try again.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isPastDue = (todo: Todo) => {
    if (todo.completed) return false;
    const now = new Date();
    if (todo.dueDate && new Date(todo.dueDate) < now) return true;
    if (todo.followUpDate && new Date(todo.followUpDate) < now) return true;
    return false;
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'completed') return todo.completed;
    if (filter === 'pending') return !todo.completed && !isPastDue(todo);
    if (filter === 'overdue') return !todo.completed && isPastDue(todo);
    return true;
  });

  const pendingCount = todos.filter(t => !t.completed && !isPastDue(t)).length;
  const overdueCount = todos.filter(t => !t.completed && isPastDue(t)).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">To-Dos & Follow-Ups</h1>
          <p className="text-gray-600">Manage your tasks and follow-up reminders</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Pending</p>
                <p className="text-2xl font-bold text-blue-900">{pendingCount}</p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{completedCount}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setFilter('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({todos.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === 'overdue'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overdue ({overdueCount})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === 'completed'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>

          {/* Todos List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading to-dos...</p>
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {filter === 'all' && 'No to-dos yet. Visit a dealer page to create one!'}
                  {filter === 'pending' && 'No pending to-dos'}
                  {filter === 'overdue' && 'No overdue to-dos'}
                  {filter === 'completed' && 'No completed to-dos'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTodos.map((todo) => {
                  const isOverdue = isPastDue(todo);
                  return (
                    <div
                      key={todo.id}
                      className={`border rounded-lg p-4 ${
                        todo.completed
                          ? 'bg-gray-50 border-gray-200'
                          : isOverdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Title and Type */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className={`text-lg font-semibold ${
                                todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}
                            >
                              {todo.title}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {todo.type}
                            </span>
                            {isOverdue && !todo.completed && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                                OVERDUE
                              </span>
                            )}
                            {todo.completed && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                                ✓ COMPLETED
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {todo.description && (
                            <p
                              className={`text-sm mb-2 ${
                                todo.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                              }`}
                            >
                              {todo.description}
                            </p>
                          )}

                          {/* Dealer Info */}
                          {todo.dealer && (
                            <button
                              onClick={() => navigate(`/dealers/${todo.dealer!.id}`)}
                              className="text-sm text-blue-600 hover:underline mb-2 block"
                            >
                              🏢 {todo.dealer.companyName}
                              {todo.dealer.contactName && ` - ${todo.dealer.contactName}`}
                            </button>
                          )}

                          {/* Dates */}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                            {todo.dueDate && (
                              <span
                                className={
                                  isOverdue && !todo.completed ? 'text-red-600 font-medium' : ''
                                }
                              >
                                📅 Due: {formatDate(todo.dueDate)}
                              </span>
                            )}
                            {todo.followUp && todo.followUpDate && (
                              <span
                                className={
                                  isOverdue && !todo.completed ? 'text-red-600 font-medium' : ''
                                }
                              >
                                🔔 Follow-up: {formatDate(todo.followUpDate)}
                              </span>
                            )}
                            {todo.completed && todo.completedAt && (
                              <span className="text-green-600 font-medium">
                                ✓ Completed: {formatDateTime(todo.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                          {!todo.completed && (
                            <button
                              onClick={() => handleCompleteTodo(todo.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              ✓ Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Todos;
