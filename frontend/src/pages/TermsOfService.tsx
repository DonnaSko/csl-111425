import Layout from '../components/Layout';

const TermsOfService = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <p className="text-gray-600 text-sm">Last Updated: September 24, 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What You're Getting</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You're using our trade-show lead app ("Service"). You can buy:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Per-Show License</strong> (use for one show between your start and end dates), or</li>
              <li><strong>Subscription</strong> (monthly/annual) with device and concurrent-show limits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Your Data is Yours</h2>
            <p className="text-gray-700 leading-relaxed">
              You (and your company) own all lead data (contacts, notes, photos, voice notes). <strong>We never sell your data.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Using the Service</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Who can use it:</strong> A Paid User with a current monthly or annual subscription. Each person from a Company/Team will need to buy a seat or a subscription to have access to the app.</li>
              <li><strong>What you can do:</strong> Capture leads at shows, add notes/photos/voice notes, export CSV, manage follow-ups.</li>
              <li><strong>What you can't do:</strong> Anything illegal, spammy, or that breaks someone else's rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Show Windows & Edit-Lock</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>For Per-Show:</strong> You can add/edit leads from Show Start to Show End + 4 days.</li>
              <li>After that, the show becomes read-only (you can still view/export).</li>
              <li>This helps teams follow up instead of "polishing" forever.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Plans, Limits, and Pricing</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800">Starter (Free Trial)</h3>
                <p className="text-gray-700">5 total leads, 1 device, no custom fields.</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800">Pro</h3>
                <p className="text-gray-700">3 devices, custom fields, unlimited voice notes, follow-ups, CSV export, 4-day edit-lock.</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-gray-800">Enterprise</h3>
                <p className="text-gray-700">6 devices, priority support, admin "view as user," audit logs, show templates, bulk import, hot-leads report, optional SSO.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mt-4">
              Per-Show pricing or Subscription pricing as listed on our site/app. You can buy add-ons (e.g., extra devices, custom form setup, hot-leads report).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payments & Refunds</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Payments are processed by <strong>Stripe</strong>.</li>
              <li><strong>Per-Show (Pro/Enterprise) guarantee:</strong> If you capture fewer than 100 qualified leads (unique contacts with at least a name plus one contact method), request a refund within 14 days after the edit-lock date; we may ask for an export to verify.</li>
              <li>Subscriptions renew automatically each billing period until canceled.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Support & Admin Access</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>We provide email support (and priority support for Enterprise).</li>
              <li>With your permission, our admin may "view as user" to troubleshoot.</li>
              <li>All impersonation access is logged (who, when, what).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy & Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We protect data in transit and at rest using industry-standard methods. 
              See our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> for full details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Availability & Changes</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>We aim for high uptime. Sometimes we'll update or pause features for maintenance.</li>
              <li>We can change the Service and pricing; we'll post updates. If a change is material, we'll notify you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination & Refund Policy</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>You may stop using the Service anytime. Subscriptions remain active until canceled.</li>
              <li>We can suspend/terminate for abuse, non-payment, or security risks.</li>
              <li>On termination, you can export your data. We may retain backups for a time as described in the Privacy Policy.</li>
            </ul>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">Refund Policy (B2B)</h3>
            <p className="text-gray-700 leading-relaxed">
              All fees are non-refundable, including for partially used subscription periods. You may cancel at any time; cancellation stops future renewals and you will retain access through the end of the current paid term.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Billing Errors</h3>
            <p className="text-gray-700 leading-relaxed">
              If you believe you were charged in error (duplicate charge, wrong plan, wrong amount), contact us within 7 days of the charge. Verified billing errors will be corrected or refunded.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Service Unavailability</h3>
            <p className="text-gray-700 leading-relaxed">
              If the service is unavailable due to our fault for a material period of time, we may issue a service credit or prorated refund at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Liability</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>To the fullest extent allowed by law, our liability is limited to the amounts you paid us in the past 12 months for the Service.</li>
              <li>We are not liable for indirect or consequential damages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Hold Harmless & Indemnification</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to protect us if someone else sues because of how you used the Service. To the fullest extent allowed by law, Customer (you) will defend, indemnify, and hold harmless Capture Show Leads, LLC, its affiliates, and their directors, officers, employees, and agents (together, "CSL") from and against any third-party claims, demands, losses, liabilities, damages, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
              <li>Use or misuse of the Service by you or your users;</li>
              <li>Breach of these Terms or violation of applicable laws or regulations;</li>
              <li>Customer Data or Content you upload, collect, or process (including lead data, photos, voice notes, and emails), and any alleged IP or privacy violations in that content;</li>
              <li>Your combinations of the Service with other products, systems, or data not provided by CSL;</li>
              <li>Your instructions or configurations to the Service (including qualifiers, email templates, or exports).</li>
            </ol>
            
            <p className="text-gray-700 leading-relaxed mt-4">
              This obligation does not apply to the extent a claim is caused by CSL's gross negligence or willful misconduct.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Defense & Settlement</h3>
            <p className="text-gray-700 leading-relaxed">
              CSL will: (a) promptly notify you of any claim (delay won't relieve you unless it materially harms your defense); (b) let you control the defense and settlement; and (c) reasonably cooperate at your expense. You may not settle any claim that imposes any admission of fault, non-monetary obligations, or liability on CSL without CSL's prior written consent (not to be unreasonably withheld). CSL may participate with its own counsel at its own expense.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Relationship to Other Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              This Section works in addition to the Limitation of Liability section and does not expand CSL's liability. Your statutory consumer rights (if any) remain unaffected.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Exclusions</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              CSL's obligation does not apply to any claim to the extent it arises from:
            </p>
            <ol className="list-[lower-alpha] list-inside text-gray-700 space-y-1 ml-4">
              <li>Customer Data or Content (including leads, photos, voice notes, emails);</li>
              <li>Combinations of the Service with items not supplied by CSL where the claim would not exist but for that combination;</li>
              <li>Modifications to the Service not made by CSL;</li>
              <li>Use not in accordance with the Documentation or these Terms;</li>
              <li>Open source components used under their own licenses; or</li>
              <li>Customer's continued use of a version after CSL makes an updated, non-infringing version available.</li>
            </ol>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Customer's IP Indemnity</h3>
            <p className="text-gray-700 leading-relaxed">
              Customer will defend, indemnify, and hold CSL harmless from any third-party claim alleging that Customer Data/Content, configurations, or Customer's use of the Service in violation of these Terms infringes or misappropriates a third party's IP rights, and will pay all damages, costs, and reasonable attorneys' fees finally awarded or included in a settlement Customer approves.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Consent to Record/Photograph & Badge Scans</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Consent for Photos, Audio, and Badge Scans</h3>
            
            <ol className="list-decimal list-inside text-gray-700 space-y-4 ml-4">
              <li>
                <strong>Consent required.</strong> Customer and its users must obtain the individual's express consent (verbal or written) before capturing any photo, audio/voice note, or image of an event badge using the Service. Consent should make clear that (a) information will be captured for follow-up after the show, and (b) the individual may decline.
              </li>
              <li>
                <strong>Compliance with laws & show rules.</strong> Customer is solely responsible for compliance with all applicable privacy, right-of-publicity, recording-consent, and wiretapping laws, and with event/venue/organizer policies regarding photography, recordings, and badge scanning. (Note: some U.S. states require all-party consent for audio recording.)
              </li>
              <li>
                <strong>No sensitive personal data.</strong> Customer agrees not to capture or store sensitive data (e.g., government IDs, financial account numbers, health/medical data, biometric templates) in the Service. Images of badges should be limited to business-contact details related to the event.
              </li>
              <li>
                <strong>Notice & opt-out.</strong> If any individual asks not to be recorded or photographed, Customer will stop immediately and will delete any previously captured photo/audio/badge image of that individual upon request.
              </li>
              <li>
                <strong>Customer representations.</strong> Customer represents and warrants that it has all rights, permissions, and consents required to collect and process personal data via the Service, and that it has provided all legally required notices (including where required by organizer/venue policies).
              </li>
              <li>
                <strong>Indemnity.</strong> To the extent permitted by law, Customer will defend, indemnify, and hold harmless Capture Show Leads from claims, fines, or penalties arising out of Customer's failure to obtain consent or comply with applicable laws/policies related to photos, audio, or badge scans (subject to the indemnity limits set elsewhere in these Terms). <em>(See Section 12: Hold Harmless & Indemnification)</em>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Disputes & Law</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>These terms are governed by the laws of <strong>New Jersey</strong> (without regard to conflicts of law).</li>
              <li><strong>Venue:</strong> Courts located in Morris County, NJ.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact</h2>
            <p className="text-gray-700 leading-relaxed">Questions? Contact us:</p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700"><strong>Capture Show Leads, LLC</strong></p>
              <p className="text-gray-700">Email: <a href="mailto:support@CaptureShowLeads.com" className="text-blue-600 hover:underline">support@CaptureShowLeads.com</a></p>
              <p className="text-gray-700">Phone: <a href="tel:973-467-0680" className="text-blue-600 hover:underline">973-467-0680</a></p>
            </div>
          </section>

          <section className="border-t pt-6 mt-8">
            <p className="text-gray-500 text-sm text-center">
              <strong>By using the Service you agree to these Terms.</strong>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;

