import Layout from '../components/Layout';

const TermsOfService = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="text-sm text-gray-600 mb-8 space-y-1">
            <p><strong>Effective Date:</strong> January 9, 2026</p>
            <p><strong>Last Updated:</strong> January 9, 2026</p>
            <p><strong>Company:</strong> Capture Show Leads, LLC ("CSL", "we", "us", or "our")</p>
            <p><strong>Service:</strong> Capture Show Leads Platform (the "Service")</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing or using the Capture Show Leads platform, you ("User", "you", or "your") agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the Service.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Capture Show Leads (CSL) is a trade show lead management platform that enables users to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Capture and manage dealer/lead information</li>
                <li>Track follow-ups and communications</li>
                <li>Send emails with attachments</li>
                <li>Manage trade show attendance</li>
                <li>Upload and store photos, voice recordings, and documents</li>
                <li>Generate reports and analytics</li>
                <li><strong>Compare performance metrics anonymously with other CSL users (Community Benchmarking)</strong></li>
                <li><strong>Share performance achievements on social media (Top Performer Badges)</strong></li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration & Subscription</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to accept responsibility for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Subscription & Payment</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>The Service requires an active paid subscription</li>
                <li>Subscriptions are managed through Stripe</li>
                <li>Payment is required before accessing the platform</li>
                <li>We reserve the right to modify subscription pricing with 30 days notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3 flex items-center gap-2">
                <span>3.2.1</span> <span className="text-red-600">⛔ NO REFUNDS POLICY</span>
              </h3>
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 my-4">
                <p className="text-red-900 font-bold mb-4">SUBSCRIPTION FEES ARE NON-REFUNDABLE. PLEASE READ CAREFULLY:</p>
                
                <h4 className="font-semibold text-gray-900 mb-2">What You CAN Do:</h4>
                <ul className="list-none space-y-2 text-gray-800 mb-4">
                  <li>✅ <strong>Cancel Future Payments:</strong> You can cancel your subscription at any time from your Account Settings. Cancellation will prevent future charges.</li>
                  <li>✅ <strong>Stop Auto-Renewal:</strong> Your cancellation will stop automatic renewal at the end of your current billing period.</li>
                  <li>✅ <strong>Continue Using Service:</strong> After canceling, you can continue using the service until the end of your current paid period (the date you already paid through).</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-2">What You CANNOT Do:</h4>
                <ul className="list-none space-y-2 text-gray-800 mb-4">
                  <li>❌ <strong>No Refunds for Current Period:</strong> You CANNOT get a refund for your current billing period (the month or year you just paid for).</li>
                  <li>❌ <strong>No Refunds for Previous Payments:</strong> We do not refund any previous subscription payments under any circumstances.</li>
                  <li>❌ <strong>No Prorated Refunds:</strong> We do not offer prorated refunds if you cancel mid-period.</li>
                  <li>❌ <strong>No "Change of Mind" Refunds:</strong> Buyer's remorse, change of mind, or dissatisfaction with the service does not qualify for a refund.</li>
                </ul>

                <div className="bg-white border-2 border-red-600 rounded-lg p-4 my-4">
                  <h4 className="font-bold text-red-900 mb-2">📌 In Plain English:</h4>
                  <p className="text-gray-900">
                    <strong>When you cancel your subscription, we will stop charging you for FUTURE billing periods. 
                    However, we CANNOT and WILL NOT refund the money you already paid for your CURRENT subscription period. 
                    All sales are final.</strong>
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4 my-4">
                  <h4 className="font-semibold text-gray-900 mb-2">💡 Example:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-800 text-sm">
                    <li>You subscribe on January 1st for $19/month</li>
                    <li>You're charged $19 immediately (covers Jan 1 - Jan 31)</li>
                    <li>On January 15th, you decide to cancel</li>
                    <li><strong>Result:</strong>
                      <ul className="list-disc pl-6 mt-1">
                        <li>✅ You can keep using the service until January 31st (you paid for the full month)</li>
                        <li>✅ You will NOT be charged again on February 1st (future payment canceled)</li>
                        <li>❌ You will NOT get a refund for the $19 you paid on January 1st (no refunds for current period)</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Exceptions (Billing Errors Only):</h4>
                <p className="text-gray-800 mb-2">We will issue refunds ONLY for:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-800 text-sm mb-3">
                  <li><strong>Duplicate charges:</strong> If you were accidentally charged twice for the same subscription period</li>
                  <li><strong>Unauthorized charges:</strong> If your credit card was charged without your authorization (must be reported within 7 days)</li>
                  <li><strong>Incorrect amounts:</strong> If you were charged a different amount than the advertised subscription price</li>
                  <li><strong>As required by law:</strong> Where applicable consumer protection laws mandate refunds</li>
                </ul>
                <p className="text-gray-800 text-sm">
                  <strong>To request a billing error refund, you must contact us within 7 days of the charge at support@captureshowleads.com with evidence of the error.</strong>
                </p>

                <div className="bg-red-100 border border-red-500 rounded-lg p-4 mt-4">
                  <h4 className="font-bold text-red-900 mb-2">Your Acknowledgment:</h4>
                  <p className="text-red-900 font-semibold mb-2">BY SUBSCRIBING, YOU ACKNOWLEDGE AND AGREE:</p>
                  <ol className="list-decimal pl-6 space-y-1 text-red-900 text-sm">
                    <li>You have read and understood this NO REFUNDS policy</li>
                    <li>You understand that canceling your subscription only stops future charges</li>
                    <li>You understand that no refunds will be issued for current or past payments</li>
                    <li>You accept full responsibility for managing your subscription and canceling before unwanted renewals</li>
                    <li>All sales are final</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Section 4 - CRITICAL */}
            <section className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Usage & Community Benchmarking</h2>
              
              <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg mb-4">
                <p className="font-bold text-gray-900 mb-2">BY USING THE SERVICE, YOU CONSENT TO THE FOLLOWING:</p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Community Benchmarking & Gamification</h3>
              
              <h4 className="font-semibold text-gray-900 mb-2">Anonymous Data Aggregation</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>We collect and aggregate performance metrics across ALL CSL users for community benchmarking purposes</strong></li>
                <li><strong>Metrics include:</strong> Lead quality scores, Task completion rates, Speed-to-follow-up times, Email engagement rates, Lead coverage rates</li>
                <li><strong>Your data is anonymized and aggregated with all other users' data</strong></li>
                <li><strong>NO company names, user names, or identifying information is revealed to other users</strong></li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-2">What is NOT Shared</h4>
              <p className="text-gray-700 mb-2">Company names or identities, Specific user information, Individual lead/dealer data, Contact information, Email content, Notes or recordings, Photos or attachments</p>
            </section>

            {/* Section 5 - Social Media */}
            <section className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Social Media Sharing & Top Performer Badges</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Top Performer Badges</h3>
              <p className="text-gray-700 mb-4">
                Users who achieve high percentile rankings (75%+) may earn "Top Performer" badges. Badges are visual achievements that can be shared on social media. Badge sharing is <strong>OPTIONAL</strong> - users choose when and where to share.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Sharing to Social Media</h3>
              <p className="font-semibold text-gray-900 mb-2">BY SHARING A BADGE, YOU CONSENT TO:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Public posting on your chosen social media platform</li>
                <li>CSL may engage with your post (like, comment, share)</li>
                <li>CSL may use your public post as a testimonial</li>
                <li>The post will include CSL branding and a link to our website</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Conduct</h2>
              <p className="text-gray-700 mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms.</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Prohibited Activities</h3>
              <p className="text-gray-700 mb-2">You may NOT:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Violate any applicable laws or regulations</li>
                <li>Upload malware, viruses, or malicious code</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with other users' access to the Service</li>
                <li>Scrape or harvest data from the Service</li>
                <li>Use the Service to send spam or unsolicited communications</li>
                <li>Impersonate another user or entity</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700">
                The Service, including all software, design, and content, is owned by CSL. The CSL name, logo, and trademarks (Capture Show Leads® and CSL™) are owned by CSL. You may not use CSL's intellectual property without written permission.
              </p>
            </section>

            {/* Disclaimers */}
            <section className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers & Limitations of Liability</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 No Warranties</h3>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW: We make no warranties, express or implied. We do not warrant that the Service will meet your requirements or that community benchmarks are 100% accurate.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 Limitation of Liability</h3>
              <p className="text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW: Our liability is limited to the amount you paid in the past 12 months. We are not liable for indirect, incidental, or consequential damages, lost profits, data loss, or business interruption.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Capture Show Leads, LLC</strong></p>
                <p>Email: <a href="mailto:support@captureshowleads.com" className="text-blue-600 hover:underline">support@captureshowleads.com</a></p>
                <p>Website: <a href="https://www.captureshowleads.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.CaptureShowLeads.com</a></p>
                <p className="mt-4">For legal inquiries: <a href="mailto:legal@captureshowleads.com" className="text-blue-600 hover:underline">legal@captureshowleads.com</a></p>
                <p>For data privacy requests: <a href="mailto:privacy@captureshowleads.com" className="text-blue-600 hover:underline">privacy@captureshowleads.com</a></p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acknowledgment</h2>
              <p className="text-gray-700 font-semibold">
                BY USING THE CAPTURE SHOW LEADS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
              </p>
              <p className="text-gray-700 mt-4">
                If you do not agree to these Terms, you must immediately cease using the Service and cancel your account.
              </p>
            </section>

            {/* Document Info */}
            <section className="text-sm text-gray-500 border-t pt-6">
              <p><strong>Document Version:</strong> 1.0</p>
              <p><strong>Effective Date:</strong> January 9, 2026</p>
              <p><strong>Last Reviewed:</strong> January 9, 2026</p>
              <p className="mt-4">© {currentYear} Capture Show Leads, LLC. All rights reserved.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;
