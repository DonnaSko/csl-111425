import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Dealers from './pages/Dealers';
import DealerDetail from './pages/DealerDetail';
import CaptureLead from './pages/CaptureLead';
import TradeShows from './pages/TradeShows';
import TradeShowDetail from './pages/TradeShowDetail';
import Reports from './pages/Reports';
import Social from './pages/Social';
import Todos from './pages/Todos';
import GettingStarted from './pages/GettingStarted';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import CancelSubscription from './pages/CancelSubscription';
import BuyingGroupMaintenance from './pages/BuyingGroupMaintenance';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AccountSettings from './pages/AccountSettings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/subscription"
              element={<Subscription />}
            />
            <Route
              path="/subscription/success"
              element={
                <PrivateRoute>
                  <SubscriptionSuccess />
                </PrivateRoute>
              }
            />
            <Route
              path="/subscription/cancel"
              element={
                <PrivateRoute requireSubscription>
                  <CancelSubscription />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute requireSubscription>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dealers"
              element={
                <PrivateRoute requireSubscription>
                  <Dealers />
                </PrivateRoute>
              }
            />
            <Route
              path="/dealers/:id"
              element={
                <PrivateRoute requireSubscription>
                  <DealerDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/capture-lead"
              element={
                <PrivateRoute requireSubscription>
                  <CaptureLead />
                </PrivateRoute>
              }
            />
            <Route
              path="/trade-shows"
              element={
                <PrivateRoute requireSubscription>
                  <TradeShows />
                </PrivateRoute>
              }
            />
            <Route
              path="/trade-shows/:id"
              element={
                <PrivateRoute requireSubscription>
                  <TradeShowDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute requireSubscription>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/social"
              element={
                <PrivateRoute requireSubscription>
                  <Social />
                </PrivateRoute>
              }
            />
            <Route
              path="/todos"
              element={
                <PrivateRoute requireSubscription>
                  <Todos />
                </PrivateRoute>
              }
            />
            <Route
              path="/getting-started"
              element={
                <PrivateRoute requireSubscription>
                  <GettingStarted />
                </PrivateRoute>
              }
            />
            <Route
              path="/buying-group-maintenance"
              element={
                <PrivateRoute requireSubscription>
                  <BuyingGroupMaintenance />
                </PrivateRoute>
              }
            />
            <Route
              path="/account-settings"
              element={
                <PrivateRoute requireSubscription>
                  <AccountSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <PrivateRoute requireSubscription>
                  <PrivacyPolicy />
                </PrivateRoute>
              }
            />
            <Route
              path="/terms-of-service"
              element={
                <PrivateRoute requireSubscription>
                  <TermsOfService />
                </PrivateRoute>
              }
            />
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

