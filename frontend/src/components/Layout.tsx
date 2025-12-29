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
    { name: 'Apps', href: '/dashboard', icon: '📱' },
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Getting Started', href: '/getting-started', icon: '❓' },
    { name: 'Capture Lead', href: '/capture-lead', icon: '📷' },
    { name: 'Dealers', href: '/dealers', icon: '👥' },
    { name: 'Trade Shows', href: '/trade-shows', icon: '📅' },
    { name: 'Reports', href: '/reports', icon: '📊' },
    { name: 'To-Dos', href: '/todos', icon: '✅' },
    { name: 'Buying Group Maintenance', href: '/buying-group-maintenance', icon: '🏢' },
    { name: 'Account Settings', href: '/account-settings', icon: '⚙️' },
    { name: 'Privacy Policy', href: '/privacy-policy', icon: '🔒' },
    { name: 'Terms of Service', href: '/terms-of-service', icon: '📜' },
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
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-blue-900 text-white z-30 px-4 py-3 flex items-center justify-between shadow-lg">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-blue-800 rounded-lg"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <h1 className="text-lg font-bold truncate">Capture Show Leads</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Sidebar - hidden on mobile unless menu is open, always visible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-blue-900 text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Desktop header / Mobile close button area */}
          <div className="p-4 lg:p-6 flex items-center justify-between">
            <h1 className="text-xl lg:text-2xl font-bold">Capture Show Leads</h1>
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-2 hover:bg-blue-800 rounded-lg"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 lg:px-4 space-y-1 lg:space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 lg:px-4 py-2.5 lg:py-2 rounded-lg text-sm lg:text-base ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-3 lg:p-4 border-t border-blue-800">
            <div className="mb-3 lg:mb-4">
              <p className="text-xs lg:text-sm text-blue-200 truncate">{user?.email}</p>
              {subscription && (
                <p className="text-xs text-blue-300 mt-1">
                  {subscription.status === 'active' ? '✓ Active' : 'Subscription Inactive'}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className="w-full text-left px-3 lg:px-4 py-2 text-sm lg:text-base text-blue-100 hover:bg-blue-800 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content - add top padding on mobile for fixed header, left padding on desktop for sidebar */}
      <div className="pt-14 lg:pt-0 lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
};

export default Layout;

