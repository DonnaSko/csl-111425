import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import TopPerformerBadge from '../components/TopPerformerBadge';

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
  const [realStats, setRealStats] = useState<{
    totalDealers: number;
    totalEmails: number;
    totalTodos: number;
    completedTodos: number;
  } | null>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [benchmarksLoading, setBenchmarksLoading] = useState(false);

  // Social Links State
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    facebook: '',
    linkedIn: '',
    instagram: '',
    tikTok: '',
  });
  const [savingSocialLinks, setSavingSocialLinks] = useState(false);
  const [socialLinksSaved, setSocialLinksSaved] = useState(false);

  useEffect(() => {
    fetchTradeShows();
    loadUserInfo();
    fetchCommunityBenchmarks();
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const response = await api.get('/social-links');
      setSocialLinks(response.data);
    } catch (error) {
      console.error('Failed to load social links:', error);
    }
  };

  const saveSocialLinks = async () => {
    setSavingSocialLinks(true);
    setSocialLinksSaved(false);
    try {
      await api.put('/social-links', socialLinks);
      setSocialLinksSaved(true);
      setTimeout(() => setSocialLinksSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save social links:', error);
      alert('Failed to save social links. Please try again.');
    } finally {
      setSavingSocialLinks(false);
    }
  };

  const fetchCommunityBenchmarks = async () => {
    setBenchmarksLoading(true);
    try {
      const response = await api.get('/reports/community-benchmarks');
      setBenchmarks(response.data);
    } catch (error) {
      console.error('Failed to load community benchmarks:', error);
    } finally {
      setBenchmarksLoading(false);
    }
  };

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

  const fetchRealStats = async (tradeShowId: string) => {
    try {
      // Fetch dealers for the selected trade show
      const dealersResponse = await api.get('/dealers');
      const allDealers = dealersResponse.data.dealers || [];
      
      // Filter dealers for this specific trade show
      const tradeShowDealers = allDealers.filter((dealer: any) => 
        dealer.tradeShows?.some((ts: any) => ts.tradeShowId === tradeShowId)
      );
      
      // Calculate stats
      const totalDealers = tradeShowDealers.length;
      const totalEmails = tradeShowDealers.reduce((sum: number, dealer: any) => 
        sum + (dealer.changeHistory?.filter((ch: any) => ch.fieldName === 'email_sent').length || 0), 0
      );
      const allTodos = tradeShowDealers.reduce((todos: any[], dealer: any) => 
        [...todos, ...(dealer.todos || [])], []
      );
      const totalTodos = allTodos.length;
      const completedTodos = allTodos.filter((todo: any) => todo.completed).length;
      
      setRealStats({
        totalDealers,
        totalEmails,
        totalTodos,
        completedTodos
      });
      
      return {
        totalDealers,
        totalEmails,
        totalTodos,
        completedTodos
      };
    } catch (error) {
      console.error('Failed to load real stats:', error);
      return {
        totalDealers: 0,
        totalEmails: 0,
        totalTodos: 0,
        completedTodos: 0
      };
    }
  };

  const generatePost = async () => {
    setLoading(true);
    
    const show = tradeShows.find(ts => ts.id === selectedShow);
    if (!show) {
      setLoading(false);
      return;
    }

    // Fetch real stats for recap posts
    let stats = realStats;
    if (postType === 'recap') {
      stats = await fetchRealStats(selectedShow);
    }

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
        const totalDealers = stats?.totalDealers || 0;
        const totalEmails = stats?.totalEmails || 0;
        const completedTodos = stats?.completedTodos || 0;
        
        // Build highlights based on real data
        let highlights = '';
        if (totalDealers > 0) {
          highlights += `✨ Connected with ${totalDealers} industry professional${totalDealers !== 1 ? 's' : ''}\n`;
        }
        if (totalEmails > 0) {
          highlights += `✨ Sent ${totalEmails} personalized follow-up${totalEmails !== 1 ? 's' : ''}\n`;
        }
        if (completedTodos > 0) {
          highlights += `✨ Completed ${completedTodos} action item${completedTodos !== 1 ? 's' : ''} and counting\n`;
        }
        if (!highlights) {
          highlights = `✨ Great conversations and connections\n✨ Showcased our innovations\n✨ Built partnerships for the future\n`;
        }
        
        post = `🌟 What an amazing ${show.name}!\n\n` +
               `Thank you to everyone who visited our booth! We had incredible conversations ` +
               `and made valuable connections.\n\n` +
               `Key highlights:\n` +
               highlights +
               `\nAlready looking forward to next year! 🚀\n\n` +
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
      'announcement': '#TradeShow #TradeShows #Networking #BusinessGrowth #B2B',
      'recap': '#TradeShow #TradeShows #EventRecap #Success #Grateful #Community',
      'booth': '#TradeShow #TradeShows #LiveEvent #InPerson #ShowFloor #VisitUs',
      'networking': '#TradeShow #TradeShows #BusinessNetworking #MakeConnections #Collaboration #Partnership',
    };
    
    return trending[type] || '#TradeShow #TradeShows #Business';
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
    // Copy to clipboard as backup
    navigator.clipboard.writeText(generatedPost);
    
    // Try LinkedIn's feed/share endpoint (opens compose dialog)
    // Unfortunately LinkedIn doesn't support text parameter for security reasons
    // But this opens the compose dialog directly
    const linkedInWindow = window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank', 'width=600,height=600');
    
    console.log('[LinkedIn] Window opened:', linkedInWindow ? 'success' : 'blocked');
    
    // Alert AFTER window opens
    alert('✅ Post copied to clipboard!\n✅ LinkedIn opened - compose dialog ready\n\n👉 PASTE YOUR POST: Press Cmd+V (Mac) or Ctrl+V (Windows)\n\nLinkedIn will open their "Start a post" dialog.\nJust paste and click "Post"!');
  };

  const shareToFacebook = () => {
    const encodedUrl = encodeURIComponent('https://www.captureshowleads.com');
    const encodedText = encodeURIComponent(generatedPost);
    
    // Copy to clipboard as backup
    navigator.clipboard.writeText(generatedPost);
    
    // Try Facebook with quote parameter (may or may not work due to Facebook restrictions)
    // Facebook deprecated text pre-fill, but we'll try anyway
    const facebookWindow = window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      '_blank',
      'width=600,height=400'
    );
    
    console.log('[Facebook] Window opened:', facebookWindow ? 'success' : 'blocked');
    
    // Alert AFTER window opens
    alert('✅ Post copied to clipboard!\n✅ Facebook opened\n\n⚠️ NOTE: Facebook may not show your text automatically due to their restrictions.\n\n👉 IF TEXT IS EMPTY: Press Cmd+V (Mac) or Ctrl+V (Windows) to paste!\n\nThen click "Post"!');
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

        {/* Connect Your Social Accounts Section */}
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-xl shadow-lg p-8 mb-8 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🔗 Connect Your Social Accounts</h2>
              <p className="text-gray-600">Add your social media profile URLs to make sharing even easier!</p>
            </div>
            {socialLinksSaved && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <span>✅</span>
                <span className="font-semibold">Saved!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Twitter / X */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>𝕏</span> X / Twitter Profile
              </label>
              <input
                type="url"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                placeholder="https://x.com/yourusername"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Example: https://x.com/captureshowlead</p>
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>📘</span> Facebook Profile
              </label>
              <input
                type="url"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                placeholder="https://facebook.com/yourprofile"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Example: https://facebook.com/profile.php?id=61581979524580</p>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>💼</span> LinkedIn Profile
              </label>
              <input
                type="url"
                value={socialLinks.linkedIn}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedIn: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Example: https://linkedin.com/in/yourname</p>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>📸</span> Instagram Profile
              </label>
              <input
                type="url"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                placeholder="https://instagram.com/yourusername"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Example: https://instagram.com/captureshowleads</p>
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>🎵</span> TikTok Profile
              </label>
              <input
                type="url"
                value={socialLinks.tikTok}
                onChange={(e) => setSocialLinks({ ...socialLinks, tikTok: e.target.value })}
                placeholder="https://tiktok.com/@yourusername"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Example: https://tiktok.com/@captureshowleads</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSocialLinks}
              disabled={savingSocialLinks}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2"
            >
              {savingSocialLinks ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Social Links</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Pro Tip:</strong> Adding your social links makes it easier to share your achievements! 
              When you click to share badges or posts, we'll use these links to help you connect with your audience faster.
            </p>
          </div>
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
              <p className="social-post-text whitespace-pre-wrap leading-relaxed">{generatedPost}</p>
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
                    // Copy to clipboard
                    navigator.clipboard.writeText(generatedPost);
                    
                    // Open Instagram (will open app on mobile, web on desktop)
                    const instagramWindow = window.open('https://www.instagram.com/', '_blank');
                    console.log('[Instagram] Window opened:', instagramWindow ? 'success' : 'blocked');
                    
                    // Alert AFTER opening
                    alert('✅ Post copied to clipboard!\n✅ Instagram opened in new window\n\n📱 On Mobile:\n1. Instagram app should open automatically\n2. Tap "+" to create post\n3. Add a photo\n4. Paste caption (long-press → Paste)\n5. Post!\n\n💻 On Desktop:\n• Instagram web doesn\'t support posting\n• Use your phone\'s Instagram app instead\n• Text is already copied!');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
                >
                  <span>📸</span>
                  Share on Instagram
                </button>
                <button
                  onClick={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(generatedPost);
                    
                    // Open TikTok (will open app on mobile, web on desktop)
                    const tiktokWindow = window.open('https://www.tiktok.com/', '_blank');
                    console.log('[TikTok] Window opened:', tiktokWindow ? 'success' : 'blocked');
                    
                    // Alert AFTER opening
                    alert('✅ Post copied to clipboard!\n✅ TikTok opened in new window\n\n📱 On Mobile:\n1. TikTok app should open automatically\n2. Tap "+" to create\n3. Add a video or photo\n4. Paste caption\n5. Post & go viral! 🔥\n\n💻 On Desktop:\n• TikTok web has limited posting\n• Use your phone\'s TikTok app for best results\n• Text is already copied!');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-[#00F2EA] via-[#FF0050] to-[#000000] text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>🎵</span>
                  Share on TikTok
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

        {/* Your Achievement Badges */}
        {!benchmarksLoading && benchmarks && (
          <div className="mt-8 space-y-8">
            {/* EARNED BADGES - Worth Bragging About! */}
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">🏆 Your Achievement Badges</h3>
                <p className="text-gray-600 mb-2">
                  You've earned these badges - share your achievements on social media!
                </p>
                <p className="text-sm text-gray-500">
                  📱 <strong>How to share:</strong> 1) Click a badge 2) Choose your platform 3) Paste the badge image from Downloads 4) Post!
                </p>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-8">
                {(() => {
                  if (!benchmarks.yourPercentiles) return null;
                  
                  // Store badges in parent scope so both sections can access them
                  const earnedBadgesArray: JSX.Element[] = [];
                  const badgesToEarnArray: JSX.Element[] = [];
                
                  // Calculate overall performance percentile
                  const avgPercentile = Math.round(
                    (benchmarks.yourPercentiles.quality +
                     benchmarks.yourPercentiles.taskCompletion +
                     benchmarks.yourPercentiles.speed +
                     benchmarks.yourPercentiles.emails +
                     benchmarks.yourPercentiles.coverage) / 5
                  );
                
                const earnedBadges = earnedBadgesArray;
                const badgesToEarn = badgesToEarnArray;
                
                // Calculate overall score (average of all metrics normalized to 0-100 scale)
                const yourOverall = benchmarks.yourMetrics ? Math.round(
                  ((benchmarks.yourMetrics.avgQuality / 10 * 100) +
                   benchmarks.yourMetrics.taskCompletionRate +
                   benchmarks.yourMetrics.leadCoverageRate) / 3
                ) : 0;
                const communityOverall = benchmarks.communityAverages ? Math.round(
                  ((benchmarks.communityAverages.avgQuality / 10 * 100) +
                   benchmarks.communityAverages.taskCompletionRate +
                   benchmarks.communityAverages.leadCoverageRate) / 3
                ) : 0;
                
                // EARNED: Overall Performance badge if >= 75% (truly worth bragging about!)
                if (avgPercentile >= 75) {
                  earnedBadges.push(
                    <div key="overall" className="text-center">
                      <TopPerformerBadge 
                        percentile={avgPercentile}
                        metric="Overall Performance"
                        rank={
                          avgPercentile >= 90 ? 'ELITE' : 'EXCELLENT'
                        }
                        actualValue={yourOverall}
                        communityAverage={communityOverall}
                        metricUnit="%"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Overall</p>
                    </div>
                  );
                } else if (avgPercentile > 0) {
                  badgesToEarn.push(
                    <div key="overall-earn" className="text-center opacity-60">
                      <TopPerformerBadge 
                        percentile={avgPercentile}
                        metric="Overall Performance"
                        rank={'STRONG'}
                        actualValue={yourOverall}
                        communityAverage={communityOverall}
                        metricUnit="%"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Overall</p>
                      <p className="text-xs text-gray-500 mt-1">Top {avgPercentile}% - Keep going!</p>
                    </div>
                  );
                }
                
                // EARNED: Lead Quality Badge if >= 75%
                if (benchmarks.yourPercentiles.quality >= 75) {
                  earnedBadges.push(
                    <div key="quality" className="text-center">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.quality}
                        metric="Lead Quality"
                        rank={
                          benchmarks.yourPercentiles.quality >= 90 ? 'ELITE' : 'EXCELLENT'
                        }
                        actualValue={benchmarks.yourMetrics?.avgQuality}
                        communityAverage={benchmarks.communityAverages?.avgQuality}
                        metricUnit="/10"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Lead Quality</p>
                    </div>
                  );
                } else if (benchmarks.yourPercentiles.quality > 0) {
                  badgesToEarn.push(
                    <div key="quality-earn" className="text-center opacity-60">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.quality}
                        metric="Lead Quality"
                        rank={'STRONG'}
                        actualValue={benchmarks.yourMetrics?.avgQuality}
                        communityAverage={benchmarks.communityAverages?.avgQuality}
                        metricUnit="/10"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Lead Quality</p>
                      <p className="text-xs text-gray-500 mt-1">Top {benchmarks.yourPercentiles.quality}% - Keep improving!</p>
                    </div>
                  );
                }
                
                // EARNED: Speed to Follow-Up Badge if >= 75%
                if (benchmarks.yourPercentiles.speed >= 75) {
                  earnedBadges.push(
                    <div key="speed" className="text-center">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.speed}
                        metric="Follow-Up Speed"
                        rank={benchmarks.yourPercentiles.speed >= 90 ? 'ELITE' : 'EXCELLENT'}
                        actualValue={benchmarks.yourMetrics?.speedToFollowUp}
                        communityAverage={benchmarks.communityAverages?.speedToFollowUp}
                        metricUnit=" hrs"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Follow-Up Speed</p>
                    </div>
                  );
                } else if (benchmarks.yourPercentiles.speed > 0) {
                  badgesToEarn.push(
                    <div key="speed-earn" className="text-center opacity-60">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.speed}
                        metric="Follow-Up Speed"
                        rank={'STRONG'}
                        actualValue={benchmarks.yourMetrics?.speedToFollowUp}
                        communityAverage={benchmarks.communityAverages?.speedToFollowUp}
                        metricUnit=" hrs"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Follow-Up Speed</p>
                      <p className="text-xs text-gray-500 mt-1">Top {benchmarks.yourPercentiles.speed}% - Speed up!</p>
                    </div>
                  );
                }
                
                // EARNED: Email Engagement Badge if >= 75%
                if (benchmarks.yourPercentiles.emails >= 75) {
                  earnedBadges.push(
                    <div key="emails" className="text-center">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.emails}
                        metric="Email Engagement"
                        rank={benchmarks.yourPercentiles.emails >= 90 ? 'ELITE' : 'EXCELLENT'}
                        actualValue={benchmarks.yourMetrics?.emailsPerLead}
                        communityAverage={benchmarks.communityAverages?.emailsPerLead}
                        metricUnit=" per lead"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Email Engagement</p>
                    </div>
                  );
                } else if (benchmarks.yourPercentiles.emails > 0) {
                  badgesToEarn.push(
                    <div key="emails-earn" className="text-center opacity-60">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.emails}
                        metric="Email Engagement"
                        rank={'STRONG'}
                        actualValue={benchmarks.yourMetrics?.emailsPerLead}
                        communityAverage={benchmarks.communityAverages?.emailsPerLead}
                        metricUnit=" per lead"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Email Engagement</p>
                      <p className="text-xs text-gray-500 mt-1">Top {benchmarks.yourPercentiles.emails}% - Send more!</p>
                    </div>
                  );
                }
                
                // EARNED: Task Completion Badge if >= 75%
                if (benchmarks.yourPercentiles.taskCompletion >= 75) {
                  earnedBadges.push(
                    <div key="tasks" className="text-center">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.taskCompletion}
                        metric="Task Completion"
                        rank={benchmarks.yourPercentiles.taskCompletion >= 90 ? 'ELITE' : 'EXCELLENT'}
                        actualValue={benchmarks.yourMetrics?.taskCompletionRate}
                        communityAverage={benchmarks.communityAverages?.taskCompletionRate}
                        metricUnit="%"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Task Completion</p>
                    </div>
                  );
                } else if (benchmarks.yourPercentiles.taskCompletion > 0) {
                  badgesToEarn.push(
                    <div key="tasks-earn" className="text-center opacity-60">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.taskCompletion}
                        metric="Task Completion"
                        rank={'STRONG'}
                        actualValue={benchmarks.yourMetrics?.taskCompletionRate}
                        communityAverage={benchmarks.communityAverages?.taskCompletionRate}
                        metricUnit="%"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Task Completion</p>
                      <p className="text-xs text-gray-500 mt-1">Top {benchmarks.yourPercentiles.taskCompletion}% - Complete more!</p>
                    </div>
                  );
                }
                
                // EARNED: Lead Coverage Badge if >= 75%
                if (benchmarks.yourPercentiles.coverage >= 75) {
                  earnedBadges.push(
                    <div key="coverage" className="text-center">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.coverage}
                        metric="Lead Coverage"
                        rank={benchmarks.yourPercentiles.coverage >= 90 ? 'ELITE' : 'EXCELLENT'}
                        actualValue={benchmarks.yourMetrics?.leadCoverageRate}
                        communityAverage={benchmarks.communityAverages?.leadCoverageRate}
                        metricUnit="%"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Lead Coverage</p>
                    </div>
                  );
                } else if (benchmarks.yourPercentiles.coverage > 0) {
                  badgesToEarn.push(
                    <div key="coverage-earn" className="text-center opacity-60">
                      <TopPerformerBadge 
                        percentile={benchmarks.yourPercentiles.coverage}
                        metric="Lead Coverage"
                        rank={'STRONG'}
                        actualValue={benchmarks.yourMetrics?.leadCoverageRate}
                        communityAverage={benchmarks.communityAverages?.leadCoverageRate}
                        metricUnit="%"
                      />
                      <p className="text-sm font-semibold text-gray-700 mt-2">Lead Coverage</p>
                      <p className="text-xs text-gray-500 mt-1">Top {benchmarks.yourPercentiles.coverage}% - Cover more!</p>
                    </div>
                  );
                }
                
                // Show earned badges or encouragement
                if (earnedBadges.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-xl font-semibold text-gray-700 mb-2">
                        🎯 You're on your way!
                      </p>
                      <p className="text-gray-600">
                        Earn badges by reaching the top 25% in any category.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Keep working on your metrics below! 💪
                      </p>
                    </div>
                  );
                }
                
                // Store badgesToEarn globally to render in second section
                (window as any)._badgesToEarn = badgesToEarn;
                
                return earnedBadges;
              })()}
            </div>

            <div className="mt-6 bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700 text-center">
                <strong>💡 Tip:</strong> Click any badge to share your achievement on social media! 
                Your badge will automatically download, and you'll get instructions for each platform. 🚀
              </p>
            </div>
          </div>
          
          {/* Badges to Earn Section - Aspirational */}
          {((window as any)._badgesToEarn && (window as any)._badgesToEarn.length > 0) && (
            <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 rounded-xl shadow-lg p-8 border-2 border-gray-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-700 mb-2">🎯 Work to Earn These Badges Too!</h3>
                <p className="text-gray-600">
                  You're making progress - keep improving to unlock these achievements!
                </p>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-8">
                {(window as any)._badgesToEarn}
              </div>

              <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800 text-center">
                  <strong>💪 Keep Going!</strong> Reach the top 25% in any metric to earn a shareable badge!
                </p>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </Layout>
  );
};

export default Social;
