import Layout from '../components/Layout';

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <p className="text-gray-600 text-sm">Last Updated: December 16, 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Capture Show Leads ("we," "our," or "us"). We are committed to protecting your privacy 
              and the privacy of the data you collect using our services. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you use our lead capture and management 
              application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-2">2.1 Account Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Your name (first and last name)</li>
              <li>Email address</li>
              <li>Company name</li>
              <li>Password (stored in encrypted form)</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-2 mt-4">2.2 Lead Data You Collect</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you use our service to capture leads, you may store:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Contact information (names, emails, phone numbers, addresses)</li>
              <li>Company information</li>
              <li>Notes and voice recordings</li>
              <li>Photos and business card images</li>
              <li>Product interests and preferences</li>
              <li>Trade show attendance information</li>
              <li>Follow-up tasks and to-do items</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-2 mt-4">2.3 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed">
              We automatically collect certain information when you use our service, including device information, 
              browser type, IP address, and usage patterns to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your subscription payments</li>
              <li>Send you important notifications about your account</li>
              <li>Send daily reminder emails about your to-do items and follow-ups</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Ensure the security and integrity of our platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>All data is encrypted in transit using SSL/TLS</li>
              <li>Passwords are hashed using secure algorithms</li>
              <li>Our servers are hosted on secure cloud infrastructure (DigitalOcean)</li>
              <li>Payment processing is handled by Stripe, a PCI-DSS compliant provider</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information or the lead data you collect. We may share information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Third parties who assist us in operating our service (e.g., Stripe for payments, email service providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Access and download your data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your lead data at any time</li>
            </ul>
          </section>

          <section className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Responsibility: Obtaining Consent from Booth Visitors</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Important:</strong> As a paid user of Capture Show Leads, you are responsible for obtaining appropriate consent from individuals before collecting their information at trade shows and events.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Before capturing any data, you must obtain verbal or written permission from booth visitors to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Photograph their badge</strong> – Always ask before taking a photo of someone's event badge or business card</li>
              <li><strong>Record voice notes</strong> – Inform visitors if you are recording audio notes about your conversation</li>
              <li><strong>Capture their contact information</strong> – Ensure visitors understand their information will be stored for follow-up purposes</li>
              <li><strong>Take photos</strong> – Get consent before photographing individuals or their materials</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              When obtaining consent, we recommend informing booth visitors that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Their information will be captured for follow-up after the show</li>
              <li>They may decline to have their information recorded</li>
              <li>They can request removal of their data at any time</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              <strong>Capture Show Leads is not responsible for any failure by paid users to obtain proper consent.</strong> You are solely responsible for complying with all applicable privacy laws, event/venue policies, and recording consent requirements in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your account information and lead data for as long as your account is active or as needed 
              to provide you services. If you cancel your subscription, your data will be retained for 30 days 
              before permanent deletion, allowing you to export your information. You may request immediate 
              deletion by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies to maintain your session and preferences. We do not use third-party 
              advertising cookies. You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for users under 18 years of age. We do not knowingly collect 
              information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by email and by posting the updated policy on this page with a new "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700"><strong>Capture Show Leads</strong></p>
              <p className="text-gray-700">Email: <a href="mailto:support@captureshowleads.com" className="text-blue-600 hover:underline">support@captureshowleads.com</a></p>
            </div>
          </section>

          <section className="border-t pt-6 mt-8">
            <p className="text-gray-500 text-sm text-center">
              By using Capture Show Leads, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;

