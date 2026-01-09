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

            {/* Section 5 - Badge Scanning, Photography & Consent (CRITICAL!) */}
            <section className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400">
              <h2 className="text-2xl font-bold text-red-900 mb-4">5. Badge Scanning, Photography & Consent Requirements</h2>
              
              <h3 className="text-xl font-semibold text-red-900 mb-3">5.1 User Responsibility for Consent</h3>
              <p className="text-red-900 font-bold mb-3">CRITICAL: When using the badge scanning, photography, or voice recording features of the Service:</p>
              
              <h4 className="font-semibold text-gray-900 mb-2">Your Legal Obligations</h4>
              <p className="text-red-900 font-bold mb-2">YOU ARE SOLELY RESPONSIBLE FOR:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
                <li><strong>Obtaining explicit verbal or written consent from each individual BEFORE photographing their trade show badge</strong></li>
                <li><strong>Obtaining consent BEFORE recording any audio conversations</strong></li>
                <li><strong>Obtaining consent BEFORE taking photos of individuals or their business materials</strong></li>
                <li><strong>Complying with all applicable privacy laws (including GDPR, CCPA, and state privacy laws)</strong></li>
                <li><strong>Complying with venue/event rules regarding photography and recording</strong></li>
                <li><strong>Respecting individuals' privacy rights and requests to not be photographed or recorded</strong></li>
              </ul>

              <div className="bg-white border-2 border-red-500 rounded-lg p-4 my-4">
                <h4 className="font-semibold text-gray-900 mb-2">Required Consent Language</h4>
                <p className="text-gray-700 mb-2">Before photographing a badge or recording, you must inform the individual:</p>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  "I'd like to take a photo of your badge/record our conversation for my lead management system. Is that okay with you?"
                </div>
              </div>

              <h4 className="font-semibold text-red-900 mb-2">No Consent = No Capture</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
                <li>If an individual declines consent, you MAY NOT photograph their badge or record them</li>
                <li>You must manually enter their information (if they provide it)</li>
                <li>You must respect all "no photography" or "do not record" requests</li>
              </ul>

              <h3 className="text-xl font-semibold text-red-900 mb-3">5.2 CSL Is Not Responsible</h3>
              <p className="text-red-900 font-bold mb-2">CSL DISCLAIMS ALL LIABILITY FOR:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
                <li>Your failure to obtain proper consent before photographing badges or recording</li>
                <li>Your violation of individuals' privacy rights</li>
                <li>Your violation of event/venue photography policies</li>
                <li>Any legal claims arising from your unauthorized photography or recording</li>
                <li>Any disputes between you and individuals whose badges you photograph</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Consent Tracking in the Service</h3>
              <p className="text-gray-700 mb-2">The Service provides a "Consent Permissions" tracking feature for your convenience:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You may mark whether consent was obtained for photos, badge scans, and recordings</li>
                <li>This feature is for YOUR recordkeeping only</li>
                <li>CSL does not verify or guarantee that you actually obtained consent</li>
                <li>Marking "consent obtained" in the system does not absolve you of legal responsibility</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Event and Venue Policies</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You must comply with all photography and recording policies of trade show venues</li>
                <li>Some events prohibit badge photography or require special permissions</li>
                <li>You are responsible for knowing and following these rules</li>
                <li>CSL is not liable if you violate event policies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.5 Third-Party Rights</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Trade show badges may contain copyrighted logos, trademarks, or designs</li>
                <li>You are responsible for respecting intellectual property rights</li>
                <li>CSL does not claim ownership of badge photos you upload</li>
                <li>You grant CSL a limited license to store and display badges within your account only</li>
              </ul>
            </section>

            {/* Section 6 - Social Media (FULL VERSION) */}
            <section className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Social Media Sharing & Top Performer Badges</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Top Performer Badges</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Users who achieve high percentile rankings (75%+) may earn "Top Performer" badges</li>
                <li>Badges are visual achievements that can be shared on social media</li>
                <li>Badge sharing is <strong>OPTIONAL</strong> - users choose when and where to share</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Sharing to Social Media</h3>
              <p className="font-semibold text-gray-900 mb-2">BY SHARING A BADGE, YOU CONSENT TO:</p>
              
              <h4 className="font-semibold text-gray-900 mt-3 mb-2">What Gets Shared</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Your performance badge image (includes CSL branding)</li>
                <li>Pre-populated text: "I'm a Top Performer on Capture Show Leads! 🏆 #CSL #TradeShows #LeadManagement"</li>
                <li>Link to CaptureShowLeads.com</li>
                <li><strong>NO specific metrics, company names, or sensitive data is included in the share</strong></li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-2">Which Platforms</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Facebook</li>
                <li>Twitter/X</li>
                <li>LinkedIn</li>
                <li>Instagram (via web intent)</li>
                <li>TikTok</li>
                <li>Other platforms via copy/paste</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-2">Your Control</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You initiate all shares (we never post without your action)</li>
                <li>You can edit the share text before posting</li>
                <li>You can delete shared posts at any time (on the social platform)</li>
                <li>Sharing is entirely voluntary</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-2">CSL Branding</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>All badges include "Capture Show Leads" branding</li>
                <li>Badges link back to www.CaptureShowLeads.com</li>
                <li>This helps CSL gain visibility and attract new users</li>
                <li>By sharing, you help support the platform's growth</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 AI-Generated Social Media Posts</h3>
              <p className="text-gray-700 mb-2">The Service includes a "Social Media Assistant" feature that:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Generates AI-powered post templates for trade shows</li>
                <li>Automatically includes #CaptureShowLeads in all generated posts</li>
                <li>Provides industry-specific and trending hashtags</li>
                <li>Offers one-click sharing to major social platforms</li>
              </ul>

              <p className="font-semibold text-gray-900 mb-2">BY USING THIS FEATURE, YOU AGREE:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>All generated posts will include #CaptureShowLeads hashtag</li>
                <li>You may edit posts before sharing</li>
                <li>CSL may engage with (like, comment, share) your posts that include #CaptureShowLeads</li>
                <li>CSL may use your public posts as testimonials or marketing materials</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.4 Social Media Platform Terms</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You agree to comply with each social media platform's Terms of Service</li>
                <li>We are not responsible for issues with third-party social platforms</li>
                <li>Sharing functionality may be discontinued if platforms change their APIs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.5 Prohibited Sharing</h3>
              <p className="text-gray-700 mb-2">You may NOT:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Modify badge images to remove CSL branding</li>
                <li>Share badges in misleading or deceptive ways</li>
                <li>Imply endorsement by CSL of your company without permission</li>
                <li>Share badges on behalf of others</li>
                <li>Use badges for commercial advertising without written permission</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Conduct</h2>
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

            {/* Section 7 - MISSING CONTENT RESTORED */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Conduct (Continued)</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Content Standards</h3>
              <p className="text-gray-700 mb-2">All content you upload must:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Be lawful and not infringe third-party rights</li>
                <li>Not contain defamatory, obscene, or offensive material</li>
                <li>Comply with GDPR, CCPA, and other privacy laws</li>
                <li>Not contain viruses or malicious code</li>
                <li>Be content you have legal rights to upload</li>
              </ul>
            </section>

            {/* Section 8 - Intellectual Property (FULL VERSION) */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 CSL Ownership</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>The Service, including all software, design, and content, is owned by CSL</li>
                <li>The CSL name, logo, and trademarks are owned by CSL</li>
                <li>You may not use CSL's intellectual property without written permission</li>
                <li>Top Performer badge designs are owned by CSL</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 User Content</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You retain ownership of all data and content you upload</li>
                <li>By uploading content, you grant CSL a license to:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Store and process your content to provide the Service</li>
                    <li>Create anonymous aggregate statistics (as described in Section 4)</li>
                    <li>Display your shared badges publicly (only when you choose to share)</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Feedback</h3>
              <p className="text-gray-700">Any feedback or suggestions you provide may be used by CSL without compensation.</p>
            </section>

            {/* Section 9 - INDEMNIFICATION & HOLD HARMLESS (RESTORED!) */}
            <section className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400">
              <h2 className="text-2xl font-bold text-red-900 mb-4">9. INDEMNIFICATION & HOLD HARMLESS</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Your Indemnification of CSL</h3>
              <p className="text-red-900 font-bold mb-3">YOU AGREE TO INDEMNIFY, DEFEND, AND HOLD HARMLESS Capture Show Leads, LLC, its officers, directors, employees, agents, licensors, and suppliers (collectively, "CSL Parties") from and against:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
                <li><strong>All losses, expenses, damages, and costs</strong>, including reasonable attorneys' fees</li>
                <li><strong>Resulting from:</strong>
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Your violation of these Terms of Service</li>
                    <li>Your violation of any law or regulation</li>
                    <li>Your violation of any third-party rights (including privacy rights, intellectual property rights, or publicity rights)</li>
                    <li><strong className="text-red-900">Your failure to obtain proper consent before photographing badges, taking photos, or recording audio</strong></li>
                    <li><strong className="text-red-900">Any claims by individuals whose badges you photographed without consent</strong></li>
                    <li><strong className="text-red-900">Any claims by trade show venues or event organizers for policy violations</strong></li>
                    <li>Your use or misuse of the Service</li>
                    <li>Content you submit, post, transmit, or make available through the Service</li>
                    <li>Your social media posts (including badges and AI-generated content)</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 Photography & Recording Indemnification</h3>
              <p className="text-red-900 font-bold mb-2">YOU SPECIFICALLY AGREE TO INDEMNIFY CSL FOR:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
                <li>Claims that you photographed someone's badge without their consent</li>
                <li>Claims that you violated someone's privacy rights by recording them</li>
                <li>Claims that you violated trade show or venue policies</li>
                <li>Claims arising from your use of badge photos for any purpose</li>
                <li>Claims arising from copyrighted content in badge photos (logos, trademarks, etc.)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 Defense of Claims</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>CSL reserves the right to assume the exclusive defense and control of any matter subject to indemnification by you</li>
                <li>You agree to cooperate with CSL's defense of such claims</li>
                <li>This indemnification obligation will survive termination of your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.4 No Consent = Your Full Liability</h3>
              <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
                <p className="text-red-900 font-bold mb-2">CSL IS NOT LIABLE FOR YOUR ACTIONS:</p>
                <ul className="list-disc pl-6 space-y-2 text-red-900">
                  <li>If you photograph badges without consent, <strong>YOU are fully liable</strong></li>
                  <li>If you violate privacy laws, <strong>YOU are fully liable</strong></li>
                  <li>If you violate event policies, <strong>YOU are fully liable</strong></li>
                  <li>The Service provides tools, but <strong>YOU control how you use them</strong></li>
                </ul>
              </div>
            </section>

            {/* Section 10 - Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Third-Party Services</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Integrations</h3>
              <p className="text-gray-700 mb-2">The Service integrates with third-party services:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Stripe</strong> - Payment processing</li>
                <li><strong>AWS</strong> - Cloud hosting and storage</li>
                <li><strong>Social Media Platforms</strong> - Badge sharing (Facebook, Twitter, LinkedIn, etc.)</li>
                <li><strong>Email Services</strong> - Email delivery</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Third-Party Terms</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You agree to comply with all third-party service terms</li>
                <li>We are not responsible for third-party service failures</li>
                <li>Third-party services have their own privacy policies</li>
              </ul>
            </section>

            {/* Section 11 - Disclaimers */}
            <section className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. DISCLAIMERS & LIMITATIONS OF LIABILITY</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.1 Service Availability</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>The Service is provided "as is" and "as available"</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We may suspend the Service for maintenance or updates</li>
                <li>We are not liable for data loss (you should maintain backups)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.2 No Warranties</h3>
              <p className="text-gray-700 font-bold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>We make no warranties, express or implied</li>
                <li>We do not warrant that the Service will meet your requirements</li>
                <li>We do not warrant that community benchmarks are 100% accurate</li>
                <li>We do not guarantee specific performance improvements from using the Service</li>
                <li>We do not warrant that AI-generated content is error-free or suitable for your purposes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.3 Limitation of Liability</h3>
              <p className="text-gray-700 font-bold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Our liability is limited to the amount you paid in the past 12 months</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>We are not liable for lost profits, data loss, or business interruption</li>
                <li>We are not liable for third-party actions (including social media platforms)</li>
                <li><strong className="text-red-900">We are not liable for your violations of consent, privacy, or photography laws</strong></li>
                <li><strong className="text-red-900">We are not liable for claims arising from your badge photography or audio recordings</strong></li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.4 Disclaimer of Legal Advice</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>CSL does not provide legal advice regarding consent requirements</li>
                <li>You should consult your own attorney regarding privacy and consent laws</li>
                <li>The consent tracking features are for convenience only, not legal compliance</li>
              </ul>
            </section>

            {/* Section 12 - Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Privacy & Data Protection</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Privacy Policy</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Our Privacy Policy (separate document) describes how we collect and use data</li>
                <li>By using the Service, you consent to our Privacy Policy</li>
                <li>We comply with GDPR, CCPA, and other applicable privacy laws</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Data Requests</h3>
              <p className="text-gray-700 mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Access your personal data</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Correct inaccurate data</li>
                <li>Withdraw consent (by canceling your account)</li>
              </ul>
              <p className="text-gray-700">Contact us at support@captureshowleads.com for data requests.</p>
            </section>

            {/* Section 13 - Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modifications to Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">13.1 Updates</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>We may update these Terms at any time</li>
                <li>Changes will be effective immediately upon posting</li>
                <li>Continued use of the Service constitutes acceptance of changes</li>
                <li>Material changes will be communicated via email</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">13.2 Notification</h3>
              <p className="text-gray-700 mb-2">We will notify users of significant changes via:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Email to your registered address</li>
                <li>In-app notifications</li>
                <li>Updates to this document with a new "Last Updated" date</li>
              </ul>
            </section>

            {/* Section 14 - Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Termination</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 Termination by You</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You may cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of your billing period</li>
                <li>You may export your data before canceling</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 Termination by Us</h3>
              <p className="text-gray-700 mb-2">We may terminate your account immediately if:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You violate these Terms</li>
                <li>You engage in fraudulent activity</li>
                <li>You abuse the Service or other users</li>
                <li>You fail to pay subscription fees</li>
                <li>You violate consent, privacy, or photography laws</li>
                <li>Required by law</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.3 Effect of Termination</h3>
              <p className="text-gray-700 mb-2">Upon termination:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Your access to the Service will cease</li>
                <li>Your data may be deleted after 30 days (unless legally required to retain)</li>
                <li>You remain liable for any outstanding fees</li>
                <li><strong className="text-red-900">Indemnification obligations survive termination</strong></li>
                <li>Sections that should survive termination will remain in effect</li>
              </ul>
            </section>

            {/* Section 15 - Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Governing Law & Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.1 Governing Law</h3>
              <p className="text-gray-700 mb-4">These Terms are governed by the laws of New Jersey, United States, without regard to conflict of law principles.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.2 Dispute Resolution</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Any disputes will be resolved through binding arbitration</li>
                <li>Arbitration will be conducted under the American Arbitration Association rules</li>
                <li>You waive the right to a jury trial</li>
                <li>You waive the right to participate in class actions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.3 Exceptions</h3>
              <p className="text-gray-700">You may bring claims in small claims court if they qualify.</p>
            </section>

            {/* Section 16 - General Provisions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. General Provisions</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.1 Entire Agreement</h3>
              <p className="text-gray-700 mb-4">These Terms, along with our Privacy Policy, constitute the entire agreement between you and CSL.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.2 Severability</h3>
              <p className="text-gray-700 mb-4">If any provision is found invalid, the remaining provisions remain in effect.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.3 Waiver</h3>
              <p className="text-gray-700 mb-4">Failure to enforce any provision does not constitute a waiver.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.4 Assignment</h3>
              <p className="text-gray-700 mb-4">You may not assign these Terms. We may assign them to a successor or affiliate.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.5 Force Majeure</h3>
              <p className="text-gray-700">We are not liable for failures due to circumstances beyond our reasonable control.</p>
            </section>

            {/* Section 17 - Contact */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Contact Information</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Capture Show Leads, LLC</strong></p>
                <p>Email: <a href="mailto:support@captureshowleads.com" className="text-blue-600 hover:underline">support@captureshowleads.com</a></p>
                <p>Website: <a href="https://www.captureshowleads.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.CaptureShowLeads.com</a></p>
                <p className="mt-4">For legal inquiries: <a href="mailto:legal@captureshowleads.com" className="text-blue-600 hover:underline">legal@captureshowleads.com</a></p>
                <p>For data privacy requests: <a href="mailto:privacy@captureshowleads.com" className="text-blue-600 hover:underline">privacy@captureshowleads.com</a></p>
              </div>
            </section>

            {/* Section 18 - Special Provisions for Community Benchmarking (RESTORED!) */}
            <section className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Special Provisions for Community Benchmarking</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">18.1 Consent to Data Processing</h3>
              <p className="text-gray-900 font-bold mb-2">BY USING THE SERVICE, YOU EXPRESSLY CONSENT TO:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Collection of performance metrics from your account</li>
                <li>Aggregation of your metrics with all other users' metrics</li>
                <li>Display of anonymous community benchmarks to all users</li>
                <li>Use of your anonymized data for platform improvement</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">18.2 Anonymization Process</h3>
              <p className="text-gray-700 mb-2">We ensure anonymity through:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Removal of all personally identifiable information</li>
                <li>Aggregation across all users (no individual data shown)</li>
                <li>Statistical calculations that prevent reverse-engineering</li>
                <li>No company names or identifiers in benchmark displays</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">18.3 No Opt-Out for Benchmarking</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Community benchmarking is integral to the Service</li>
                <li>If you do not consent, you must not use the Service</li>
                <li>Your only opt-out option is to cancel your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">18.4 Accuracy Disclaimer</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Benchmarks are calculated based on available data</li>
                <li>We do not guarantee 100% accuracy of percentile rankings</li>
                <li>Rankings may fluctuate as new users join or data changes</li>
                <li>Benchmarks are for informational purposes only</li>
              </ul>
            </section>

            {/* Section 19 - Special Provisions for Social Media Sharing (RESTORED!) */}
            <section className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Special Provisions for Social Media Sharing</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">19.1 Voluntary Participation</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Badge sharing is entirely voluntary</li>
                <li>You control when, where, and if you share badges</li>
                <li>We never post to social media without your explicit action</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">19.2 Badge Content</h3>
              <p className="text-gray-700 mb-2">Badges may include:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>"Top Performer" designation</li>
                <li>CSL branding and logo</li>
                <li>Link to www.CaptureShowLeads.com</li>
                <li>Your percentile ranking (optional)</li>
                <li>Achievement date</li>
              </ul>

              <p className="text-gray-700 mb-2">Badges do NOT include:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Your company name (unless you add it manually)</li>
                <li>Specific metric values</li>
                <li>Lead/dealer data</li>
                <li>Contact information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">19.3 Platform Responsibility</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>We provide the sharing mechanism</li>
                <li>You are responsible for what you post on social media</li>
                <li>Social media platforms' terms apply to all shared content</li>
                <li>We may discontinue sharing features at any time</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">19.4 Marketing Consent</h3>
              <p className="text-gray-700 mb-2">By sharing a badge, you consent to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>CSL using your public social post as a testimonial (anonymously or with attribution)</li>
                <li>CSL tagging your post (if applicable on the platform)</li>
                <li>CSL engaging with your post (likes, comments, shares)</li>
              </ul>

              <p className="text-gray-700 mb-2">You may withdraw this consent by:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Deleting your social media post</li>
                <li>Contacting us at privacy@captureshowleads.com</li>
              </ul>
            </section>

            {/* Section 20 - ACKNOWLEDGMENT */}
            <section className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">20. ACKNOWLEDGMENT & ACCEPTANCE</h2>
              <p className="text-gray-900 font-bold mb-3">BY USING THE CAPTURE SHOW LEADS SERVICE, YOU ACKNOWLEDGE THAT:</p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800 mb-4">
                <li>✅ You have read and understood these Terms of Service</li>
                <li>✅ You agree to be bound by these Terms</li>
                <li className="text-red-900 font-semibold">✅ You are solely responsible for obtaining consent before photographing badges or recording audio</li>
                <li className="text-red-900 font-semibold">✅ You will comply with all privacy laws and event photography policies</li>
                <li className="text-red-900 font-semibold">✅ You agree to indemnify and hold harmless CSL for your actions</li>
                <li>✅ You consent to community benchmarking and anonymous data aggregation</li>
                <li>✅ You understand that badge sharing includes #CaptureShowLeads branding</li>
                <li>✅ You accept all limitations of liability and disclaimers</li>
              </ol>
              <p className="text-red-900 font-bold text-center mt-4">
                IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST IMMEDIATELY CEASE USING THE SERVICE AND CANCEL YOUR ACCOUNT.
              </p>
            </section>

            {/* Section 21 - IMPORTANT LEGAL NOTICES */}
            <section className="bg-red-50 p-6 rounded-lg border-2 border-red-400">
              <h2 className="text-2xl font-bold text-red-900 mb-4">21. IMPORTANT LEGAL NOTICES</h2>
              
              <h3 className="text-xl font-semibold text-red-900 mb-3">21.1 ⚠️ CONSENT IS YOUR RESPONSIBILITY</h3>
              <p className="text-red-900 font-bold mb-2">CSL CANNOT AND DOES NOT:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
                <li>Obtain consent on your behalf</li>
                <li>Verify that you obtained consent</li>
                <li>Guarantee your compliance with privacy laws</li>
                <li>Assume liability for your failure to obtain consent</li>
              </ul>

              <h3 className="text-xl font-semibold text-red-900 mb-3">21.2 ⚠️ PRIVACY LAW COMPLIANCE</h3>
              <p className="text-gray-800 mb-2">You must comply with:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
                <li>GDPR (if capturing EU residents' data)</li>
                <li>CCPA (if capturing California residents' data)</li>
                <li>State privacy laws (varies by state)</li>
                <li>Trade show and venue policies</li>
                <li>Industry-specific regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-red-900 mb-3">21.3 ⚠️ CONSEQUENCES OF NON-COMPLIANCE</h3>
              <p className="text-gray-800 mb-2">If you fail to obtain proper consent:</p>
              <ul className="list-disc pl-6 space-y-2 text-red-900 font-semibold mb-4">
                <li>YOU may face legal claims and penalties</li>
                <li>CSL is not liable and will not defend you</li>
                <li>You must indemnify CSL for any resulting claims</li>
                <li>Your account may be terminated</li>
              </ul>

              <h3 className="text-xl font-semibold text-red-900 mb-3">21.4 ⚠️ RECOMMENDATION</h3>
              <p className="text-gray-800 mb-2">We strongly recommend:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                <li>Consulting an attorney about your consent obligations</li>
                <li>Creating a written consent form for badge photography</li>
                <li>Training your staff on proper consent procedures</li>
                <li>Following all venue and event policies strictly</li>
              </ul>
            </section>

            {/* Final Notice */}
            <div className="mt-8 bg-gray-100 p-6 rounded-lg text-center">
              <p className="text-gray-700">
                <strong>Document Version:</strong> 2.0<br />
                <strong>Effective Date:</strong> January 9, 2026<br />
                <strong>Last Reviewed:</strong> January 9, 2026
              </p>
              <p className="text-gray-600 mt-4 text-sm">
                This document supersedes all previous versions of the Terms of Service.
              </p>
            </div>

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
