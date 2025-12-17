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
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Click "Upload Files" to import multiple dealers at once</li>
              <li>Or click "Add New Dealer" to add dealers one at a time</li>
              <li>The system will automatically detect and help you manage duplicates</li>
              <li>Download our sample CSV template below to see the format</li>
            </ul>
            <div className="flex gap-4 mb-4">
              <a
                href="/sample-dealers.csv"
                download="sample-dealers.csv"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📥 Download Sample CSV Template
              </a>
              <Link
                to="/dealers"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Dealers & Upload CSV
              </Link>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">CSV Format Requirements:</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Required field:</strong> Company Name
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Optional fields:</strong> Contact Name, Email, Phone, City, State, Zip, Country, Address, Buying Group, Groups (comma-separated), Status
              </p>
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Column names are case-insensitive and can have spaces. The system will automatically map common variations (e.g., "Company Name", "CompanyName", "company name" all work).
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Importing from CRM Systems:</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>HubSpot:</strong> Export contacts/companies to CSV. Map your fields to our format. The system will recognize common field names.
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Salesforce:</strong> Export leads/accounts to CSV. Ensure "Company Name" or equivalent is included.
              </p>
              <p className="text-sm text-gray-700">
                <strong>Other CRMs:</strong> Export to CSV format. Our system is flexible and will map common field names automatically.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 3: Capture Leads at Trade Shows</h2>
            <p className="text-gray-600 mb-4">
              Use the Capture Lead feature to quickly add new dealers during trade shows.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><Link to="/capture-lead" className="text-blue-600 hover:underline">Scan badges using your device camera</Link></li>
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

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📋 Refund & Cancellation Policy</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Refund Policy (B2B)</h3>
                <p className="text-gray-600">
                  All fees are non-refundable, including for partially used subscription periods. You may cancel at any time; cancellation stops future renewals and you will retain access through the end of the current paid term.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Billing Errors</h3>
                <p className="text-gray-600">
                  If you believe you were charged in error (duplicate charge, wrong plan, wrong amount), contact us within 7 days of the charge. Verified billing errors will be corrected or refunded.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Service Unavailability</h3>
                <p className="text-gray-600">
                  If the service is unavailable due to our fault for a material period of time, we may issue a service credit or prorated refund at our discretion.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              For questions about billing or cancellations, contact us at{' '}
              <a href="mailto:support@captureshowleads.com" className="text-blue-600 hover:underline">
                support@captureshowleads.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GettingStarted;

