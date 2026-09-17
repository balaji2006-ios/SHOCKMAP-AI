import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getHospitalProfile } from '../services/hospitalService';
import { subscribeToResources } from '../services/resourceService';
import { subscribeToNotifications } from '../services/notificationService';
import NotificationDropdown from '../components/common/NotificationDropdown';
import Footer from '../components/common/Footer';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Hospital, TrendingUp, Users, Activity, 
  CheckCircle, Clock, AlertCircle, BarChart3 
} from 'lucide-react';

export default function Analytics() {
  const [hospitalProfile, setHospitalProfile] = useState(null);
  const [resources, setResources] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

useEffect(() => {
  if (!user) {
    navigate('/login');
    return;
  }

  let cleanup;
  loadData().then(cleanupFn => {
    cleanup = cleanupFn; // ✅ Capture the cleanup function
  });

  return () => {
    if (cleanup) cleanup(); // ✅ Call cleanup on unmount
  };
}, [user, navigate]);

const loadData = async () => {
  try {
    const profile = await getHospitalProfile(user.uid);
    setHospitalProfile(profile);

    const unsubscribe = subscribeToResources(user.uid, (resourcesData) => {
      setResources(resourcesData);
    });

    const hospitalsSnapshot = await getDocs(collection(db, 'hospitals'));
    setAllHospitals(hospitalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const requestsSnapshot = await getDocs(collection(db, 'requests'));
    setRequests(requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // ADD THIS ↓
    const unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
      setNotifications(notificationsData);
    });

    setLoading(false);

    return () => {
      unsubscribe();
      unsubscribeNotifications(); // ADD THIS
    };
  } catch (error) {
    console.error('Error loading analytics data:', error);
    setLoading(false);
  }
};

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // Calculate metrics
  const totalRequests = requests.length;
  const myRequests = requests.filter(r => r.requestingHospitalId === user.uid);
  const fulfilledRequests = requests.filter(r => r.status === 'fulfilled').length;
  const openRequests = requests.filter(r => r.status === 'open').length;
  const fulfillmentRate = totalRequests > 0 ? ((fulfilledRequests / totalRequests) * 100).toFixed(1) : 0;

  // Resource utilization data
  const resourceUtilizationData = resources.map(resource => ({
    name: resource.name,
    available: resource.available,
    used: resource.total - resource.available,
    total: resource.total,
    utilizationRate: resource.total > 0 ? ((resource.total - resource.available) / resource.total * 100).toFixed(1) : 0
  }));

  // Request status distribution
  const requestStatusData = [
    { name: 'Open', value: openRequests, color: '#f59e0b' },
    { name: 'Matched', value: requests.filter(r => r.status === 'matched').length, color: '#10b981' },
    { name: 'Fulfilled', value: fulfilledRequests, color: '#6b7280' },
    { name: 'Cancelled', value: requests.filter(r => r.status === 'cancelled').length, color: '#ef4444' }
  ];

  // Resource type distribution
  const resourceTypeData = [
    { name: 'Beds', value: resources.filter(r => r.type === 'bed').length, color: '#3b82f6' },
    { name: 'Equipment', value: resources.filter(r => r.type === 'equipment').length, color: '#10b981' },
    { name: 'Blood', value: resources.filter(r => r.type === 'blood').length, color: '#ef4444' },
    { name: 'Doctors', value: resources.filter(r => r.type === 'doctor').length, color: '#8b5cf6' }
  ];

  // Average response time (mock data for now)
  const responseTimeData = [
    { day: 'Mon', minutes: 12 },
    { day: 'Tue', minutes: 8 },
    { day: 'Wed', minutes: 15 },
    { day: 'Thu', minutes: 10 },
    { day: 'Fri', minutes: 7 },
    { day: 'Sat', minutes: 14 },
    { day: 'Sun', minutes: 9 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
              <BarChart3 className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">MedForecast - Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown notifications={notifications} hospitalId={user.uid} />
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Dashboard
              </button>
              <button onClick={() => navigate('/requests')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Requests
              </button>
              <button onClick={() => navigate('/map')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Map
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h2>
          <p className="text-gray-600">{hospitalProfile?.name || 'Loading...'}</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Hospitals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Hospital className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Network Size</h3>
            <p className="text-3xl font-bold text-gray-800">{allHospitals.length}</p>
            <p className="text-xs text-gray-500 mt-2">Hospitals connected</p>
          </div>

          {/* Total Requests */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Requests</h3>
            <p className="text-3xl font-bold text-gray-800">{totalRequests}</p>
            <p className="text-xs text-gray-500 mt-2">{openRequests} currently open</p>
          </div>

          {/* Fulfillment Rate */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Fulfillment Rate</h3>
            <p className="text-3xl font-bold text-gray-800">{fulfillmentRate}%</p>
            <p className="text-xs text-gray-500 mt-2">{fulfilledRequests} requests fulfilled</p>
          </div>

          {/* Average Response Time */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Response Time</h3>
            <p className="text-3xl font-bold text-gray-800">
              {responseTimeData.reduce((sum, d) => sum + d.minutes, 0) / responseTimeData.length}
              <span className="text-lg text-gray-500 ml-1">min</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">40 min faster than manual</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Resource Utilization Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Resource Utilization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resourceUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="used" stackId="a" fill="#3b82f6" name="Used" />
                <Bar dataKey="available" stackId="a" fill="#10b981" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Request Status Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Request Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {requestStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Response Time Trend (Minutes)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="minutes" stroke="#3b82f6" strokeWidth={2} name="Response Time" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Resource Type Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Resource Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resourceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resourceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Statement */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Impact Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">Time Saved</p>
              <p className="text-3xl font-bold">
                {totalRequests * 40} <span className="text-lg">minutes</span>
              </p>
              <p className="text-blue-100 text-xs mt-1">vs manual coordination</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Efficiency Improvement</p>
              <p className="text-3xl font-bold">30%</p>
              <p className="text-blue-100 text-xs mt-1">resource utilization</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Estimated Lives Impacted</p>
              <p className="text-3xl font-bold">{fulfilledRequests * 3}+</p>
              <p className="text-blue-100 text-xs mt-1">patients benefited</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}