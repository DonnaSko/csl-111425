import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import Tesseract from 'tesseract.js';

interface DealerMatch {
  id: string;
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  score: number;
}

const CaptureLead = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    address: '',
    buyingGroup: '',
    status: 'Prospect',
  });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [matchingDealers, setMatchingDealers] = useState<DealerMatch[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/dealers', formData);
      const dealerId = response.data.id;
      
      // If badge image was captured, upload it
      if (badgeImage && dealerId) {
        try {
          const formData = new FormData();
          formData.append('photo', badgeImage);
          formData.append('type', 'badge');
          
          await api.post(`/uploads/photo/${dealerId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (error) {
          console.error('Failed to upload badge photo:', error);
          // Continue anyway - dealer was created
        }
      }
      
      navigate(`/dealers/${dealerId}`);
    } catch (error: any) {
      console.error('Failed to create dealer:', error);
      alert(error.response?.data?.error || 'Failed to create dealer');
    } finally {
      setLoading(false);
    }
  };

  const handleScanBadge = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const performOCR = async (file: File): Promise<string> => {
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      return '';
    }
  };

  const searchDealers = async (searchText: string): Promise<DealerMatch[]> => {
    try {
      // Extract potential company and contact names from OCR text
      const lines = searchText.split('\n').filter(line => line.trim().length > 2);
      const searchTerms = lines.slice(0, 5).join(' '); // Use first 5 lines
      
      // Search dealers using the fuzzy search endpoint
      const response = await api.get('/dealers/search', {
        params: { q: searchTerms, limit: 10 }
      });
      
      return response.data.map((dealer: any) => ({
        id: dealer.id,
        companyName: dealer.companyName,
        contactName: dealer.contactName,
        email: dealer.email,
        phone: dealer.phone,
        city: dealer.city,
        state: dealer.state,
        score: dealer.score || 0
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  const handleBadgeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBadgeImage(file);
    setScanning(true);
    setMatchingDealers([]);
    setShowMatches(false);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBadgePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Perform OCR on the badge
      const text = await performOCR(file);
      setExtractedText(text);
      console.log('Extracted text:', text);

      if (text.trim()) {
        // Search for matching dealers
        const matches = await searchDealers(text);
        console.log('Found matches:', matches);

        if (matches.length === 1 && matches[0].score > 0.8) {
          // Strong single match - go directly to dealer
          navigate(`/dealers/${matches[0].id}`);
          return;
        } else if (matches.length > 0) {
          // Multiple matches or weak match - show options
          setMatchingDealers(matches);
          setShowMatches(true);
          
          // Auto-fill form with extracted text if no strong matches
          const lines = text.split('\n').filter(l => l.trim().length > 2);
          if (lines.length > 0 && matches[0].score < 0.8) {
            setFormData(prev => ({
              ...prev,
              companyName: lines[0]?.trim() || prev.companyName,
              contactName: lines[1]?.trim() || prev.contactName,
            }));
          }
        } else {
          // No matches - auto-fill form with OCR data
          const lines = text.split('\n').filter(l => l.trim().length > 2);
          if (lines.length > 0) {
            setFormData(prev => ({
              ...prev,
              companyName: lines[0]?.trim() || '',
              contactName: lines[1]?.trim() || '',
            }));
          }
        }
      }
      
      // Scroll to results or form
      setTimeout(() => {
        if (matchingDealers.length > 0) {
          document.getElementById('dealer-matches')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          document.getElementById('dealer-form')?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Badge processing error:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleClearBadge = () => {
    setBadgeImage(null);
    setBadgePreview(null);
    setMatchingDealers([]);
    setShowMatches(false);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectDealer = (dealerId: string) => {
    navigate(`/dealers/${dealerId}`);
  };

  const handleCreateNew = () => {
    setShowMatches(false);
    setTimeout(() => {
      document.getElementById('dealer-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <Layout>
      <div className="max-w-2xl px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Capture Lead</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Find a dealer to view their profile or add a new one.</p>

        {/* Step 1: Find or Create Dealer */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Step 1: Find or Create Dealer
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Search for an existing dealer, scan a badge, or add a new one.
          </p>

          {/* Scan Badge Option */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleBadgeCapture}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleScanBadge}
              className="w-full border-2 border-green-300 rounded-lg p-4 sm:p-6 text-left hover:bg-green-50 transition-colors"
            >
              <span className="text-xl sm:text-2xl mr-3">📷</span>
              <span className="text-sm sm:text-base font-medium">Scan Badge / Take Photo</span>
            </button>
            
            {/* Badge Preview */}
            {badgePreview && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-800">
                    {scanning ? '🔍 Scanning badge...' : '✓ Badge Photo Captured'}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearBadge}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
                <img 
                  src={badgePreview} 
                  alt="Badge preview" 
                  className="w-full max-w-md mx-auto rounded border border-gray-300"
                />
                {scanning && (
                  <div className="mt-3 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div>
                    <p className="text-xs text-gray-600 mt-2">Reading badge text...</p>
                  </div>
                )}
                {!scanning && extractedText && (
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {matchingDealers.length > 0 
                      ? `Found ${matchingDealers.length} possible match${matchingDealers.length > 1 ? 'es' : ''} - choose below`
                      : 'No matches found - fill in form below'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Matching Dealers Section */}
          {showMatches && matchingDealers.length > 0 && (
            <div id="dealer-matches" className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                🎯 Found {matchingDealers.length} Possible Match{matchingDealers.length > 1 ? 'es' : ''}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Is this the dealer you scanned? Click to view their profile:
              </p>
              <div className="space-y-2">
                {matchingDealers.map((dealer) => (
                  <button
                    key={dealer.id}
                    onClick={() => handleSelectDealer(dealer.id)}
                    className="w-full text-left p-3 bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{dealer.companyName}</p>
                        {dealer.contactName && (
                          <p className="text-sm text-gray-600">{dealer.contactName}</p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          {dealer.city && dealer.state && (
                            <span>📍 {dealer.city}, {dealer.state}</span>
                          )}
                          {dealer.phone && <span>📞 {dealer.phone}</span>}
                        </div>
                      </div>
                      <span className="text-blue-600 text-sm font-medium">View →</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreateNew}
                className="w-full mt-3 p-3 bg-white border-2 border-dashed border-gray-400 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700"
              >
                ➕ None of these - Create New Dealer
              </button>
            </div>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-white text-gray-500">— {badgePreview ? 'ENTER INFO' : 'OR ENTER MANUALLY'} —</span>
            </div>
          </div>

          {/* Manual Entry Form */}
          <form id="dealer-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-100"
                placeholder="Search by company or contact..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Prospect</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Buying Group</label>
              <input
                type="text"
                name="buyingGroup"
                value={formData.buyingGroup}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-6 text-sm sm:text-base rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Dealer'}
            </button>
          </form>
        </div>

        {/* Lead Capture Guide */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 flex items-center">
            <span className="mr-2">📷</span>
            Lead Capture Guide
          </h3>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm text-gray-700">
                I received the attendee's OK to scan their badge.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Ask: "Can I take a photo of your badge for follow-up?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CaptureLead;

