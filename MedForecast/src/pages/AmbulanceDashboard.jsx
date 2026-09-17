import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { 
  getAmbulanceProfile, 
  subscribeToAmbulanceRequests, 
  acceptAmbulanceRequest, 
  updateAmbulanceAvailability, 
  calculateDistance,
  createHospitalFacilityRequest, 
  subscribeToAmbulanceFacilityRequests 
} from '../services/ambulanceService';
import { subscribeToNotifications } from '../services/notificationService';
import NotificationDropdown from '../components/common/NotificationDropdown';
import { Ambulance, MapPin, Phone, Clock, CheckCircle, AlertCircle, Navigation, Hospital, Plus } from 'lucide-react';

export default function AmbulanceDashboard() {
  const [ambulanceProfile, setAmbulanceProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showFacilityRequestModal, setShowFacilityRequestModal] = useState(false);
  const [facilityRequests, setFacilityRequests] = useState([]);
  const [facilityForm, setFacilityForm] = useState({
    patientCondition: '',
    requiredFacility: 'icu',
    urgency: 'high',
    additionalInfo: ''
  });
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let unsubscribeRequests, unsubscribeNotifications, unsubscribeFacility;

    const loadData = async () => {
      try {
        const profile = await getAmbulanceProfile(user.uid);
        
        if (!profile) {
          navigate('/ambulance-profile-setup');
          return;
        }
        
        setAmbulanceProfile(profile);
        setAvailable(profile.available);

        // Subscribe to ambulance requests
        unsubscribeRequests = subscribeToAmbulanceRequests((requestsData) => {
          if (profile && profile.currentLocation) {
            const withDistance = requestsData.map(req => ({
              ...req,
              distance: calculateDistance(
                parseFloat(profile.currentLocation.lat),
                parseFloat(profile.currentLocation.lng),
                parseFloat(req.location.lat),
                parseFloat(req.location.lng)
              )
            })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            setRequests(withDistance);
          } else {
            setRequests(requestsData);
          }
        });

        // Subscribe to notifications
        unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
          setNotifications(notificationsData);
        });

        // Subscribe to facility requests
        unsubscribeFacility = subscribeToAmbulanceFacilityRequests(user.uid, (requestsData) => {
          setFacilityRequests(requestsData);
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeFacility) unsubscribeFacility();
    };
  }, [user, navigate]);

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !available;
      await updateAmbulanceAvailability(user.uid, newStatus);
      setAvailable(newStatus);
      alert(newStatus ? '✅ You are now available for requests' : '⚠️ You are now offline');
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleAcceptRequest = async (request) => {
    if (window.confirm(`Accept request from ${request.hospitalName}?\n\nPatient: ${request.patientCondition}\nPickup: ${request.pickupAddress}`)) {
      try {
        await acceptAmbulanceRequest(request.id, user.uid, ambulanceProfile.vehicleNumber);
        alert(`✅ Request accepted!\n\nHospital Contact: ${request.hospitalPhone}\nPickup: ${request.pickupAddress}`);
      } catch (error) {
        console.error('Error accepting request:', error);
        alert('Failed to accept request');
      }
    }
  };

  const handleCreateFacilityRequest = async (e) => {
    e.preventDefault();
    
    try {
      await createHospitalFacilityRequest({
        ...facilityForm,
        requestingAmbulanceId: user.uid,
        ambulanceName: ambulanceProfile.vehicleNumber,
        ambulancePhone: ambulanceProfile.phone,
        location: ambulanceProfile.currentLocation
      });

      alert('✅ Request sent to nearby hospitals! You will receive responses shortly.');
      setShowFacilityRequestModal(false);
      setFacilityForm({
        patientCondition: '',
        requiredFacility: 'icu',
        urgency: 'high',
        additionalInfo: ''
      });
    } catch (error) {
      console.error('Error creating facility request:', error);
      alert('❌ Failed to send request');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              <h1 className="text-xl font-bold text-gray-800">MedForecast - Ambulance</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown notifications={notifications} hospitalId={user.uid} />
              
              {/* Find Facility Button */}
              <button
                onClick={() => setShowFacilityRequestModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center"
              >
                <Hospital className="w-5 h-5 mr-2" />
                Find Facility
              </button>

              {/* Availability Toggle */}
              <button
                onClick={handleToggleAvailability}
                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center ${
                  available 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                {available ? 'Available' : 'Offline'}
              </button>

              <button 
                onClick={() => navigate('/ambulance-profile-setup')}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Profile
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
        <div className="mb-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-4xl font-bold mb-2">Ambulance Dashboard</h2>
          <p className="text-red-100 text-lg">{ambulanceProfile?.vehicleNumber || 'Loading...'}</p>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${available ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{available ? 'Accepting requests' : 'Offline'}</span>
            </div>
            <div className="flex items-center">
              <Navigation className="w-4 h-4 mr-2" />
              <span>GPS Active</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600">{requests.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Your Status</p>
                <p className="text-xl font-bold text-green-600">{available ? 'Available' : 'Offline'}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Facility Requests</p>
                <p className="text-3xl font-bold text-purple-600">{facilityRequests.length}</p>
              </div>
              <Hospital className="w-12 h-12 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Driver</p>
                <p className="text-xl font-bold text-gray-800">{ambulanceProfile?.driverName}</p>
              </div>
              <Ambulance className="w-12 h-12 text-red-600" />
            </div>
          </div>
        </div>

        {/* My Facility Requests */}
        {facilityRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">My Facility Requests ({facilityRequests.length})</h3>
            <div className="space-y-4">
              {facilityRequests.map(request => (
                <div key={request.id} className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{request.patientCondition}</p>
                      <p className="text-sm text-gray-600">Need: {request.requiredFacility.toUpperCase()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status === 'available' ? 'Facility Found' : 'Searching...'}
                    </span>
                  </div>
                  
                  {/* Responses */}
                  {request.responses && request.responses.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-semibold text-gray-700">Responses ({request.responses.length}):</p>
                      {request.responses.map((response, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${
                          response.available ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm">{response.hospitalName}</p>
                            <span className="text-xs text-gray-500">{response.distance} km</span>
                          </div>
                          <p className={`text-sm ${response.available ? 'text-green-700' : 'text-gray-700'}`}>
                            {response.available ? '✅ ' : '❌ '}{response.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">Waiting for hospital responses...</p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-3">
                    Sent: {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Requests */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Emergency Requests Near You</h3>
            <span className="text-sm text-gray-500">{requests.length} active</span>
          </div>

          <div className="space-y-4">
            {requests.length > 0 ? (
              requests.map(request => (
                <div 
                  key={request.id} 
                  className={`border-2 rounded-xl p-6 hover:shadow-lg transition ${
                    request.urgency === 'critical' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        request.urgency === 'critical' ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
                        <Hospital className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-bold text-lg text-gray-800">{request.hospitalName}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getUrgencyStyle(request.urgency)}`}>
                            {request.urgency.toUpperCase()}
                          </span>
                          {request.distance && (
                            <span className="text-sm font-semibold text-blue-600 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {request.distance} km away
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-800">
                            <span className="font-semibold">Patient:</span> {request.patientCondition}
                          </p>
                          <p className="text-gray-700 flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                            <span><span className="font-semibold">Pickup:</span> {request.pickupAddress}</span>
                          </p>
                          {request.destinationAddress && (
                            <p className="text-gray-700 flex items-start">
                              <Navigation className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                              <span><span className="font-semibold">Destination:</span> {request.destinationAddress}</span>
                            </p>
                          )}
                          {request.notes && (
                            <p className="text-gray-600 text-sm italic">"{request.notes}"</p>
                          )}
                          <p className="text-gray-600 flex items-center text-sm">
                            <Phone className="w-4 h-4 mr-2" />
                            {request.hospitalPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(request.createdAt).toLocaleTimeString()}
                    </div>
                    <button
                      onClick={() => handleAcceptRequest(request)}
                      className={`px-6 py-3 rounded-lg font-bold transition shadow-md ${
                        request.urgency === 'critical'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Accept Request →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <CheckCircle className="w-20 h-20 text-green-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-600 mb-2">No Active Requests</p>
                <p className="text-gray-500">You're all caught up! Requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Facility Request Modal */}
      {showFacilityRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Request Hospital Facility</h3>
                <p className="text-sm text-gray-500 mt-1">Broadcast to nearby hospitals (within 20km)</p>
              </div>
              <button onClick={() => setShowFacilityRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateFacilityRequest} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Condition *</label>
                  <input
                    type="text"
                    value={facilityForm.patientCondition}
                    onChange={(e) => setFacilityForm({...facilityForm, patientCondition: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Heart attack, Accident, Stroke"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Facility *</label>
                  <select
                    value={facilityForm.requiredFacility}
                    onChange={(e) => setFacilityForm({...facilityForm, requiredFacility: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="icu">ICU Bed</option>
                    <option value="ventilator">Ventilator</option>
                    <option value="emergency">Emergency Room</option>
                    <option value="cardiologist">Cardiologist</option>
                    <option value="neurologist">Neurologist</option>
                    <option value="trauma">Trauma Unit</option>
                    <option value="dialysis">Dialysis</option>
                    <option value="blood">Blood Transfusion</option>
                    <option value="surgery">Surgery Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['critical', 'high', 'normal'].map(level => (
                      <label key={level} className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer ${
                        facilityForm.urgency === level 
                          ? level === 'critical' ? 'border-red-600 bg-red-50' : 
                            level === 'high' ? 'border-orange-600 bg-orange-50' : 
                            'border-blue-600 bg-blue-50'
                          : 'border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="urgency"
                          value={level}
                          checked={facilityForm.urgency === level}
                          onChange={(e) => setFacilityForm({...facilityForm, urgency: e.target.value})}
                          className="mr-2"
                        />
                        <span className="font-medium capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                  <textarea
                    value={facilityForm.additionalInfo}
                    onChange={(e) => setFacilityForm({...facilityForm, additionalInfo: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Patient age, allergies, special requirements..."
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    <strong>📡 Broadcast Range:</strong> Your request will be sent to all hospitals within 20km radius. They will respond if they have the required facility available.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFacilityRequestModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  Broadcast Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}