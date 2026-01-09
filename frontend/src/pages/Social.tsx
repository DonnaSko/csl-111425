import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

interface TradeShow {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
}

const Social = () => {
  const [tradeShows, setTradeShows] = useState<TradeShow[]>([]);
  const [selectedShow, setSelectedShow] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [postType, setPostType] = useState<'announcement' | 'recap' | 'booth' | 'networking'>('announcement');
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTradeShows();
    loadUserInfo();
  }, []);

  const fetchTradeShows = async () => {
    try {
      const response = await api.get('/trade-shows');
      setTradeShows(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedShow(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load trade shows:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      setCompanyName(response.data.company?.name || '');
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const generatePost = () => {
    setLoading(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const show = tradeShows.find(ts => ts.id === selectedShow);
      if (!show) return;

      const location = show.location || 'the venue';
      const industryHashtags = getIndustryHashtags(industry);
      const trendingHashtags = getTrendingHashtags(postType);
      
      let post = '';
      
      switch (postType) {
        case 'announcement':
          post = `🎉 Exciting news! ${companyName} will be attending ${show.name} in ${location}!\n\n` +
                 `📍 Visit our booth to:\n` +
                 `✅ See our latest innovations\n` +
                 `✅ Connect with our team\n` +
                 `✅ Discover industry solutions\n\n` +
                 `Who else is attending? Let's connect! 🤝\n\n` +
                 `${industryHashtags} ${trendingHashtags} #CaptureShowLeads`;
          break;
          
        case 'recap':
          post = `🌟 What an amazing ${show.name}!\n\n` +
                 `Thank you to everyone who visited our booth! We had incredible conversations ` +
                 `and made valuable connections.\n\n` +
                 `Key highlights:\n` +
                 `✨ Met 100+ industry professionals\n` +
                 `✨ Showcased our innovations\n` +
                 `✨ Built partnerships for the future\n\n` +
                 `Already looking forward to next year! 🚀\n\n` +
                 `${industryHashtags} ${trendingHashtags} #CaptureShowLeads`;
          break;
          
        case 'booth':
          post = `🎪 Come visit us at ${show.name}!\n\n` +
                 `We're at Booth [Your Booth #] ready to:\n` +
                 `💡 Share industry insights\n` +
                 `💡 Demo our solutions\n` +
                 `💡 Answer your questions\n\n` +
                 `Stop by for exclusive show offers! 🎁\n\n` +
                 `${industryHashtags} ${trendingHashtags} #CaptureShowLeads`;
          break;
          
        case 'networking':
          post = `🤝 Loving the energy at ${show.name}!\n\n` +
                 `Great conversations with industry leaders and innovators. ` +
                 `This is what trade shows are all about - connection, collaboration, and growth.\n\n` +
                 `If you're here, let's connect! Drop a comment or DM. 📲\n\n` +
                 `${industryHashtags} ${trendingHashtags} #CaptureShowLeads`;
          break;
      }
      
      setGeneratedPost(post);
      setLoading(false);
    }, 1000);
  };

  const getIndustryHashtags = (ind: string): string => {
    const hashtags: { [key: string]: string } = {
      'automotive': '#Automotive #AutoIndustry #Cars #Innovation',
      'technology': '#Tech #Technology #Innovation #Digital',
      'healthcare': '#Healthcare #Medical #Health #Wellness',
      'retail': '#Retail #Commerce #Shopping #Business',
      'manufacturing': '#Manufacturing #Industry #Production #Supply Chain',
      'construction': '#Construction #Building #RealEstate #Development',
      'hospitality': '#Hospitality #Hotel #Tourism #Events',
      'food': '#Food #Foodie #Culinary #Restaurant',
      'fashion': '#Fashion #Style #Design #Apparel',
      'finance': '#Finance #Business #FinTech #Banking',
    };
    
    return hashtags[ind.toLowerCase()] || '#Business #Industry #TradeShow';
  };

  const getTrendingHashtags = (type: string): string => {
    const trending: { [key: string]: string } = {
      'announcement': '#TradeShow #Networking #BusinessGrowth #B2B',
      'recap': '#EventRecap #Success #Grateful #Community',
      'booth': '#LiveEvent #InPerson #ShowFloor #VisitUs',
      'networking': '#BusinessNetworking #MakeConnections #Collaboration #Partnership',
    };
    
    return trending[type] || '#TradeShow #Business';
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    alert('✅ Post copied to clipboard!\n\nPaste it on your favorite social media platform! 🚀');
  };

  const shareToTwitter = () => {
    const encodedText = encodeURIComponent(generatedPost);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const encodedUrl = encodeURIComponent('https://www.captureshowleads.com');
    navigator.clipboard.writeText(generatedPost);
    alert('✅ Post copied to clipboard!\n\nLinkedIn will open. Click "Start a post" and paste your content!');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank', 'width=600,height=600');
  };

  const shareToFacebook = () => {
    const encodedUrl = encodeURIComponent('https://www.captureshowleads.com');
    navigator.clipboard.writeText(generatedPost);
    alert('✅ Post copied to clipboard!\n\nFacebook will open. Paste your content to share!');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400');
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Social Media Assistant</h1>
          <p className="text-gray-600">
            Generate AI-powered social media posts for your trade show attendance. 
            All posts automatically include #CaptureShowLeads to help amplify our product! 🎉
          </p>
        </div>

        {/* Generator Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Generate Your Post</h2>

          <div className="space-y-6">
            {/* Trade Show Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Select Trade Show
              </label>
              <select
                value={selectedShow}
                onChange={(e) => setSelectedShow(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tradeShows.map(show => (
                  <option key={show.id} value={show.id}>
                    {show.name} - {show.location} ({new Date(show.startDate || '').toLocaleDateString()})
                  </option>
                ))}
                {tradeShows.length === 0 && (
                  <option value="">No trade shows found - Add one first!</option>
                )}
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏢 Your Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select your industry...</option>
                <option value="automotive">Automotive</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="construction">Construction</option>
                <option value="hospitality">Hospitality</option>
                <option value="food">Food & Beverage</option>
                <option value="fashion">Fashion & Apparel</option>
                <option value="finance">Finance & Banking</option>
              </select>
            </div>

            {/* Post Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Post Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setPostType('announcement')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    postType === 'announcement'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📢 Announcement
                </button>
                <button
                  onClick={() => setPostType('booth')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    postType === 'booth'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🎪 Booth Invite
                </button>
                <button
                  onClick={() => setPostType('networking')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    postType === 'networking'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🤝 Networking
                </button>
                <button
                  onClick={() => setPostType('recap')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    postType === 'recap'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🌟 Recap
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePost}
              disabled={!selectedShow || !industry || loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '✨ Generating...' : '✨ Generate AI-Powered Post'}
            </button>
          </div>
        </div>

        {/* Generated Post */}
        {generatedPost && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎉 Your Generated Post</h3>
            
            <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{generatedPost}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                <span>📋</span>
                Copy to Clipboard
              </button>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={shareToTwitter}
                  className="px-6 py-3 bg-[#1DA1F2] text-white rounded-lg font-semibold hover:bg-[#1A91DA] transition flex items-center justify-center gap-2"
                >
                  <span>🐦</span>
                  Share on X
                </button>
                <button
                  onClick={shareToLinkedIn}
                  className="px-6 py-3 bg-[#0A66C2] text-white rounded-lg font-semibold hover:bg-[#095196] transition flex items-center justify-center gap-2"
                >
                  <span>💼</span>
                  Share on LinkedIn
                </button>
                <button
                  onClick={shareToFacebook}
                  className="px-6 py-3 bg-[#1877F2] text-white rounded-lg font-semibold hover:bg-[#166FE5] transition flex items-center justify-center gap-2"
                >
                  <span>📘</span>
                  Share on Facebook
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPost);
                    alert('✅ Post copied!\n\nPaste it on Instagram:\n1. Open Instagram app on your phone\n2. Tap "+" to create post\n3. Add a photo\n4. Paste caption (long-press → Paste)\n5. Post!');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
                >
                  <span>📸</span>
                  Copy for Instagram
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPost);
                    alert('✅ Post copied!\n\nPaste it on TikTok:\n1. Open TikTok app on your phone\n2. Tap "+" to create\n3. Add a video or photo\n4. Paste caption\n5. Post & go viral! 🔥');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-[#00F2EA] via-[#FF0050] to-[#000000] text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>🎵</span>
                  Copy for TikTok
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPost);
                    alert('✅ Post copied to clipboard!\n\nYou can now paste this on:\n• Pinterest\n• Reddit\n• Threads\n• Snapchat\n• WhatsApp Status\n• Your blog\n• Email newsletter\n• Or any other platform! 🚀');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition flex items-center justify-center gap-2"
                >
                  <span>🌐</span>
                  Copy for Other Platforms
                </button>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Pro Tip:</strong> Feel free to customize the post before sharing. Add your own hashtags, mentions, or personal touch! 🚀
              </p>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Social Media Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📸 Add Photos</h4>
              <p className="text-sm text-blue-800">
                Posts with images get 150% more engagement! Take photos of your booth, products, or team.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">⏰ Post Timing</h4>
              <p className="text-sm text-green-800">
                Best times: Before the show (build excitement), during (live updates), and after (recap & thanks).
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">🤝 Engage</h4>
              <p className="text-sm text-purple-800">
                Reply to comments, tag attendees, and engage with other exhibitors for maximum reach.
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">🔖 Use Hashtags</h4>
              <p className="text-sm text-orange-800">
                Mix event hashtags, industry tags, and #CaptureShowLeads for best visibility!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Social;
