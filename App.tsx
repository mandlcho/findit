import React, { useState, useEffect } from 'react';
import { reverseGeocode, findToilets } from './services/locationService';
import { findAtms } from './services/osmService';
import MapView from './components/MapView';
import type { Location, Toilet } from './types';

const DEFAULT_CENTER: Location = { lat: 1.3521, lng: 103.8198 }; // Default to Singapore
const DEFAULT_ZOOM = 12;

type FilterState = {
  free: boolean;
  wheelchair: boolean;
  diaper: boolean;
};

const CheckmarkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);

const App: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState<string>('checking permissions...');
  const [locationName, setLocationName] = useState<string>('awaiting permissions...');
  const [activeCategory, setActiveCategory] = useState<'toilet' | 'atm'>('toilet');
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [filteredToilets, setFilteredToilets] = useState<Toilet[]>([]);
  const [isFinding, setIsFinding] = useState<boolean>(false);
  const [isSecretMenuOpen, setIsSecretMenuOpen] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<Location>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    free: false,
    wheelchair: false,
    diaper: false,
  });


  useEffect(() => {
    const requestLocation = async () => {
      if (!navigator.geolocation || !navigator.permissions) {
        setStatus('geolocation not supported');
        setLocationName('n/a');
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

        if (permissionStatus.state === 'denied') {
          setStatus('access denied. enable in browser settings.');
          setLocationName('n/a');
          return;
        }

        setStatus('requesting location...');
        
        const geoOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setStatus('access granted');
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(newLocation);
            setMapCenter(newLocation);
            setMapZoom(17);
            
            setLocationName('resolving location...');
            try {
              const name = await reverseGeocode(newLocation);
              setLocationName(name);
            } catch (error) {
              setLocationName('could not resolve location');
            }
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setStatus('access denied.');
            } else {
              setStatus(`error: ${error.message}`);
            }
            setLocationName('n/a');
          },
          geoOptions
        );
        
        permissionStatus.onchange = () => {
            if(permissionStatus.state === 'denied') {
                setStatus('access denied.');
                setLocationName('n/a');
                setLocation(null);
            }
        };

      } catch (err) {
          setStatus('could not check permissions.');
          console.error("error checking geolocation permissions:", err);
      }
    };

    requestLocation();
  }, []);

  // Check if on mobile device and show install prompt
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    console.log('[Install Prompt Debug]', {
      userAgent: navigator.userAgent,
      isMobile,
      isStandalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: (window.navigator as any).standalone,
      willShowPrompt: isMobile && !isStandalone
    });
    
    // Only show prompt if on mobile and not already installed
    if (isMobile && !isStandalone) {
      // Show after a short delay to avoid overwhelming the user
      const timer = setTimeout(() => {
        console.log('[Install Prompt] Showing prompt now');
        setShowInstallPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (activeCategory === 'atm') {
      setFilteredToilets(toilets);
      return;
    }

    let toiletsToFilter = [...toilets];
    if (filters.free) {
      // `fee` is treated as "paid" in our data model; "free" means fee === false.
      toiletsToFilter = toiletsToFilter.filter(t => t.fee === false);
    }
    if (filters.wheelchair) {
      toiletsToFilter = toiletsToFilter.filter(t => t.wheelchair === true);
    }
    if (filters.diaper) {
      toiletsToFilter = toiletsToFilter.filter(t => t.diaper === true);
    }
    setFilteredToilets(toiletsToFilter);
  }, [toilets, filters, activeCategory]);

  const handleFindItsAt = async (searchLocation: Location) => {
    setIsFinding(true);
    try {
      const foundToilets = await findToilets(searchLocation);
      setToilets(foundToilets);
      setActiveCategory('toilet');
      if (foundToilets.length === 0) {
        alert("no toilets found in this area.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "an unexpected error occurred.");
    } finally {
      setIsFinding(false);
    }
  };

  const handleFindIts = async () => {
    // Allow usage even when geolocation is denied by searching around the current map center.
    const searchLocation = location ?? mapCenter;
    return handleFindItsAt(searchLocation);
  };

  const handleSecretToilets = () => {
    setIsSecretMenuOpen(false);
    void handleFindIts();
  };

  const handleFindAtmsAt = async (searchLocation: Location) => {
    setIsFinding(true);
    try {
      const foundAtms = await findAtms(searchLocation);
      setActiveCategory('atm');
      setToilets(foundAtms);
      if (foundAtms.length === 0) {
        alert("no atms found in this area.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "an unexpected error occurred.");
    } finally {
      setIsFinding(false);
    }
  };

  const handleFindAtms = async () => {
    setIsSecretMenuOpen(false);
    // Allow usage even when geolocation is denied by searching around the current map center.
    const searchLocation = location ?? mapCenter;
    return handleFindAtmsAt(searchLocation);
  };
  
  const handleFilterChange = (filterName: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const handleViewportChanged = (center: Location, zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  const filterButtonClass = "w-28 px-4 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 shadow-sm flex items-center justify-center space-x-1.5";
  const activeFilterClass = "bg-blue-600 text-white border-blue-600";

  return (
    <div className="relative h-screen w-screen">
      <MapView 
        userLocation={location}
        toilets={filteredToilets}
        center={mapCenter}
        zoom={mapZoom}
        onViewportChanged={handleViewportChanged}
      />

      {toilets.length > 0 && !isFinding && activeCategory === 'toilet' && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col items-center space-y-3">
            <button 
                onClick={() => handleFilterChange('free')}
                className={`${filterButtonClass} ${filters.free ? activeFilterClass : 'hover:bg-gray-100'}`}
                title="free"
            >
                {filters.free && <CheckmarkIcon />}
                <span>free</span>
            </button>
            <button 
                onClick={() => handleFilterChange('wheelchair')}
                className={`${filterButtonClass} ${filters.wheelchair ? activeFilterClass : 'hover:bg-gray-100'}`}
                title="accessible"
            >
                {filters.wheelchair && <CheckmarkIcon />}
                <span>accessible</span>
            </button>
            <button 
                onClick={() => handleFilterChange('diaper')}
                className={`${filterButtonClass} ${filters.diaper ? activeFilterClass : 'hover:bg-gray-100'}`}
                title="diaper"
            >
                {filters.diaper && <CheckmarkIcon />}
                <span>diaper</span>
            </button>
        </div>
      )}
      
      <div className="absolute bottom-5 left-5 z-10 flex flex-col items-start space-y-2">
        <button
          onClick={() => setIsSecretMenuOpen(prev => !prev)}
          aria-label="developer menu"
          className="w-7 h-7 text-[11px] font-bold lowercase text-gray-400 bg-white/80 border border-transparent rounded-full shadow hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
        >
          d
        </button>
        {isSecretMenuOpen && (
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSecretToilets}
              disabled={isFinding}
              className="px-3 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-full shadow hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {isFinding && activeCategory === 'toilet' ? 'finding...' : 'find toilets'}
            </button>
            <button
              onClick={handleFindAtms}
              disabled={isFinding}
              className="px-3 py-1 text-xs font-semibold text-green-700 bg-white border border-green-200 rounded-full shadow hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50"
            >
              {isFinding && activeCategory === 'atm' ? 'finding...' : 'find atm machine'}
            </button>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md text-center">
        <div className="flex items-center justify-center gap-2">
           <button
             onClick={handleFindIts}
             disabled={isFinding}
             className="px-6 py-3 text-base font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
           >
            {isFinding ? 'finding...' : `find toilets${activeCategory === 'toilet' ? ` (${filteredToilets.length})` : ''}`}
          </button>

          <button
            onClick={() => handleFindItsAt(mapCenter)}
            disabled={isFinding}
            className="px-4 py-3 text-base font-semibold text-gray-800 bg-white/90 border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
            title="Search around the current map center (useful if you pan/zoom or location is denied)"
          >
            search this area
          </button>
        </div>

        <div className="mt-3 text-[10px] text-black" style={{ textShadow: '0 0 4px white, 0 0 6px white' }}>
            <p><span className="font-bold">location access:</span> {status}</p>
            <p><span className="font-bold">current location:</span> {locationName}</p>
            {!location && <p><span className="font-bold">note:</span> searching uses the map center when location is unavailable.</p>}
        </div>
      </div>

      {showInstallPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">📱</div>
              <h2 className="text-lg font-bold text-gray-900">Add to Home Screen</h2>
              <p className="text-sm text-gray-600 mt-2">
                Install FindIt for quick access to nearby toilets anytime!
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-700 space-y-2">
              <p className="font-semibold">iOS Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tap the Share button <span className="inline-block">⬆️</span></li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            </div>

            <button
              onClick={() => setShowInstallPrompt(false)}
              className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="w-full px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
