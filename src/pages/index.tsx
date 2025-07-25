import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, Clock, Star, Wifi, Coffee, Zap, ArrowUpDown } from 'lucide-react';

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
  place_id: string;
  photos?: string[];
  price_level?: number;
  user_ratings_total?: number;
};

type SortOption = 'distance' | 'rating' | 'popular';

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

export default function Home() {
  const [currentInput, setCurrentInput] = useState(''); 
  const [selectedLocation, setSelectedLocation] = useState(''); 
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const justSelectedRef = useRef(false);
  const [searchbarIsFocus, setSearchbarIsFocus] = useState(false); 
  
  // State for distance filtering and study spots
  const [userCoordinates, setUserCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number>(10); // Default 10km
  const [studySpots, setStudySpots] = useState<StudySpotWithDistance[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<StudySpotWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for sorting
  const [sortBy, setSortBy] = useState<SortOption>('distance');

  // Filter states
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterCoffee, setFilterCoffee] = useState(false);
  const [filterOutlets, setFilterOutlets] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0); // 0, 4, or 4.5

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const spotsPerPage = 10;

  // Calculate paginated spots
  const indexOfLastSpot = currentPage * spotsPerPage;
  const indexOfFirstSpot = indexOfLastSpot - spotsPerPage;
  const currentSpots = filteredSpots.slice(indexOfFirstSpot, indexOfLastSpot);
  const totalPages = Math.ceil(filteredSpots.length / spotsPerPage);

  // Function to sort study spots
  function sortStudySpots(spots: StudySpotWithDistance[], sortOption: SortOption): StudySpotWithDistance[] {
    const sortedSpots = [...spots];
    
    switch (sortOption) {
      case 'distance':
        return sortedSpots.sort((a, b) => {
          if (a.distance && b.distance) {
            return a.distance - b.distance;
          }
          // If one doesn't have distance, put the one with distance first
          if (a.distance && !b.distance) return -1;
          if (!a.distance && b.distance) return 1;
          // If neither has distance, maintain current order
          return 0;
        });
      
      case 'rating':
        return sortedSpots.sort((a, b) => b.rating - a.rating);
      
      case 'popular':
        return sortedSpots.sort((a, b) => {
          const aReviews = a.user_ratings_total || 0;
          const bReviews = b.user_ratings_total || 0;
          return bReviews - aReviews;
        });
      
      default:
        return sortedSpots;
    }
  }

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

  // Function to fetch study spots from Google Places API
  async function fetchStudySpots(coordinates: {lat: number, lng: number}) {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/places-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coordinates.lat,
          lng: coordinates.lng,
          maxDistance: selectedDistance
        })
      });

      const data = await response.json();
      
      if (data.studySpots) {
        const sortedSpots = sortStudySpots(data.studySpots, sortBy);
        setStudySpots(sortedSpots);
        // Initial filtering will be done by the useEffect hook
      } else {
        setError(data.message || 'Failed to fetch study spots');
      }
    } catch (error) {
      console.error('Error fetching study spots:', error);
      setError('Failed to fetch study spots');
    } finally {
      setIsLoading(false);
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
    setStudySpots([]);
    setFilteredSpots([]);
    setUserCoordinates(null);
    setFilterWifi(false);
    setFilterCoffee(false);
    setFilterOutlets(false);
    setFilterOpenNow(false);
    setFilterMinRating(0);
    setCurrentPage(1); // Reset pagination
  }

  function handleSortChange(newSortOption: SortOption) {
    setSortBy(newSortOption);
    if (studySpots.length > 0) {
      const sortedSpots = sortStudySpots(studySpots, newSortOption);
      setStudySpots(sortedSpots); // This will trigger the filter useEffect
    }
  }

  function showStudySpots() {
    if (!selectedLocation) {
      return (
        <div className="text-center text-gray-500 mt-8">
          <MapPin className="mx-auto mb-4" size={48} />
          <p className="text-xl">Enter a location to find study spots near you!</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="text-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Finding study spots near you...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 mt-8">
          <p className="text-lg">Error: {error}</p>
          <button 
            onClick={() => {
              if (userCoordinates) {
                fetchStudySpots(userCoordinates);
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (filteredSpots.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-8">
          <p className="text-lg">No study spots found within {selectedDistance}km of your location.</p>
          <p className="text-sm mt-2">Try increasing the distance filter or searching a different location.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Results Header with Sorting */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Study Spots Near You</h2>
            <p className="text-gray-600">
              {filteredSpots.length} spots found within {selectedDistance}km
            </p>
          </div>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
              <option value="popular">Most Reviewed</option>
            </select>
          </div>
        </div>
        
        {/* Paginated Study Spots */}
        {currentSpots.map((spot) => (
          <div key={spot.place_id} className="bg-white shadow-md rounded-xl p-6 flex items-start">
            {/* Image Section */}
            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mr-6 flex-shrink-0">
              {spot.photos && spot.photos.length > 0 ? (
                <img 
                  src={spot.photos[0]} 
                  alt={spot.name}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <span className="text-3xl text-gray-400">📷</span>
              )}
            </div>
            
            {/* Card Content */}
            <div className="flex-1">
              {/* Header Section */}
              <div className="flex items-center mb-2 flex-wrap">
                <span className="font-bold text-lg mr-2">{spot.name}</span>
                <div className="flex items-center mr-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="ml-1 font-medium">{spot.rating}</span>
                  {spot.user_ratings_total && (
                    <span className="ml-1 text-sm text-gray-500">
                      ({spot.user_ratings_total} reviews)
                    </span>
                  )}
                </div>
                {spot.distance && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    {spot.distance.toFixed(1)}km away
                  </span>
                )}
              </div>
              
              {/* Location */}
              <div className="text-gray-600 text-sm mb-3 flex items-start">
                <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                {spot.location}
              </div>
              
              {/* Amenities */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {spot.Wifi && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-xs">
                    <Wifi className="w-3 h-3 mr-1" />
                    WiFi
                  </span>
                )}
                {spot.Coffee && (
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded flex items-center text-xs">
                    <Coffee className="w-3 h-3 mr-1" />
                    Coffee
                  </span>
                )}
                {spot.Outlets && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Outlets
                  </span>
                )}
                {spot.Quiet && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    Quiet
                  </span>
                )}
              </div>
              
              {/* Opening Hours */}
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {spot.openTime}
              </div>
            </div>
          </div>
        ))}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
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

  // useEffect to handle location changes and fetch study spots
  useEffect(() => {
    async function handleLocationChange() {
      if (!selectedLocation) {
        setStudySpots([]);
        setFilteredSpots([]);
        setUserCoordinates(null);
        setCurrentPage(1); // Reset pagination
        return;
      }

      // Get user coordinates
      const userCoords = await getCoordinatesFromLocation(selectedLocation);
      if (!userCoords) {
        console.error('Could not get coordinates for selected location');
        setError('Could not find coordinates for the selected location');
        setCurrentPage(1); // Reset pagination
        return;
      }

      setUserCoordinates(userCoords);
      
      // Fetch study spots from Google Places API
      await fetchStudySpots(userCoords);
    }

    handleLocationChange();
  }, [selectedLocation]);

  // useEffect to handle distance filter changes - refetch from server with new distance
  useEffect(() => {
    if (userCoordinates && selectedLocation) {
      fetchStudySpots(userCoordinates);
    }
  }, [selectedDistance]);

  // useEffect to handle sort changes
  useEffect(() => {
    if (studySpots.length > 0) {
      const sortedSpots = sortStudySpots(studySpots, sortBy);
      setFilteredSpots(sortedSpots);
    }
  }, [sortBy]);

  // Filtering logic for amenities and rating
  useEffect(() => {
    let filtered = studySpots;
    if (filterWifi) filtered = filtered.filter(spot => spot.Wifi);
    if (filterCoffee) filtered = filtered.filter(spot => spot.Coffee);
    if (filterOutlets) filtered = filtered.filter(spot => spot.Outlets);
    if (filterOpenNow) filtered = filtered.filter(spot => spot.openTime && spot.openTime.toLowerCase().includes('open'));
    if (filterMinRating > 0) filtered = filtered.filter(spot => spot.rating >= filterMinRating);
    setFilteredSpots(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [studySpots, filterWifi, filterCoffee, filterOutlets, filterOpenNow, filterMinRating]);

  function handleSearchClick() {
    setSelectedLocation(currentInput);
  }

  return (
    <div>
      {/* Header Bar */}
      <div className="text-center py-12 px-4 bg-white shadow">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Find a Studiable Space!</h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Discover quiet cafes, libraries, and coworking spaces powered by Google Places!
        </p>
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <span className="whitespace-nowrap text-lg font-medium text-gray-700">
            Show study spots near:
          </span>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search study spots..."
              className="w-full h-10 pr-20 pl-4 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={currentInput}
              onChange={e => setCurrentInput(e.target.value)}
              onKeyDown={handleEnterSearch}
              onFocus={() => setSearchbarIsFocus(true)}
              onBlur={() => {
                setTimeout(() => setSearchbarIsFocus(false), 150);
              }}
            />
            {/* Current location option */}
            {searchbarIsFocus && currentInput.length === 0 && ( 
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-10">
                <div 
                  className="p-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium" 
                  onClick={handleCurrentLocation}
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
          
          {/* Amenities */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Amenities</h4>
            <div>
              <label className="block mb-1"><input type="checkbox" checked={filterWifi} onChange={e => setFilterWifi(e.target.checked)} /> WiFi</label>
              <label className="block mb-1"><input type="checkbox" checked={filterCoffee} onChange={e => setFilterCoffee(e.target.checked)} /> Coffee</label>
              <label className="block mb-1"><input type="checkbox" checked={filterOutlets} onChange={e => setFilterOutlets(e.target.checked)} /> Outlets</label>
            </div>
          </div>
          
          {/* Availability */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Availability</h4>
            <div>
              <label className="block mb-1"><input type="checkbox" checked={filterOpenNow} onChange={e => setFilterOpenNow(e.target.checked)} /> Open Now</label>
            </div>
          </div>
          
          {/* Minimum Rating */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Minimum Rating</h4>
            <div>
              <label className="block mb-1"><input type="checkbox" checked={filterMinRating === 4} onChange={e => setFilterMinRating(e.target.checked ? 4 : 0)} /> 4.0+</label>
              <label className="block mb-1"><input type="checkbox" checked={filterMinRating === 4.5} onChange={e => setFilterMinRating(e.target.checked ? 4.5 : 0)} /> 4.5+</label>
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