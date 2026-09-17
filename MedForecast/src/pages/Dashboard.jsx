import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { subscribeToResources, updateResource, createInitialResources } from '../services/resourceService';
import ResourceUpdateModal from '../components/dashboard/ResourceUpdateModal';
import { Hospital, Bed, Activity, Droplet, Users, Bell, Menu, X, AlertCircle, Phone, Ambulance } from 'lucide-react';
import { getHospitalProfile } from '../services/hospitalService';
import { subscribeToNotifications } from '../services/notificationService';
import NotificationDropdown from '../components/common/NotificationDropdown';
import Footer from '../components/common/Footer';
import { subscribeToOpenRequests } from '../services/requestService';
 import { subscribeToFacilityRequests, respondToFacilityRequest } from '../services/ambulanceService';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facilityRequests, setFacilityRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [hospitalName, setHospitalName] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  const user = auth.currentUser;

useEffect(() => {
  if (!user) {
    navigate('/login');
    return;
  }

  // Load hospital name
  getHospitalProfile(user.uid).then(profile => {
    if (profile) {
      setHospitalName(profile.name);
    }
  });
  // Subscribe to facility requests
const unsubscribeFacility = subscribeToFacilityRequests(user.uid, (requestsData) => {
  setFacilityRequests(requestsData);
});
  // Subscribe to resources
  const unsubscribeResources = subscribeToResources(user.uid, (resourcesData) => {
    if (resourcesData.length === 0) {
      createInitialResources(user.uid).then(() => {
        console.log('Initial resources created');
      });
    } else {
      setResources(resourcesData);
    }
    setLoading(false);
  });

  // Subscribe to notifications
  const unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
    setNotifications(notificationsData);
  });

  // ADD THIS: Subscribe to recent requests
  const unsubscribeRequests = subscribeToOpenRequests((requestsData) => {
    // Get latest 3 requests
    const latest = requestsData.slice(0, 3);
    setRecentRequests(latest);
  });

  return () => {
    unsubscribeResources();
    unsubscribeNotifications();
    unsubscribeFacility();
    unsubscribeRequests(); // ADD THIS
  };
}, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleUpdateResource = async (updatedResource) => {
    await updateResource(updatedResource.id, updatedResource);
  };

  const handleRespondToFacility = async (request, available) => {
    const message = available 
      ? prompt('Facility is available! Add message (optional):') || 'We have the facility available. Please bring patient immediately.'
      : prompt('Facility not available. Explain reason:') || 'Sorry, facility not available at the moment.';
    
    if (message === null) return; // User cancelled
    
    try {
      await respondToFacilityRequest(request.id, user.uid, hospitalName, {
        available,
        message,
        distance: request.distance
      });
      
      alert(available ? '✅ Response sent! Ambulance will be notified.' : 'Response sent.');
    } catch (error) {
      console.error('Error responding:', error);
      alert('Failed to send response');
    }
  };

  const getIconComponent = (iconName) => {
    const icons = { Bed, Activity, Droplet, Users };
    return icons[iconName] || Bed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Hospital className="w-8 h-8 text-blue-600 mr-2" />
                <h1 className="text-xl font-bold text-gray-800">MedForecast</h1>
              </div>
            </div>
          </div>
        </nav>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-2xl mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 lg:hidden"
              >
                {sidebarOpen ? <X /> : <Menu />}
              </button>
              <Hospital className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">MedForecast</h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationDropdown notifications={notifications} hospitalId={user.uid} />
              <div className="hidden sm:block text-sm text-gray-600">
                {user?.email}
              </div>
              <button 
               onClick={() => navigate('/profile')}
               className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
      >
    Setup Profile
  </button>
  <button 
  onClick={() => navigate('/ambulances')}
  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center"
>
  <Ambulance className="w-5 h-5 mr-2" />
  Ambulances
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
       {/* Header Section */}
<div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
  <h2 className="text-4xl font-bold mb-2">Resource Dashboard</h2>
  <p className="text-blue-100 text-lg">
    {hospitalName || 'Loading...'}
  </p>
  <div className="mt-4 flex items-center space-x-4 text-sm">
    <div className="flex items-center">
      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
      <span>Real-time sync active</span>
    </div>
    <div className="flex items-center">
      <Users className="w-4 h-4 mr-2" />
      <span>Connected to network</span>
    </div>
  </div>
</div>

        {/* Alert Banner */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Network Update:</span> {recentRequests.length} active coordination {recentRequests.length === 1 ? 'request' : 'requests'} in your area
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

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {resources.map((resource) => {
            const percentage = resource.total > 0 ? (resource.available / resource.total) * 100 : 0;
            const Icon = getIconComponent(resource.icon);
            
            return (
              <div key={resource.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-blue-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${resource.color}-100 rounded-lg`}>
                    <Icon className={`w-6 h-6 text-${resource.color}-600`} />
                  </div>
                  <button 
                    onClick={() => setSelectedResource(resource)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Update
                  </button>
                </div>
                
                <h3 className="font-semibold text-gray-700 mb-2">{resource.name}</h3>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className={`text-3xl font-bold text-${resource.color}-600`}>
                      {resource.available}
                    </span>
                    <span className="text-gray-500 text-lg">/{resource.total}</span>
                  </div>
                  <span className={`text-sm font-medium ${percentage > 50 ? 'text-green-600' : 'text-orange-600'}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-${resource.color}-600 h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Facility Requests from Ambulances */}
        {facilityRequests.length > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                  <Ambulance className="w-6 h-6 text-purple-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Urgent Facility Requests</h3>
                  <p className="text-purple-100 text-sm">{facilityRequests.length} ambulance(s) need assistance</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {facilityRequests.slice(0, 3).map(request => (
                <div key={request.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="font-bold text-gray-800">{request.ambulanceName}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          request.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                          request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {request.urgency.toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-purple-600">{request.distance} km away</span>
                      </div>
                      <p className="text-gray-700 font-semibold">Patient: {request.patientCondition}</p>
                      <p className="text-gray-600 text-sm">Need: <span className="font-semibold">{request.requiredFacility.toUpperCase()}</span></p>
                      {request.additionalInfo && (
                        <p className="text-gray-500 text-sm mt-1">"{request.additionalInfo}"</p>
                      )}
                      <p className="text-gray-400 text-xs mt-2 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {request.ambulancePhone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRespondToFacility(request, true)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-semibold text-sm"
                    >
                      ✅ Available
                    </button>
                    <button
                      onClick={() => handleRespondToFacility(request, false)}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 font-semibold text-sm"
                    >
                      ❌ Not Available
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Recent Coordination Requests</h3>
              <button 
                onClick={() => navigate('/requests')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
  
  <div className="space-y-4">
    {recentRequests.length > 0 ? (
      recentRequests.map((request) => {
        const timeAgo = () => {
          const now = new Date();
          const created = new Date(request.createdAt);
          const diffMinutes = Math.floor((now - created) / 60000);
          if (diffMinutes < 1) return 'Just now';
          if (diffMinutes < 60) return `${diffMinutes} min ago`;
          const diffHours = Math.floor(diffMinutes / 60);
          if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          return 'More than a day ago';
        };

        return (
          <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Hospital className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{request.requestingHospitalName}</p>
                <p className="text-sm text-gray-600">{request.quantity} {request.resourceName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    request.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                    request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {request.urgency}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                request.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'matched' ? 'bg-green-100 text-green-800' :
                request.status === 'fulfilled' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {request.status}
              </span>
              {request.status === 'open' && request.requestingHospitalId !== user.uid && (
                <button
                  onClick={() => navigate('/requests')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Respond →
                </button>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No recent requests</p>
        <button 
          onClick={() => navigate('/requests')}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Network Requests
        </button>
      </div>
    )}
  </div>
</div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button 
  onClick={() => navigate('/requests')}
  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
>
  Request Resources
</button>
              <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold">
                Offer Help
              </button>
              <button 
  onClick={() => navigate('/map')}
  className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-semibold"
>
  View Map
</button>
              <button 
  onClick={() => navigate('/analytics')}
  className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-semibold"
>
  Analytics
</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Resource Update Modal */}
      {selectedResource && (
        <ResourceUpdateModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onSave={handleUpdateResource}
        />
      )}
    </div>
  );
}