import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getHospitalProfile } from '../services/hospitalService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { subscribeToNotifications } from '../services/notificationService';
import NotificationDropdown from '../components/common/NotificationDropdown';
import Footer from '../components/common/Footer';
import HospitalMap from '../components/common/HospitalMap';
import { Hospital, MapPin, Search } from 'lucide-react';

export default function MapView() {
  const [hospitals, setHospitals] = useState([]);
  const [currentHospital, setCurrentHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let unsubscribeNotifications;

    const loadData = async () => {
      try {
        // Load current hospital profile
        const profile = await getHospitalProfile(user.uid);
        setCurrentHospital(profile);

        // Load all hospitals
        const hospitalsSnapshot = await getDocs(collection(db, 'hospitals'));
        const hospitalsData = hospitalsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(h => h.id !== user.uid && h.latitude && h.longitude);

        setHospitals(hospitalsData);

        // Subscribe to notifications
        unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
          setNotifications(notificationsData);
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || hospital.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
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
              <h1 className="text-xl font-bold text-gray-800">MedForecast - Map View</h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationDropdown notifications={notifications} hospitalId={user.uid} />
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/requests')}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Requests
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Hospital Network Map</h2>
          <p className="text-gray-600">
            {currentHospital ? currentHospital.name : 'Loading...'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search hospitals by name or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({hospitals.length})
              </button>
              <button
                onClick={() => setFilterType('government')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  filterType === 'government'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Government
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  filterType === 'private'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Private
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          {currentHospital && currentHospital.latitude ? (
            <HospitalMap
              hospitals={filteredHospitals}
              currentLocation={{
                lat: currentHospital.latitude,
                lng: currentHospital.longitude
              }}
              onHospitalClick={(hospital) => console.log('Clicked:', hospital)}
            />
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-gray-100 rounded-xl">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-2">Location Not Set</p>
                <p className="text-sm text-gray-500 mb-4">
                  Please complete your hospital profile to view the map
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Setup Profile
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Map Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 mr-3"></div>
              <span className="text-sm text-gray-600">Your Hospital</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-red-500 mr-3"></div>
              <span className="text-sm text-gray-600">Other Hospitals</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}