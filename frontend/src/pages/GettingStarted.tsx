import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const GettingStarted = () => {
  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Getting Started</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 1: Subscribe</h2>
            <p className="text-gray-600 mb-4">
              Choose a subscription plan to access all features of Capture Show Leads.
            </p>
            <Link
              to="/subscription"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Plans
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 2: Import Your Dealers</h2>
            <p className="text-gray-600 mb-4">
              Upload a CSV file with your existing dealer information, or add dealers manually.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Go to the Dealers page</li>
              <li>Click "Bulk Upload CSV" to import multiple dealers at once</li>
              <li>Or click "Add New Dealer" to add dealers one at a time</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 3: Capture Leads at Trade Shows</h2>
            <p className="text-gray-600 mb-4">
              Use the Capture Lead feature to quickly add new dealers during trade shows.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Scan badges using your device camera</li>
              <li>Or manually enter dealer information</li>
              <li>Add notes, photos, and voice recordings</li>
              <li>Rate lead quality for follow-up prioritization</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 4: Manage and Follow Up</h2>
            <p className="text-gray-600 mb-4">
              Use the dashboard and dealer management tools to organize and follow up with leads.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>View all dealers in one place</li>
              <li>Search and filter by status, buying group, or rating</li>
              <li>Add notes and track interactions</li>
              <li>Export data to CSV for external use</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GettingStarted;

