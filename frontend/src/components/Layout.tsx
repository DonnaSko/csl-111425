import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const { subscription } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Getting Started', href: '/getting-started', icon: '❓' },
    { name: 'Capture Lead', href: '/capture-lead', icon: '📷' },
    { name: 'Dealers', href: '/dealers', icon: '👥' },
    { name: 'Trade Shows', href: '/trade-shows', icon: '📅' },
    { name: 'Reports', href: '/reports', icon: '📊' },
    { name: 'To-Dos', href: '/todos', icon: '✅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-blue-900 text-white">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Capture Show Leads</h1>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-blue-800">
            <div className="mb-4">
              <p className="text-sm text-blue-200">{user?.email}</p>
              {subscription && (
                <p className="text-xs text-blue-300 mt-1">
                  {subscription.status === 'active' ? '✓ Active' : 'Subscription Inactive'}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-blue-100 hover:bg-blue-800 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default Layout;

