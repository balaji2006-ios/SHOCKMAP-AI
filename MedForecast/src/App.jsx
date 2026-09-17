import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HospitalProfile from './pages/HospitalProfile';
import MapView from './pages/MapView';
import Requests from './pages/Requests';
import Analytics from './pages/Analytics';
import Ambulances from './pages/Ambulances';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import AmbulanceProfileSetup from './pages/AmbulanceProfileSetup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<HospitalProfile />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/ambulances" element={<Ambulances />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/ambulance-dashboard" element={<AmbulanceDashboard />} />
        <Route path="/ambulance-profile-setup" element={<AmbulanceProfileSetup />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;