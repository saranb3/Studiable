import { useState, useEffect, useRef } from "react";
import { Search, X} from 'lucide-react';
import axios from 'axios'; 

type Suggestion = {
  description: string;
  place_id: string;
};

export default function Home() {
  const [currentInput, setCurrentInput] = useState(''); 
  const [selectedLocation, setSelectedLocation] = useState(''); 

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const justSelectedRef = useRef(false);

  const [searchbarIsFocus, setSearchbarIsFocus] = useState(false); 

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
    console.log('handleCurrentLocation called!'); // Debug line 1
    
    if (navigator.geolocation) {
      console.log('Geolocation is supported'); // Debug line 2
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Success getting location'); // Debug line 3
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
      console.log('Geolocation not supported'); // Debug line 5
      alert('Geolocation not supported');
    }
  }

  function handleClearClick(){ 
    setSelectedLocation(''); 
    setCurrentInput(''); 
  }

  const studySpots = [ 
    {
      name: "Starbucks", 
      location: "101 เดอะเติร์ธเพลส ห้อง 112-A ชั้น 1 โซนฮิลล์ไซด์ ทาวน์, ถนน สุขุมวิท 101/1 Bang Chak, Phra Khanong, Bangkok 10260", 
      rating: 4.7,
      Wifi: true, 
      Coffee: true, 
      Quiet: true, 
      Outlets: true,
      openTime: "8:00 AM - 10:00 PM"
    }, 

    {
      name: "True Cafe", 
      location: "ศูนย์การค้า วิสซ์ดอม วัน-โอ-วัน, เลขที่ 101 Sukhumvit Rd, Bang Chak, Phra Khanong, Bangkok 10260", 
      rating: 4.6,
      Wifi: true, 
      Coffee: true, 
      Quiet: true, 
      Outlets: true,
      openTime: "8:00 AM - 10:00 PM"
    }, 

    {
      name: "Cataleya Estate", 
      location: "88 Soi Punnawitthi 33 alley, Bang Chak, Phra Khanong, Bangkok 10260", 
      rating: 4.8,
      Wifi: true, 
      Coffee: true, 
      Quiet: true, 
      Outlets: true,
      openTime: "8:00 AM - 10:00 PM"
    }, 
  ];
  
  const studySpotCoordinates = [
    { lat: 13.6844702, lng: 100.622732 },      // Starbucks
    { lat: 13.6853996, lng: 100.6111126 },     // True Cafe  
    { lat: 13.6926677, lng: 100.6284165 },     // Cataleya Estate
  ];
  
  function showStudySpots(){ 
    if(selectedLocation) { 
      return (
        // Study spot card structure 
        <div className="space-y-4">
          {studySpots.slice(0, 3).map((spot, idx) => (
              <div key={idx} className="bg-white shadow-md rounded-lg p-6 flex items-start">
                {/* Image Placeholder on the left */}
                <div className="w-35 h-35 bg-gray-200 rounded-md flex items-center justify-center mr-6 flex-shrink-0">
                  <span className="text-3xl text-gray-400">📷</span>
                </div>
                {/* Card Content on the right */}
                <div className="flex-1">
                  {/* Header Section: Location Name and Rating */}
                  <div className="flex items-center mb-2 align-baseline">
                    <span className="font-bold">{spot.name}</span>
                    <span className="ml-2 flex items-center font-bold">
                      {spot.rating}
                      <span className="ml-1">⭐</span>
                    </span>
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
  return null;
}

  // Handler for when a suggestion is clicked
  function handleSuggestionClick(suggestion: Suggestion) {
    justSelectedRef.current = true;
    setShowSuggestions(false);
    setCurrentInput(suggestion.description);
    setSelectedLocation(suggestion.description);
  }

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
            {/* Example radio buttons */}
            <div>
              <label><input type="radio" name="distance" value="1" /> 1 km</label><br />
              <label><input type="radio" name="distance" value="5" /> 5 km</label><br />
              <label><input type="radio" name="distance" value="10" /> 10 km</label>
            </div>
          </div>
          {/* Amenities */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Amenities</h4>
            <div>
              <label><input type="checkbox" /> WiFi</label><br />
              <label><input type="checkbox" /> Coffee</label><br />
              <label><input type="checkbox" /> Outlets</label>
            </div>
          </div>
          {/* Availability */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Availability</h4>
            <div>
              <label><input type="checkbox" /> Open Now</label>
            </div>
          </div>
          {/* Minimum Rating */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Minimum Rating</h4>
            <div>
              <label><input type="checkbox" /> 4.0+</label><br />
              <label><input type="checkbox" /> 4.5+</label>
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