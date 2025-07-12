import { useState, useEffect, useRef } from "react";
import { Search, X} from 'lucide-react';

type Suggestion = {
  description: string;
  place_id: string;
};

type StudySpotWithDistance = {
  name: string;
  location: string;
  rating: number;
  Wifi: boolean;
  Coffee: boolean;
  Quiet: boolean;
  Outlets: boolean;
  openTime: string;
  distance?: number; // Distance in km
  coordinates: { lat: number; lng: number };
};

// Distance calculation function using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Function to get coordinates from selectedLocation
async function getCoordinatesFromLocation(location: string): Promise<{lat: number, lng: number} | null> {
  try {
    // Check if location is already coordinates (lat, lng format)
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      };
    }

    // If not coordinates, geocode the address
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: [location] })
    });

    const data = await response.json();
    
    if (data.coordinates && data.coordinates[0] && data.coordinates[0].lat && data.coordinates[0].lng) {
      return {
        lat: data.coordinates[0].lat,
        lng: data.coordinates[0].lng
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
}

// Function to filter study spots by distance
function filterStudySpotsByDistance(
  spots: StudySpotWithDistance[], 
  maxDistance: number
): StudySpotWithDistance[] {
  return spots.filter(spot => spot.distance !== undefined && spot.distance <= maxDistance);
}

export default function Home() {
  const [currentInput, setCurrentInput] = useState(''); 
  const [selectedLocation, setSelectedLocation] = useState(''); 
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const justSelectedRef = useRef(false);
  const [searchbarIsFocus, setSearchbarIsFocus] = useState(false); 
  
  // New state for distance filtering
  const [userCoordinates, setUserCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number>(10); // Default 10km
  const [studySpots, setStudySpots] = useState<StudySpotWithDistance[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<StudySpotWithDistance[]>([]);

  // Updated study spots data with coordinates
  const initialStudySpots: StudySpotWithDistance[] = [
    {
      name: "Starbucks",
      location: "101 เดอะเติร์ธเพลส ห้อง 112-A ชั้น 1 โซนฮิลล์ไซด์ ทาวน์, ถนน สุขุมวิท 101/1 Bang Chak, Phra Khanong, Bangkok 10260",
      rating: 4.7,
      Wifi: true,
      Coffee: true,
      Quiet: true,
      Outlets: true,
      openTime: "8:00 AM - 10:00 PM",
      coordinates: { lat: 13.6844702, lng: 100.622732 }
    },
    {
      name: "True Cafe",
      location: "ศูนย์การค้า วิสซ์ดอม วัน-โอ-วัน, เลขที่ 101 Sukhumvit Rd, Bang Chak, Phra Khanong, Bangkok 10260",
      rating: 4.6,
      Wifi: true,
      Coffee: true,
      Quiet: true,
      Outlets: true,
      openTime: "8:00 AM - 10:00 PM",
      coordinates: { lat: 13.6853996, lng: 100.6111126 }
    },
    {
      name: "Cataleya Estate",
      location: "88 Soi Punnawitthi 33 alley, Bang Chak, Phra Khanong, Bangkok 10260",
      rating: 4.8,
      Wifi: true,
      Coffee: true,
      Quiet: true,
      Outlets: true,
      openTime: "8:00 AM - 10:00 PM",
      coordinates: { lat: 13.6926677, lng: 100.6284165 }
    },
  ];

  async function fetchSuggestions(input: string) {
    try {
      const response = await fetch('/api/places-autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      const data = await response.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleEnterSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setSelectedLocation(currentInput);
    }
  }

  function handleCurrentLocation() {
    console.log('handleCurrentLocation called!');
    
    if (navigator.geolocation) {
      console.log('Geolocation is supported');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Success getting location');
          const { latitude, longitude } = position.coords;
          
          const coordinatesString = `${latitude}, ${longitude}`;
          setSelectedLocation(coordinatesString);
          setCurrentInput(coordinatesString);
          setSearchbarIsFocus(false);
          
          console.log('User location:', coordinatesString);
        },
        (error) => {
          console.log('ERROR CODE:', error.code);
          console.log('ERROR MESSAGE:', error.message);
          console.error('Full error object:', error);
          alert(`Unable to get your location. Error: ${error.message}`);
        }
      );
    } else {
      console.log('Geolocation not supported');
      alert('Geolocation not supported');
    }
  }

  function handleClearClick(){ 
    setSelectedLocation(''); 
    setCurrentInput(''); 
  }

  function showStudySpots() {
    if (!selectedLocation) {
      return (
        <div className="text-center text-gray-500 mt-8">
          <p>Enter a location to find study spots near you!</p>
        </div>
      );
    }

    if (filteredSpots.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-8">
          <p>No study spots found within {selectedDistance}km of your location.</p>
          <p className="text-sm mt-2">Try increasing the distance filter or searching a different location.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Study Spots Near You</h2>
          <p className="text-gray-600">
            {filteredSpots.length} spots found within {selectedDistance}km
          </p>
        </div>
        
        {filteredSpots.map((spot, idx) => (
          <div key={idx} className="bg-white shadow-md rounded-lg p-6 flex items-start">
            {/* Image Placeholder on the left */}
            <div className="w-35 h-35 bg-gray-200 rounded-md flex items-center justify-center mr-6 flex-shrink-0">
              <span className="text-3xl text-gray-400">📷</span>
            </div>
            
            {/* Card Content on the right */}
            <div className="flex-1">
              {/* Header Section: Location Name, Rating, and Distance */}
              <div className="flex items-center mb-2 align-baseline">
                <span className="font-bold">{spot.name}</span>
                <span className="ml-2 flex items-center font-bold">
                  {spot.rating}
                  <span className="ml-1">⭐</span>
                </span>
                {spot.distance && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {spot.distance.toFixed(1)}km away
                  </span>
                )}
              </div>
              
              {/* Location section */}
              <div className="text-gray-600 text-sm mb-3">
                {spot.location}
              </div>
              
              {/* Amenities section */}
              <div className="flex gap-2 mb-3">
                {spot.Wifi && <span className="bg-yellow-300/30 text-amber-900 px-2 py-1 rounded">Wifi</span>}
                {spot.Coffee && <span className="bg-yellow-300/30 text-amber-900 px-2 py-1 rounded">Coffee</span>}
                {spot.Outlets && <span className="bg-yellow-300/30 text-amber-900 px-2 py-1 rounded">Outlets</span>}
              </div>
              
              {/* Footer section - Open time */}
              <div className="text-sm text-gray-500">
                Open time: {spot.openTime}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handler for when a suggestion is clicked
  function handleSuggestionClick(suggestion: Suggestion) {
    justSelectedRef.current = true;
    setShowSuggestions(false);
    setCurrentInput(suggestion.description);
    setSelectedLocation(suggestion.description);
  }

  // useEffect for suggestions
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (currentInput.length >= 3) {
        fetchSuggestions(currentInput);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentInput]);

  // useEffect to handle distance calculations whenever selectedLocation changes
  useEffect(() => {
    async function calculateDistances() {
      if (!selectedLocation) {
        setStudySpots(initialStudySpots);
        setFilteredSpots([]);
        setUserCoordinates(null);
        return;
      }

      // Get user coordinates
      const userCoords = await getCoordinatesFromLocation(selectedLocation);
      if (!userCoords) {
        console.error('Could not get coordinates for selected location');
        return;
      }

      setUserCoordinates(userCoords);

      // Prepare destinations for Distance Matrix API
      const destinations = initialStudySpots.map(spot => `${spot.coordinates.lat},${spot.coordinates.lng}`);
      let distances: number[] = [];
      try {
        const response = await fetch('/api/distance-matrix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: `${userCoords.lat},${userCoords.lng}`,
            destinations
          })
        });
        const data = await response.json();
        if (data.rows && data.rows[0] && data.rows[0].elements) {
          distances = data.rows[0].elements.map((el: any) =>
            el.status === 'OK' ? el.distance.value / 1000 : null // meters to km
          );
        }
      } catch (err) {
        console.error('Failed to fetch travel distances:', err);
      }

      // Calculate distances for all study spots (using Google API results)
      const spotsWithDistance = initialStudySpots.map((spot, idx) => ({
        ...spot,
        distance: distances[idx] !== null && distances[idx] !== undefined ? distances[idx] : undefined
      }));

      // Sort by distance (closest first)
      spotsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setStudySpots(spotsWithDistance);

      // Filter by selected distance
      const filtered = filterStudySpotsByDistance(spotsWithDistance, selectedDistance);
      setFilteredSpots(filtered);
    }

    calculateDistances();
  }, [selectedLocation, selectedDistance]);

  // Initialize study spots on component mount
  useEffect(() => {
    setStudySpots(initialStudySpots);
  }, []);

  function handleSearchClick() {
    setSelectedLocation(currentInput);
  }

  return (
    <div>
      {/* Header Bar */}
      <div className="text-center py-12 px-4 bg-white shadow">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Find a Studiable Space!</h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Discover quiet cafes, libraries, and coworking spaces!
        </p>
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <span className="whitespace-nowrap text-lg font-medium text-gray-700">
            Show study spots near:
          </span>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search study spots..."
              className="w-95 h-10 pr-20 pl-4 rounded-full bg-gray-100 border border-gray-200 focus:outline-none"
              value={currentInput}
              onChange={e => setCurrentInput(e.target.value)}
              onKeyDown={handleEnterSearch}
              onFocus={() => setSearchbarIsFocus(true)}
              onBlur={() => {
                setTimeout(() => setSearchbarIsFocus(false), 150);
              }}
            />
            {/* User clicks on the search bar and doesn't type anything */}
            {searchbarIsFocus && currentInput.length === 0 && ( 
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-10">
                <div 
                  className="p-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium" 
                  onClick={()=> {
                    console.log('Click detected!');
                    handleCurrentLocation()
                  }}
                >
                  📍 Use my current location
                </div> 
              </div> 
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-10">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
            <button className="absolute right-10 top-1/2 -translate-y-1/2 cursor-pointer" onClick={handleClearClick}>
              <X size={19}/>
            </button>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={handleSearchClick}>
              <Search size={19} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Section: Two Columns */}
      <div className="flex gap-8 max-w-7xl mx-auto px-4 py-10">
        {/* Filters Column (1/4) */}
        <div className="w-1/4 bg-gray-50 p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Filters</h3>
          
          {/* Distance */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Distance</h4>
            <div>
              <label className="block mb-1">
                <input 
                  type="radio" 
                  name="distance" 
                  value="1" 
                  checked={selectedDistance === 1}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                /> 1 km
              </label>
              <label className="block mb-1">
                <input 
                  type="radio" 
                  name="distance" 
                  value="5" 
                  checked={selectedDistance === 5}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                /> 5 km
              </label>
              <label className="block mb-1">
                <input 
                  type="radio" 
                  name="distance" 
                  value="10" 
                  checked={selectedDistance === 10}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                /> 10 km
              </label>
              <label className="block mb-1">
                <input 
                  type="radio" 
                  name="distance" 
                  value="25" 
                  checked={selectedDistance === 25}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                /> 25 km
              </label>
            </div>
          </div>
          
          {/* Show current filter status */}
          {/* {selectedLocation && (
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                Showing spots within {selectedDistance}km of your location
              </p>
              <p className="text-xs text-blue-600">
                Found {filteredSpots.length} spots
              </p>
            </div>
          )} */}
          
          {/* Amenities */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Amenities</h4>
            <div>
              <label className="block mb-1"><input type="checkbox" /> WiFi</label>
              <label className="block mb-1"><input type="checkbox" /> Coffee</label>
              <label className="block mb-1"><input type="checkbox" /> Outlets</label>
            </div>
          </div>
          
          {/* Availability */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Availability</h4>
            <div>
              <label className="block mb-1"><input type="checkbox" /> Open Now</label>
            </div>
          </div>
          
          {/* Minimum Rating */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Minimum Rating</h4>
            <div>
              <label className="block mb-1"><input type="checkbox" /> 4.0+</label>
              <label className="block mb-1"><input type="checkbox" /> 4.5+</label>
            </div>
          </div>
        </div>
        
        {/* Results Column (3/4) */}
        <div className="w-3/4">
          {showStudySpots()}
        </div>
      </div>
    </div>
  );
}