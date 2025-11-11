import React, { useState, useEffect } from 'react';
import { reverseGeocode, findToilets } from './services/geminiService';
import { findAtms } from './services/osmService';
import MapView from './components/MapView';
import type { Location, Place, PlaceCategory } from './types';

const DEFAULT_CENTER: Location = { lat: 1.3521, lng: 103.8198 }; // Default to Singapore
const DEFAULT_ZOOM = 12;

type FilterState = {
  free: boolean;
  wheelchair: boolean;
  diaper: boolean;
};

const CATEGORY_OPTIONS: Array<{ id: PlaceCategory; label: string; description: string }> = [
  { id: 'toilet', label: 'toilets', description: 'public restrooms nearby' },
  { id: 'atm', label: 'atm machines', description: 'grab cash fast' },
];

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  toilet: 'toilets',
  atm: 'atms',
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
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null);
  const [resultsByCategory, setResultsByCategory] = useState<Record<PlaceCategory, Place[]>>({
    toilet: [],
    atm: [],
  });
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isFinding, setIsFinding] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<Location>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
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

  useEffect(() => {
    if (!activeCategory) {
      setFilteredPlaces([]);
      return;
    }

    const basePlaces = resultsByCategory[activeCategory] || [];

    if (activeCategory !== 'toilet') {
      setFilteredPlaces(basePlaces);
      return;
    }

    let toiletsToFilter = [...basePlaces];
    if (filters.free) {
      toiletsToFilter = toiletsToFilter.filter(t => t.fee === true);
    }
    if (filters.wheelchair) {
      toiletsToFilter = toiletsToFilter.filter(t => t.wheelchair === true);
    }
    if (filters.diaper) {
      toiletsToFilter = toiletsToFilter.filter(t => t.diaper === true);
    }
    setFilteredPlaces(toiletsToFilter);
  }, [resultsByCategory, filters, activeCategory]);

  const handleCategorySearch = async (category: PlaceCategory) => {
    if (!location) {
      alert("cannot find places without your location. please grant access and try again.");
      return;
    }
    setIsPickerOpen(false);
    setActiveCategory(category);
    setIsFinding(true);
    try {
      let foundPlaces: Place[] = [];
      if (category === 'toilet') {
        foundPlaces = await findToilets(location);
      } else {
        foundPlaces = await findAtms(location);
      }
      setResultsByCategory(prev => ({ ...prev, [category]: foundPlaces }));
      if (foundPlaces.length === 0) {
        const label = category === 'toilet' ? 'toilets' : 'atms';
        alert(`no ${label} found nearby.`);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "an unexpected error occurred.");
    } finally {
      setIsFinding(false);
    }
  };

  const handleFindButtonClick = () => {
    if (isFinding) {
      return;
    }
    setIsPickerOpen(prev => !prev);
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
        places={filteredPlaces}
        center={mapCenter}
        zoom={mapZoom}
        onViewportChanged={handleViewportChanged}
      />

      {activeCategory === 'toilet' && resultsByCategory.toilet.length > 0 && !isFinding && (
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
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md text-center">
        <div className="relative">
          <button
            onClick={handleFindButtonClick}
            disabled={isFinding}
            className="w-full px-6 py-3 text-base font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            {isFinding ? 'finding...' : 'find it'}
          </button>
          {isPickerOpen && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-full bg-white border border-gray-200 rounded-xl shadow-lg text-left p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">what do you need?</p>
              {CATEGORY_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleCategorySearch(option.id)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                      <p className="text-[11px] text-gray-500">{option.description}</p>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {resultsByCategory[option.id].length > 0 ? `${resultsByCategory[option.id].length} saved` : 'search'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 text-[10px] text-black" style={{ textShadow: '0 0 4px white, 0 0 6px white' }}>
            <p><span className="font-bold">location access:</span> {status}</p>
            <p><span className="font-bold">current location:</span> {locationName}</p>
            <p>
              <span className="font-bold">showing:</span>{' '}
              {activeCategory ? `${CATEGORY_LABELS[activeCategory]} (${filteredPlaces.length})` : 'choose a category'}
            </p>
        </div>
      </div>
    </div>
  );
};

export default App;
