import { ReactNode, useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Apps', href: '/dashboard', icon: '📱', color: 'from-purple-500 to-purple-700' },
    { name: 'Dashboard', href: '/dashboard', icon: '🏠', color: 'from-blue-500 to-blue-700' },
    { name: 'Getting Started', href: '/getting-started', icon: '❓', color: 'from-green-500 to-green-700' },
    { name: 'Capture Lead', href: '/capture-lead', icon: '📷', color: 'from-pink-500 to-pink-700' },
    { name: 'Dealers', href: '/dealers', icon: '👥', color: 'from-indigo-500 to-indigo-700' },
    { name: 'Trade Shows', href: '/trade-shows', icon: '📅', color: 'from-orange-500 to-orange-700' },
    { name: 'Reports', href: '/reports', icon: '📊', color: 'from-teal-500 to-teal-700' },
    { name: 'To-Dos', href: '/todos', icon: '✅', color: 'from-lime-500 to-lime-700' },
    { name: 'Buying Group Maintenance', href: '/buying-group-maintenance', icon: '🏢', color: 'from-cyan-500 to-cyan-700' },
    { name: 'Account Settings', href: '/account-settings', icon: '⚙️', color: 'from-gray-500 to-gray-700' },
    { name: 'Privacy Policy', href: '/privacy-policy', icon: '🔒', color: 'from-yellow-500 to-yellow-700' },
    { name: 'Terms of Service', href: '/terms-of-service', icon: '📜', color: 'from-red-500 to-red-700' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile header with hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-blue-900 text-white z-30 px-4 py-4 flex items-center justify-between shadow-lg">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-blue-800 rounded-lg"
          aria-label="Toggle menu"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <h1 className="text-xl font-bold truncate">Capture Show Leads</h1>
        <div className="w-14"></div> {/* Spacer for centering */}
      </div>

      {/* Sidebar - hidden on mobile unless menu is open, always visible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-blue-900 to-blue-950 text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:w-80`}
      >
        <div className="flex flex-col h-full">
          {/* Desktop header / Mobile close button area */}
          <div className="p-4 lg:p-6 flex items-center justify-between border-b-2 border-blue-700">
            <h1 className="text-2xl lg:text-3xl font-bold">Capture Show Leads</h1>
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-2 hover:bg-blue-800 rounded-lg"
              aria-label="Close menu"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 lg:px-4 space-y-2 lg:space-y-3 overflow-y-auto py-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-4 py-4 rounded-xl text-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-xl border-2 border-white`
                      : `bg-gradient-to-r ${item.color} text-white opacity-75 hover:opacity-100`
                  }`}
                >
                  <span className="mr-3 text-3xl flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t-2 border-blue-700">
            <div className="mb-4 bg-blue-800 bg-opacity-50 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-100 truncate">{user?.email}</p>
              {subscription && (
                <p className="text-sm text-green-300 mt-1 font-semibold">
                  {subscription.status === 'active' ? '✓ Active Subscription' : 'Subscription Inactive'}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className="w-full flex items-center justify-center px-4 py-3 text-lg font-semibold bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <span className="mr-2 text-2xl">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content - add top padding on mobile for fixed header, left padding on desktop for sidebar */}
      <div className="pt-16 lg:pt-0 lg:pl-80 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
};

export default Layout;

