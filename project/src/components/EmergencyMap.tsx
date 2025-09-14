import { useState, useEffect } from "react";
import { Building2, Navigation2, Ambulance, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";

interface EmergencyMapProps {
  emergencyData: {
    location: string;
    coordinates: { lat: number; lng: number };
    callType: string;
    ambulance: {
      unit: string;
      location: { lat: number; lng: number };
      speed: string;
    };
  };
}

export function EmergencyMap({ emergencyData }: EmergencyMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mock hospital locations
  const nearbyHospitals = [
    { name: "St. Mary's General", location: { lat: 40.7300, lng: -74.0100 }, distance: "2.1 mi", eta: "6 min" },
    { name: "Central Medical Center", location: { lat: 40.7400, lng: -73.9900 }, distance: "3.4 mi", eta: "9 min" },
    { name: "Emergency Hospital", location: { lat: 40.7200, lng: -73.9800 }, distance: "4.2 mi", eta: "12 min" }
  ];

  const mapStyle = {
    width: '100%',
    height: '400px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundImage: `
      radial-gradient(circle at 25% 25%, #e2e8f0 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, #cbd5e1 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px'
  };

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div style={mapStyle} className="border border-gray-200">
        {!mapLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Loading emergency map...</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Emergency Location */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ 
                left: '60%', 
                top: '40%',
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 w-8 h-8"></div>
                <div className="relative bg-red-600 text-white p-2 rounded-full shadow-lg">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-red-100 text-red-800 text-xs font-medium">
                    Emergency Scene
                  </Badge>
                </div>
              </div>
            </div>

            {/* Ambulance Position */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ 
                left: '25%', 
                top: '65%',
              }}
            >
              <div className="relative">
                <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg animate-pulse">
                  <Ambulance className="h-4 w-4" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">
                    {emergencyData.ambulance.unit}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Route Line */}
            <svg 
              className="absolute inset-0 w-full h-full" 
              style={{ pointerEvents: 'none' }}
            >
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path
                d="M 25% 65% Q 40% 50% 60% 40%"
                stroke="url(#routeGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            </svg>

            {/* Hospital Locations */}
            {nearbyHospitals.map((hospital, index) => (
              <div 
                key={hospital.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${70 + index * 10}%`, 
                  top: `${20 + index * 15}%`,
                }}
              >
                <div className="relative">
                  <div className="bg-green-600 text-white p-1.5 rounded-full shadow-md">
                    <Building2 className="h-3 w-3" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {hospital.distance}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs">
              <h4 className="font-medium text-gray-900">Legend</h4>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-gray-700">Emergency Scene</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">Ambulance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-gray-700">Hospital</span>
              </div>
            </div>

            {/* Live Status Indicator */}
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-900">Live Tracking</span>
            </div>
          </div>
        )}
      </div>

      {/* Hospital Options */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 text-sm">Nearest Hospitals</h4>
        <div className="grid grid-cols-1 gap-2">
          {nearbyHospitals.map((hospital, index) => (
            <div 
              key={hospital.name} 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Building2 className={`h-4 w-4 ${index === 0 ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-medium text-sm ${index === 0 ? 'text-green-900' : 'text-gray-900'}`}>
                    {hospital.name}
                  </p>
                  <p className={`text-xs ${index === 0 ? 'text-green-700' : 'text-gray-600'}`}>
                    {hospital.distance} • ETA {hospital.eta}
                  </p>
                </div>
              </div>
              {index === 0 && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  Recommended
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}