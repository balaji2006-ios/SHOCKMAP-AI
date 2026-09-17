import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getHospitalProfile } from '../services/hospitalService';
import { 
  subscribeToAvailableAmbulances,
  createAmbulanceRequest,
  subscribeToHospitalAmbulanceRequests,
  calculateDistance
} from '../services/ambulanceService';
import { subscribeToNotifications } from '../services/notificationService';
import NotificationDropdown from '../components/common/NotificationDropdown';
import { Hospital, Ambulance, MapPin, Phone, Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react';

export default function Ambulances() {
  const [hospitalProfile, setHospitalProfile] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    patientCondition: '',
    urgency: 'high',
    pickupAddress: '',
    destinationAddress: '',
    notes: ''
  });
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let unsubscribeAmbulances, unsubscribeRequests, unsubscribeNotifications;

    const loadData = async () => {
      try {
        const profile = await getHospitalProfile(user.uid);
        setHospitalProfile(profile);

        unsubscribeAmbulances = subscribeToAvailableAmbulances((ambulanceData) => {
          if (profile && profile.latitude) {
            const withDistance = ambulanceData.map(amb => ({
              ...amb,
              distance: calculateDistance(
                parseFloat(profile.latitude),
                parseFloat(profile.longitude),
                parseFloat(amb.currentLocation.lat),
                parseFloat(amb.currentLocation.lng)
              )
            })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            setAmbulances(withDistance);
          } else {
            setAmbulances(ambulanceData);
          }
        });

        unsubscribeRequests = subscribeToHospitalAmbulanceRequests(user.uid, (requestsData) => {
          setMyRequests(requestsData);
        });

        unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
          setNotifications(notificationsData);
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading ambulances:', error);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeAmbulances) unsubscribeAmbulances();
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [user, navigate]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!hospitalProfile || !hospitalProfile.latitude) {
      alert('⚠️ Please complete your hospital profile first');
      navigate('/profile');
      return;
    }

    try {
      await createAmbulanceRequest({
        ...requestForm,
        requestingHospitalId: user.uid,
        hospitalName: hospitalProfile.name,
        hospitalPhone: hospitalProfile.phone,
        location: {
          lat: parseFloat(hospitalProfile.latitude),
          lng: parseFloat(hospitalProfile.longitude)
        }
      });

      alert('✅ Ambulance request sent! Nearby ambulances have been notified.');
      setShowRequestModal(false);
      setRequestForm({
        patientCondition: '',
        urgency: 'high',
        pickupAddress: '',
        destinationAddress: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating request:', error);
      alert('❌ Failed to create request');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ambulances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Ambulance className="w-8 h-8 text-red-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">MedForecast - Ambulances</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown notifications={notifications} hospitalId={user.uid} />
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Dashboard
              </button>
              <button onClick={() => navigate('/requests')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Requests
              </button>
              <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
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
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Ambulance Network</h2>
            <p className="text-gray-600">{hospitalProfile?.name || 'Loading...'}</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Request Ambulance
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Available Ambulances</p>
                <p className="text-3xl font-bold text-green-600">{ambulances.length}</p>
              </div>
              <Ambulance className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">My Requests</p>
                <p className="text-3xl font-bold text-blue-600">{myRequests.length}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {myRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Ambulances */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Available Ambulances ({ambulances.length})</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {ambulances.length > 0 ? (
                ambulances.map(ambulance => (
                  <div key={ambulance.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <Ambulance className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{ambulance.vehicleNumber}</p>
                          <p className="text-sm text-gray-600">{ambulance.driverName}</p>
                        </div>
                      </div>
                      {ambulance.distance && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">{ambulance.distance} km</p>
                          <p className="text-xs text-gray-500">away</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        {ambulance.phone}
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Available
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Ambulance className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No ambulances available</p>
                </div>
              )}
            </div>
          </div>

          {/* My Requests */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">My Ambulance Requests ({myRequests.length})</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {myRequests.length > 0 ? (
                myRequests.map(request => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{request.patientCondition}</p>
                        <p className="text-sm text-gray-600 mt-1">{request.pickupAddress}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.status === 'accepted' && request.ambulanceName && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-green-800">
                            <span className="font-semibold">{request.ambulanceName}</span> is on the way!
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(request.createdAt).toLocaleString()}
                      </div>
                      <span className={`px-2 py-1 rounded ${
                        request.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                        request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {request.urgency}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No requests yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Request Ambulance</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Condition *</label>
                  <input
                    type="text"
                    value={requestForm.patientCondition}
                    onChange={(e) => setRequestForm({...requestForm, patientCondition: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cardiac arrest, Accident victim"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency *</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({...requestForm, urgency: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address *</label>
                  <input
                    type="text"
                    value={requestForm.pickupAddress}
                    onChange={(e) => setRequestForm({...requestForm, pickupAddress: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Patient location"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                  <input
                    type="text"
                    value={requestForm.destinationAddress}
                    onChange={(e) => setRequestForm({...requestForm, destinationAddress: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Destination hospital (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <textarea
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special requirements..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}