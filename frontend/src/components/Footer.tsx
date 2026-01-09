import { Link } from 'react-router-dom';

const Footer = () => {
  // Auto-update year - will change on January 1st every year
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white font-bold text-xl mb-3">
              Capture Show Leads<sup className="text-xs">®</sup>
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              The ultimate trade show lead management platform. Capture, track, and monetize your trade show leads with ease.
            </p>
            <p className="text-xs text-gray-500">
              © {currentYear} Capture Show Leads, LLC. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Capture Show Leads<sup>®</sup> and CSL<sup>™</sup> are registered trademarks of Capture Show Leads, LLC.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/TERMS_OF_SERVICE.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="/PRIVACY_POLICY.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <Link 
                  to="/subscription"
                  className="text-sm hover:text-white transition"
                >
                  Manage Subscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:support@captureshowleads.com" 
                  className="text-sm hover:text-white transition"
                >
                  📧 support@captureshowleads.com
                </a>
              </li>
              <li>
                <a 
                  href="mailto:privacy@captureshowleads.com" 
                  className="text-sm hover:text-white transition"
                >
                  🔒 privacy@captureshowleads.com
                </a>
              </li>
              <li>
                <a 
                  href="http://www.captureshowleads.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition"
                >
                  🌐 www.CaptureShowLeads.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500">
            Made with ❤️ for trade show professionals worldwide
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Version 1.0 • Last Updated: {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
