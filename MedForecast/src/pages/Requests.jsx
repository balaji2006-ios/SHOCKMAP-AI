import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getHospitalProfile } from '../services/hospitalService';
import { subscribeToNotifications } from '../services/notificationService';
import NotificationDropdown from '../components/common/NotificationDropdown';
import Footer from '../components/common/Footer';
import { 
  subscribeToOpenRequests, 
  subscribeToMyRequests,
  createRequest, 
  respondToRequest,
  fulfillRequest,
  cancelRequest,
  calculateDistance 
} from '../services/requestService';
import CreateRequestModal from '../components/dashboard/CreateRequestModal';
import RequestCard from '../components/dashboard/RequestCard';
import { Hospital, Plus, Filter, AlertCircle } from 'lucide-react';

export default function Requests() {
  const [openRequests, setOpenRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [hospitalProfile, setHospitalProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('network'); // 'network' or 'mine'
  const [filterUrgency, setFilterUrgency] = useState('all');
  const navigate = useNavigate();
  
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadData();
  }, [user, navigate]);

const loadData = async () => {
  try {
    // Load hospital profile first
    const profile = await getHospitalProfile(user.uid);
    setHospitalProfile(profile);

    // Subscribe to ALL open requests (for network view)
    const unsubscribeOpen = subscribeToOpenRequests((requests) => {
      console.log('All open requests received:', requests); // Debug log
      
      // Filter out own requests for network view
      const othersRequests = requests.filter(r => r.requestingHospitalId !== user.uid);
      console.log('Others requests after filter:', othersRequests); // Debug log
      
      setOpenRequests(othersRequests);
    });

    // Subscribe to MY requests (for "My Requests" tab)
    const unsubscribeMine = subscribeToMyRequests(user.uid, (requests) => {
      console.log('My requests received:', requests); // Debug log
      setMyRequests(requests);
    });

    // Subscribe to notifications
    const unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
      setNotifications(notificationsData);
    });

    setLoading(false);

    return () => {
      unsubscribeOpen();
      unsubscribeMine();
      unsubscribeNotifications();
    };
  } catch (error) {
    console.error('Error loading requests:', error);
    setLoading(false);
  }
};

  const handleCreateRequest = async (formData) => {
    try {
      await createRequest({
        ...formData,
        requestingHospitalId: user.uid,
        requestingHospitalName: hospitalProfile.name,
        phone: hospitalProfile.phone,
        location: {
          lat: parseFloat(hospitalProfile.latitude),
          lng: parseFloat(hospitalProfile.longitude)
        }
      });
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  };

const handleRespondToRequest = async (request) => {
  // Check if profile is loaded
  if (!hospitalProfile || !hospitalProfile.name) {
    alert('⚠️ Please complete your hospital profile first');
    navigate('/profile');
    return;
  }
  
  if (window.confirm(`Offer help to ${request.requestingHospitalName}?\n\nThey need ${request.quantity} ${request.resourceName}`)) {
    try {
      await respondToRequest(request.id, user.uid, hospitalProfile.name, request);
      alert('✅ Response sent! The requesting hospital has been notified.');
    } catch (error) {
      console.error('Error responding:', error);
      alert(`❌ Failed: ${error.message}`);
    }
  }
};

  const handleFulfillRequest = async (requestId) => {
    if (window.confirm('Mark this request as fulfilled?')) {
      try {
        await fulfillRequest(requestId);
      } catch (error) {
        console.error('Error fulfilling request:', error);
        alert('Failed to fulfill request');
      }
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (window.confirm('Cancel this request?')) {
      try {
        await cancelRequest(requestId);
      } catch (error) {
        console.error('Error cancelling request:', error);
        alert('Failed to cancel request');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // Add distance to requests
  const requestsWithDistance = openRequests.map(request => {
    if (hospitalProfile && hospitalProfile.latitude && request.location) {
      const distance = calculateDistance(
        parseFloat(hospitalProfile.latitude),
        parseFloat(hospitalProfile.longitude),
        parseFloat(request.location.lat),
        parseFloat(request.location.lng)
      );
      return { ...request, distance };
    }
    return request;
  }).sort((a, b) => {
    // Sort by urgency first, then distance
    const urgencyOrder = { critical: 0, high: 1, normal: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return (a.distance || 999) - (b.distance || 999);
  });

  // Filter by urgency
  const filteredRequests = filterUrgency === 'all' 
    ? requestsWithDistance 
    : requestsWithDistance.filter(r => r.urgency === filterUrgency);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Hospital className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">MedForecast - Requests</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Dashboard
              </button>
              <NotificationDropdown notifications={notifications} hospitalId={user.uid} />
              <button 
                onClick={() => navigate('/map')}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Map
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Resource Coordination</h2>
            <p className="text-gray-600">{hospitalProfile?.name || 'Loading...'}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Request Resources
          </button>
        </div>

        {/* Alert if no profile */}
        {!hospitalProfile || !hospitalProfile.latitude && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Network Update:</span> {openRequests.length} active coordination {openRequests.length === 1 ? 'request' : 'requests'} in your area
                </p>
              </div>
              <div className="ml-auto">
                <button 
                  onClick={() => navigate('/requests')}
                  className="text-sm text-yellow-800 hover:text-yellow-900 font-semibold underline"
                >
                  View Requests →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('network')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeTab === 'network'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Network Requests ({requestsWithDistance.length})
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeTab === 'mine'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Requests ({myRequests.length})
              </button>
            </div>
          </div>

          {/* Filters - Only for network tab */}
          {activeTab === 'network' && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by urgency:</span>
                <div className="flex space-x-2">
                  {['all', 'critical', 'high', 'normal'].map(urgency => (
                    <button
                      key={urgency}
                      onClick={() => setFilterUrgency(urgency)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        filterUrgency === urgency
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeTab === 'network' ? (
            filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  distance={request.distance}
                  isOwn={false}
                  onRespond={handleRespondToRequest}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No requests found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {filterUrgency !== 'all' 
                    ? 'Try changing the filter or check back later'
                    : 'Check back later for coordination opportunities'}
                </p>
              </div>
            )
          ) : (
            myRequests.length > 0 ? (
              myRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isOwn={true}
                  onFulfill={handleFulfillRequest}
                  onCancel={handleCancelRequest}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">You haven't created any requests yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first request
                </button>
              </div>
            )
          )}
        </div>

        <Footer />

      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <CreateRequestModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRequest}
          hospitalProfile={hospitalProfile}
        />
      )}
    </div>
  );
}