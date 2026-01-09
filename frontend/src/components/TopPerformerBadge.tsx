import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

interface TopPerformerBadgeProps {
  percentile: number;
  metric?: string; // Optional, for display purposes
  rank: 'ELITE' | 'EXCELLENT' | 'STRONG' | 'TOP_PERFORMER';
}

const TopPerformerBadge = ({ percentile, metric, rank }: TopPerformerBadgeProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  // Check if user has previously given consent
  const hasGivenConsent = () => {
    return localStorage.getItem('badge_share_consent') === 'true' || consentGiven;
  };

  const handleBadgeClick = () => {
    if (!hasGivenConsent()) {
      setShowConsentModal(true);
    } else {
      setShowShareModal(true);
    }
  };

  const handleConsentAccept = () => {
    setConsentGiven(true);
    if (dontShowAgain) {
      localStorage.setItem('badge_share_consent', 'true');
    }
    setShowConsentModal(false);
    setShowShareModal(true);
  };

  // Auto-download badge as PNG image
  const downloadBadgeImage = async (): Promise<string> => {
    if (!badgeRef.current) return '';
    
    try {
      const canvas = await html2canvas(badgeRef.current, {
        backgroundColor: null,
        scale: 3, // Higher quality
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Auto-download the image
      const link = document.createElement('a');
      const metricName = metric ? metric.replace(/\s+/g, '-') : 'Badge';
      link.download = `CSL-Top-Performer-${metricName}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate badge image:', error);
      return '';
    }
  };

  const getBadgeColor = () => {
    switch (rank) {
      case 'ELITE':
        return 'from-yellow-400 via-amber-500 to-orange-500';
      case 'EXCELLENT':
        return 'from-purple-500 via-pink-500 to-red-500';
      case 'STRONG':
        return 'from-blue-500 via-indigo-500 to-purple-500';
      case 'TOP_PERFORMER':
        return 'from-green-500 via-teal-500 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getEmoji = () => {
    switch (rank) {
      case 'ELITE':
        return '🌟';
      case 'EXCELLENT':
        return '🔥';
      case 'STRONG':
        return '💪';
      case 'TOP_PERFORMER':
        return '🏆';
      default:
        return '⭐';
    }
  };

  const getRankText = () => {
    switch (rank) {
      case 'ELITE':
        return 'ELITE';
      case 'EXCELLENT':
        return 'EXCELLENT';
      case 'STRONG':
        return 'STRONG';
      case 'TOP_PERFORMER':
        return 'TOP PERFORMER';
      default:
        return 'ACHIEVER';
    }
  };

  const getShareText = (platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok' | 'copy' = 'copy') => {
    const topPercent = 100 - percentile;
    const emoji = getEmoji();
    const metricPart = metric ? ` for ${metric}` : '';
    
    // Twitter/X - mention @captureshowlead
    if (platform === 'twitter') {
      return `I'm in the top ${topPercent}%${metricPart} on @captureshowlead! ${emoji} #CSL #TradeShows #LeadManagement #SalesExcellence`;
    }
    
    // Facebook - include page reference
    if (platform === 'facebook') {
      return `I'm in the top ${topPercent}%${metricPart} on Capture Show Leads! ${emoji}\n\nFollow them: facebook.com/profile.php?id=61581979524580\n\n#CSL #TradeShows #LeadManagement #SalesExcellence`;
    }
    
    // LinkedIn - professional tone with company page
    if (platform === 'linkedin') {
      return `Proud to be in the top ${topPercent}%${metricPart} of users on Capture Show Leads! ${emoji}\n\nFollow Capture Show Leads: linkedin.com/company/109237009\n\n#TradeShows #LeadManagement #SalesExcellence #B2B #SaaS`;
    }
    
    // Instagram - include @mention and extra hashtags
    if (platform === 'instagram') {
      return `I'm in the top ${topPercent}%${metricPart} on @captureshowleads! ${emoji}\n\n#CSL #TradeShows #LeadManagement #SalesExcellence #B2B #TradeShowLife #LeadGeneration`;
    }
    
    // TikTok - short, punchy, hashtag-heavy for viral potential
    if (platform === 'tiktok') {
      return `I'm in the top ${topPercent}%${metricPart} on @captureshowleads! ${emoji}\n\n#CSL #TradeShows #LeadManagement #B2B #Sales #TradeShowLife #LeadGen #BusinessTips #SalesSuccess #Entrepreneur`;
    }
    
    // Copy/default - include all social handles
    return `I'm in the top ${topPercent}%${metricPart} on Capture Show Leads! ${emoji}\n\nFollow us:\nX/Twitter: @captureshowlead\nInstagram: @captureshowleads\nTikTok: @captureshowleads\nLinkedIn: linkedin.com/company/109237009\nFacebook: facebook.com/profile.php?id=61581979524580\n\n#CSL #TradeShows #LeadManagement`;
  };

  const shareToFacebook = async () => {
    // Auto-download badge image
    await downloadBadgeImage();
    
    // Copy text to clipboard
    const text = `${getShareText('facebook')}\n\nhttps://www.captureshowleads.com`;
    navigator.clipboard.writeText(text);
    
    // Simplified instructions
    alert('🚀 Ready to Share on Facebook!\n\n✅ Badge image downloaded\n✅ Text copied to clipboard\n\nNext steps:\n1. Facebook will open\n2. Paste the text\n3. Click "Photo/Video" 🖼️\n4. Select badge from Downloads\n5. Post! 🎉');
    
    const encodedText = encodeURIComponent(getShareText('facebook'));
    const encodedUrl = encodeURIComponent('https://www.captureshowleads.com');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const shareToTwitter = async () => {
    // Auto-download badge image
    await downloadBadgeImage();
    
    // Copy text to clipboard
    const text = `${getShareText('twitter')}\n\nhttps://www.captureshowleads.com`;
    navigator.clipboard.writeText(text);
    
    // Simplified instructions
    alert('🚀 Ready to Share on Twitter/X!\n\n✅ Badge image downloaded to your computer\n✅ Text copied to clipboard\n\nNext steps:\n1. Twitter/X will open\n2. Paste the text (Cmd+V or Ctrl+V)\n3. Click the image icon 🖼️\n4. Select the badge image from your Downloads\n5. Post! 🎉');
    
    const encodedText = encodeURIComponent(getShareText('twitter'));
    const encodedUrl = encodeURIComponent('https://www.captureshowleads.com');
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const shareToLinkedIn = async () => {
    // Auto-download badge image
    await downloadBadgeImage();
    
    const url = encodeURIComponent('https://www.captureshowleads.com');
    const linkedInText = `${getShareText('linkedin')}\n\nhttps://www.captureshowleads.com`;
    navigator.clipboard.writeText(linkedInText);
    
    alert('🚀 Ready to Share on LinkedIn!\n\n✅ Badge image downloaded\n✅ Text copied to clipboard\n\nNext steps:\n1. LinkedIn will open\n2. Click "Start a post"\n3. Paste the text\n4. Click image icon 🖼️\n5. Select badge from Downloads\n6. Post! 🎉');
    
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=600');
    setShowShareModal(false);
  };

  const copyShareText = async () => {
    // Auto-download badge image
    await downloadBadgeImage();
    
    const text = `${getShareText('copy')}\n\nhttps://www.captureshowleads.com`;
    navigator.clipboard.writeText(text);
    alert('✅ Ready to Share Anywhere!\n\n✅ Badge image downloaded\n✅ Text copied to clipboard\n\nThis works for all platforms:\n• X/Twitter\n• Instagram\n• TikTok\n• LinkedIn\n• Facebook\n\nJust paste text + attach badge from Downloads! 🚀');
    setShowShareModal(false);
  };

  const copyForInstagram = async () => {
    // Auto-download badge image
    await downloadBadgeImage();
    
    const text = `${getShareText('instagram')}\n\nhttps://www.captureshowleads.com`;
    navigator.clipboard.writeText(text);
    alert('📸 Ready for Instagram!\n\n✅ Badge image downloaded\n✅ Text copied\n\nNext steps:\n1. Open Instagram app\n2. Create post\n3. Select badge from Photos\n4. Paste caption\n5. Tag @captureshowleads\n6. Post! 🚀');
    setShowShareModal(false);
  };

  const copyForTikTok = async () => {
    // Auto-download badge image
    await downloadBadgeImage();
    
    const text = `${getShareText('tiktok')}\n\nhttps://www.captureshowleads.com`;
    navigator.clipboard.writeText(text);
    alert('🎵 Ready for TikTok!\n\n✅ Badge image downloaded\n✅ Text copied\n\nNext steps:\n1. Open TikTok app\n2. Create video with badge image\n3. Paste caption\n4. Tag @captureshowleads\n5. Post & go viral! 🔥');
    setShowShareModal(false);
  };

  return (
    <>
      {/* Badge Button */}
      <button
        onClick={handleBadgeClick}
        className={`relative group transform hover:scale-110 transition-all duration-300 cursor-pointer`}
        title="Click to share your achievement!"
      >
        <div 
          ref={badgeRef}
          className={`w-32 h-32 rounded-full bg-gradient-to-br ${getBadgeColor()} p-1 shadow-2xl hover:shadow-3xl`}
        >
          <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
            <div className="text-4xl mb-1">{getEmoji()}</div>
            <div className="text-xs font-bold text-gray-800 text-center leading-tight">
              {getRankText()}
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5">
              Top {100 - percentile}%
            </div>
          </div>
        </div>
        
        {/* Hover tooltip */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Click to share! 🚀
        </div>
      </button>

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{getEmoji()}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Share Your Achievement!
              </h2>
              <p className="text-gray-600">
                Before you share your Top Performer badge, please review:
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-bold text-blue-900 mb-3">By sharing this badge, you consent to:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Public posting on your chosen social media platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>CSL may engage with your post (like, comment, share)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>CSL may use your public post as a testimonial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>The post will include CSL branding and a link to our website</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Your Privacy:</strong> The shared badge does NOT include your company name, 
                specific metrics, or any sensitive data unless you manually add them.
              </p>
              <p className="text-xs text-gray-600">
                You can delete shared posts anytime on the social media platform. 
                To withdraw consent for CSL to use your post, contact privacy@captureshowleads.com
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm text-gray-700">Don't show this again</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConsentAccept}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${getBadgeColor()} text-white rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105`}
              >
                Share Now 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{getEmoji()}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Share Your Badge!
              </h2>
              <p className="text-gray-600">
                Choose where to share your achievement
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border-2 border-purple-200">
              <p className="text-sm text-gray-800 mb-3 italic">
                "{getShareText('twitter')}"
              </p>
              <div className="space-y-1">
                <a 
                  href="https://www.captureshowleads.com" 
                  className="text-xs text-blue-600 hover:underline block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔗 www.captureshowleads.com
                </a>
                <p className="text-xs text-gray-600">
                  📱 X/Twitter will tag @captureshowlead so we can engage with your post!
                </p>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={shareToFacebook}
                className="w-full px-6 py-3 bg-[#1877F2] text-white rounded-lg font-semibold hover:bg-[#166FE5] transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">📘</span>
                Share on Facebook
              </button>
              
              <button
                onClick={shareToTwitter}
                className="w-full px-6 py-3 bg-[#1DA1F2] text-white rounded-lg font-semibold hover:bg-[#1A94DA] transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">🐦</span>
                Share on Twitter/X
              </button>
              
              <button
                onClick={shareToLinkedIn}
                className="w-full px-6 py-3 bg-[#0A66C2] text-white rounded-lg font-semibold hover:bg-[#095196] transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">💼</span>
                Share on LinkedIn
              </button>
              
              <button
                onClick={copyForInstagram}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">📸</span>
                Copy for Instagram
              </button>
              
              <button
                onClick={copyForTikTok}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#00F2EA] via-[#FF0050] to-[#000000] text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">🎵</span>
                Copy for TikTok
              </button>
              
              <button
                onClick={copyShareText}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">📋</span>
                Copy Text (All Platforms)
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Close
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Your post will be public on the chosen platform
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TopPerformerBadge;
