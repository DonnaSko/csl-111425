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
import Todos from './pages/Todos';
import GettingStarted from './pages/GettingStarted';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import BuyingGroupMaintenance from './pages/BuyingGroupMaintenance';

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
              element={
                <PrivateRoute>
                  <Subscription />
                </PrivateRoute>
              }
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
              path="/"
              element={
                <PrivateRoute>
                  <Navigate to="/dashboard" replace />
                </PrivateRoute>
              }
            />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

