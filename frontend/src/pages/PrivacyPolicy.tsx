import Layout from '../components/Layout';

const PrivacyPolicy = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="text-sm text-gray-600 mb-8 space-y-1">
            <p><strong>Effective Date:</strong> January 9, 2026</p>
            <p><strong>Last Updated:</strong> January 9, 2026</p>
            <p><strong>Company:</strong> Capture Show Leads, LLC ("CSL", "we", "us", or "our")</p>
            <p><strong>Service:</strong> Capture Show Leads Platform (the "Service")</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700">
                Capture Show Leads, LLC ("CSL") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your information when you use our Service.
              </p>
              <p className="text-gray-700 font-semibold mt-4">
                By using the Service, you consent to the data practices described in this Privacy Policy.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide Directly</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                  <p className="text-gray-700">Email address, First and last name, Company name, Password (encrypted), Payment information (processed by Stripe)</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Content You Create</h4>
                  <p className="text-gray-700">Dealer/lead information, Notes and descriptions, To-do lists and follow-up plans, Email content and attachments, Photos, Voice recordings, Trade show information</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Performance Metrics (for Community Benchmarking)</h4>
                <p className="text-gray-700 mb-2">We automatically collect and calculate:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li><strong>Lead quality scores</strong> (based on data completeness)</li>
                  <li><strong>Task completion rates</strong> (percentage of to-dos completed)</li>
                  <li><strong>Speed-to-follow-up metrics</strong> (time between lead capture and first action)</li>
                  <li><strong>Email engagement rates</strong> (emails sent per lead)</li>
                  <li><strong>Lead coverage rates</strong> (percentage of leads with active next steps)</li>
                </ul>
              </div>
            </section>

            {/* Section 3 - CRITICAL */}
            <section className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Community Benchmarking & Gamification</h3>
              <p className="font-bold text-gray-900 mb-2">This is a core feature of our Service.</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What We Do:</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Collect performance metrics from your account</strong></li>
                    <li><strong>Aggregate your metrics with ALL other users' metrics anonymously</strong></li>
                    <li><strong>Calculate percentile rankings</strong> (e.g., "You're in the top 25%")</li>
                    <li><strong>Display community averages</strong> to all users</li>
                    <li><strong>Show your personal metrics compared to community benchmarks</strong></li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                  <h4 className="font-semibold text-gray-900 mb-2">Anonymization Process:</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>ALL personally identifiable information is removed</strong> before aggregation</li>
                    <li><strong>NO company names, user names, or identities are revealed</strong> to other users</li>
                    <li>Only aggregate statistics are calculated (averages, percentiles)</li>
                    <li>Individual user data is NEVER shared with other users</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                  <h4 className="font-semibold text-gray-900 mb-2">What Other Users See:</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Community average metrics (e.g., "Average quality score: 6.1")</li>
                    <li>Their own percentile ranking (e.g., "You're in the 72nd percentile")</li>
                    <li>Total number of companies in the benchmark</li>
                  </ul>
                  <p className="font-semibold text-gray-900 mt-3">Other users CANNOT see:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Your company name</li>
                    <li>Your specific metrics</li>
                    <li>Your leads or data</li>
                    <li>Any identifying information</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing & Disclosure</h2>
              
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4.1 We Do NOT Sell Your Data</h3>
                <p className="text-gray-700 font-semibold">
                  We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Anonymous Aggregate Data</h3>
              <p className="text-gray-700 mb-2">We may share anonymous, aggregated statistics publicly or with partners:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>"CSL users average 6.1 lead quality score"</li>
                <li>"75% of users complete follow-ups within 48 hours"</li>
                <li>Industry benchmarks and trends</li>
              </ul>
              <p className="text-gray-700 font-semibold mt-2">These statistics CANNOT be used to identify individual users or companies.</p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">We implement industry-standard security measures:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Encryption in transit</strong> (HTTPS/TLS)</li>
                <li><strong>Encryption at rest</strong> (database and file storage)</li>
                <li><strong>Secure authentication</strong> (bcrypt password hashing)</li>
                <li><strong>Regular security audits</strong></li>
                <li><strong>Access controls</strong> (employees have minimal necessary access)</li>
              </ul>
            </section>

            {/* Section 7 - Rights */}
            <section className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 GDPR Rights (European Users)</h3>
              <p className="text-gray-700 mb-2">If you are in the EU/EEA, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Access</strong> - Request a copy of your personal data</li>
                <li><strong>Rectification</strong> - Correct inaccurate data</li>
                <li><strong>Erasure</strong> - Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Portability</strong> - Export your data in a machine-readable format</li>
                <li><strong>Object</strong> - Object to processing based on legitimate interests</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">7.2 CCPA Rights (California Users)</h3>
              <p className="text-gray-700 mb-2">If you are in California, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Know</strong> - Request disclosure of data collected, used, and shared</li>
                <li><strong>Delete</strong> - Request deletion of your personal data</li>
                <li><strong>Opt-Out</strong> - Opt out of data sales (we don't sell data)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">7.3 How to Exercise Your Rights</h3>
              <p className="text-gray-700">Contact us at:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
                <li>Email: <a href="mailto:privacy@captureshowleads.com" className="text-blue-600 hover:underline">privacy@captureshowleads.com</a></li>
                <li>We will respond within <strong>30 days</strong></li>
              </ul>
            </section>

            {/* Section 8 - Social Media */}
            <section className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Social Media Sharing & Top Performer Badges</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Voluntary Sharing</h3>
              <p className="text-gray-700 mb-4">
                Badge sharing is <strong>entirely optional</strong>. You control when, where, and if you share. We <strong>never post to social media without your explicit action</strong>.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 What Gets Shared</h3>
              <p className="text-gray-700 mb-2">When you click "Share Badge," we provide:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Badge image (includes CSL branding)</li>
                <li>Pre-populated text (editable by you)</li>
                <li>Link to www.CaptureShowLeads.com</li>
                <li><strong>NO personal data, company name, or specific metrics</strong> (unless you add them manually)</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 font-semibold">
                The Service is <strong>NOT intended for users under 18 years old</strong>. We do not knowingly collect data from children.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">13.1 Privacy Questions</h3>
              <p className="text-gray-700 mb-2">For privacy-related questions or requests:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Email:</strong> <a href="mailto:privacy@captureshowleads.com" className="text-blue-600 hover:underline">privacy@captureshowleads.com</a></li>
                <li><strong>Response Time:</strong> Within 30 days</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">13.2 Data Requests</h3>
              <p className="text-gray-700 mb-2">To exercise your privacy rights (access, deletion, correction):</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Email <a href="mailto:privacy@captureshowleads.com" className="text-blue-600 hover:underline">privacy@captureshowleads.com</a> with your account email and specific request</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">13.4 General Support</h3>
              <p className="text-gray-700">
                Email: <a href="mailto:support@captureshowleads.com" className="text-blue-600 hover:underline">support@captureshowleads.com</a><br />
                Website: <a href="https://www.captureshowleads.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.CaptureShowLeads.com</a>
              </p>
            </section>

            {/* Summary */}
            <section className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Summary of Key Points</h2>
              
              <h3 className="font-semibold text-gray-900 mb-2">Community Benchmarking:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>We aggregate your performance metrics with all other users</strong></li>
                <li><strong>Your data is anonymized</strong> (no company names or identities revealed)</li>
                <li><strong>Other users see only community averages and their own percentile</strong></li>
                <li><strong>You CANNOT opt out of benchmarking while using the Service</strong></li>
              </ul>

              <h3 className="font-semibold text-gray-900 mb-2">Social Media Sharing:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Entirely voluntary</strong> - you control when/if you share badges</li>
                <li><strong>We never post without your action</strong></li>
                <li><strong>Shared badges include CSL branding and link</strong></li>
              </ul>

              <h3 className="font-semibold text-gray-900 mb-2">We Do NOT:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Sell your personal data</li>
                <li>Share your data with advertisers</li>
                <li>Reveal your identity to other users in benchmarks</li>
                <li>Post to social media without your action</li>
              </ul>
            </section>

            {/* Consent */}
            <section className="bg-red-50 p-6 rounded-lg border-2 border-red-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Consent</h2>
              <p className="text-gray-700 font-bold mb-4">
                BY USING THE CAPTURE SHOW LEADS SERVICE, YOU CONSENT TO:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>The collection and use of your data as described in this Privacy Policy</li>
                <li>Anonymous aggregation of your performance metrics for community benchmarking</li>
                <li>Transfer of your data to the United States (if you are outside the US)</li>
                <li>Our use of cookies and tracking technologies</li>
                <li>(If you share badges) Public posting of your achievement badges on social media</li>
              </ol>
              <p className="text-gray-700 font-bold mt-4">
                If you do not consent, you must not use the Service.
              </p>
            </section>

            {/* Document Info */}
            <section className="text-sm text-gray-500 border-t pt-6">
              <p><strong>Document Version:</strong> 1.0</p>
              <p><strong>Effective Date:</strong> January 9, 2026</p>
              <p><strong>Last Reviewed:</strong> January 9, 2026</p>
              <p><strong>GDPR Compliant:</strong> Yes</p>
              <p><strong>CCPA Compliant:</strong> Yes</p>
              <p className="mt-4">© {currentYear} Capture Show Leads, LLC. All rights reserved.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
