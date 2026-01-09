import { useNavigate } from 'react-router-dom';

interface Dealer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  tradeShows?: Array<{
    tradeShow: {
      id: string;
      name: string;
      startDate: string | null;
    };
  }>;
  todos?: Array<{
    id: string;
    title: string;
    completed: boolean;
    followUp: boolean;
  }>;
  changeHistory?: Array<{
    fieldName: string;
  }>;
}

interface DealerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealers: Dealer[];
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

const DealerListModal = ({ isOpen, onClose, dealers, title, subtitle, icon, color }: DealerListModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Sort dealers: by TradeShow (most current first), then Dealer name, then Contact name
  const sortedDealers = [...dealers].sort((a, b) => {
    // Get most recent tradeshow for each dealer
    const getTradeshowDate = (dealer: Dealer) => {
      if (!dealer.tradeShows || dealer.tradeShows.length === 0) return new Date(0);
      const dates = dealer.tradeShows
        .map(ts => ts.tradeShow.startDate ? new Date(ts.tradeShow.startDate) : new Date(0))
        .sort((d1, d2) => d2.getTime() - d1.getTime()); // Most recent first
      return dates[0];
    };

    const getTradeshowName = (dealer: Dealer) => {
      if (!dealer.tradeShows || dealer.tradeShows.length === 0) return '';
      const mostRecent = dealer.tradeShows
        .sort((ts1, ts2) => {
          const date1 = ts1.tradeShow.startDate ? new Date(ts1.tradeShow.startDate) : new Date(0);
          const date2 = ts2.tradeShow.startDate ? new Date(ts2.tradeShow.startDate) : new Date(0);
          return date2.getTime() - date1.getTime();
        })[0];
      return mostRecent.tradeShow.name;
    };

    // 1. Sort by TradeShow date (most current first)
    const dateA = getTradeshowDate(a);
    const dateB = getTradeshowDate(b);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime(); // Most recent first
    }

    // 2. If same tradeshow date, sort by TradeShow name alphabetically
    const tradeshowA = getTradeshowName(a);
    const tradeshowB = getTradeshowName(b);
    if (tradeshowA !== tradeshowB) {
      return tradeshowA.localeCompare(tradeshowB);
    }

    // 3. If same tradeshow, sort by Dealer company name
    if (a.companyName !== b.companyName) {
      return a.companyName.localeCompare(b.companyName);
    }

    // 4. If same company, sort by contact name
    const contactA = a.contactName || '';
    const contactB = b.contactName || '';
    return contactA.localeCompare(contactB);
  });

  const getMostRecentTradeshow = (dealer: Dealer) => {
    if (!dealer.tradeShows || dealer.tradeShows.length === 0) return 'No Tradeshow';
    const sorted = dealer.tradeShows.sort((ts1, ts2) => {
      const date1 = ts1.tradeShow.startDate ? new Date(ts1.tradeShow.startDate) : new Date(0);
      const date2 = ts2.tradeShow.startDate ? new Date(ts2.tradeShow.startDate) : new Date(0);
      return date2.getTime() - date1.getTime();
    });
    return sorted[0].tradeShow.name;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${color} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="text-5xl">{icon}</div>
              <div>
                <h2 className="text-3xl font-bold">{title}</h2>
                <p className="text-sm opacity-90 mt-1">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dealer List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedDealers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-semibold">All caught up!</p>
              <p className="text-sm mt-2">No dealers need this action right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDealers.map((dealer) => (
                <button
                  key={dealer.id}
                  onClick={() => {
                    navigate(`/dealers/${dealer.id}`);
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          🎪 {getMostRecentTradeshow(dealer)}
                        </span>
                        {dealer.tradeShows && dealer.tradeShows.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {formatDate(dealer.tradeShows.sort((ts1, ts2) => {
                              const date1 = ts1.tradeShow.startDate ? new Date(ts1.tradeShow.startDate) : new Date(0);
                              const date2 = ts2.tradeShow.startDate ? new Date(ts2.tradeShow.startDate) : new Date(0);
                              return date2.getTime() - date1.getTime();
                            })[0].tradeShow.startDate)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                        {dealer.companyName}
                      </h3>
                      {dealer.contactName && (
                        <p className="text-sm text-gray-600 mt-1">
                          👤 {dealer.contactName}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2">
                        {dealer.email && (
                          <span className="text-xs text-gray-500">
                            📧 {dealer.email}
                          </span>
                        )}
                        {dealer.phone && (
                          <span className="text-xs text-gray-500">
                            📞 {dealer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-blue-500 group-hover:translate-x-1 transition">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <p className="text-sm text-gray-600 text-center">
            Click any dealer to view details • {sortedDealers.length} dealer{sortedDealers.length !== 1 ? 's' : ''} shown
          </p>
        </div>
      </div>
    </div>
  );
};

export default DealerListModal;
