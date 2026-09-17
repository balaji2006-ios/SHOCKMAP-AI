import { useMemo, useEffect, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { Hospital } from 'lucide-react';

// Google Maps library configuration
const libraries = ['places'];

const mapContainerStyle = {
  height: '500px',
  width: '100%',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 20.5937, // Center of India
  lng: 78.9629,
};

export default function HospitalMap({ hospitals, currentLocation, onHospitalClick }) {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [map, setMap] = useState(null);

  // Get Google Maps API key from environment variable or use a placeholder
  // Users need to set VITE_GOOGLE_MAPS_API_KEY in their .env file
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const center = useMemo(() => {
    if (currentLocation) {
      return {
        lat: parseFloat(currentLocation.lat),
        lng: parseFloat(currentLocation.lng),
      };
    }
    return defaultCenter;
  }, [currentLocation]);

  const zoom = useMemo(() => {
    return currentLocation ? 12 : 5;
  }, [currentLocation]);

  // Recenter map when location changes
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  if (loadError) {
    return (
      <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold mb-2">Error loading Google Maps</p>
          <p className="text-sm text-gray-600">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={(map) => setMap(map)}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {/* Current Location Marker (Blue) */}
        {currentLocation && (
          <Marker
            position={center}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={() => setSelectedHospital({ isCurrent: true, position: center })}
          />
        )}

        {/* Other Hospitals Markers (Red) */}
        {hospitals && hospitals.map((hospital) => {
          const position = {
            lat: parseFloat(hospital.latitude),
            lng: parseFloat(hospital.longitude),
          };

          return (
            <Marker
              key={hospital.id}
              position={position}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              onClick={() => setSelectedHospital({ hospital, position })}
            />
          );
        })}

        {/* Info Window */}
        {selectedHospital && (
          <InfoWindow
            position={selectedHospital.position}
            onCloseClick={() => setSelectedHospital(null)}
          >
            <div className="p-2 max-w-xs">
              {selectedHospital.isCurrent ? (
                <div>
                  <div className="flex items-center mb-2">
                    <Hospital className="w-5 h-5 text-blue-600 mr-2" />
                    <strong>Your Hospital</strong>
                  </div>
                  <p className="text-sm text-gray-600">Current Location</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <Hospital className="w-5 h-5 text-red-600 mr-2" />
                    <strong className="text-gray-800">{selectedHospital.hospital.name}</strong>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {selectedHospital.hospital.address}, {selectedHospital.hospital.city}
                  </p>
                  
                  <p className="text-xs text-gray-500 mb-2">
                    📞 {selectedHospital.hospital.phone}
                  </p>

                  <div className="flex items-center space-x-2 text-xs mb-3">
                    <span className={`px-2 py-1 rounded ${
                      selectedHospital.hospital.type === 'government' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedHospital.hospital.type === 'government' ? 'Government' : 'Private'}
                    </span>
                  </div>

                  {onHospitalClick && (
                    <button
                      onClick={() => {
                        onHospitalClick(selectedHospital.hospital);
                        setSelectedHospital(null);
                      }}
                      className="w-full bg-blue-600 text-white py-1.5 px-3 rounded text-sm hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  )}
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}