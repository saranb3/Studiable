import { useState, useEffect } from "react";
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

  function handleSearchClick() {
    setSelectedLocation(currentInput);
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
        <ul>
          {studySpots.slice(0, 3).map((spot, idx) => (
            <>
              <li key={idx}>
                <div>Name: <strong>{spot.name}</strong></div>
                <div>Location: {spot.location}</div>
                <div>Rating: {spot.rating} ⭐ | Open time: {spot.openTime}</div>
                <span>{spot.Wifi && <span className= "bg-yellow-300/30 text-amber-900 px-2 py-1 rounded">Wifi</span>} </span> 
                <span>{spot.Coffee && <span className= "bg-yellow-300/30 text-amber-900 px-2 py-1 rounded">Coffee</span>} </span> 
                <span>{spot.Outlets && <span className= "bg-yellow-300/30 text-amber-900 px-2 py-1 rounded">Outlets</span>} </span> 
              </li>
              <br />
            </>
          ))}
        </ul>
      );
    }
    return null;
  }

  // Handler for when a suggestion is clicked
  function handleSuggestionClick(suggestion: Suggestion) {
    setShowSuggestions(false);
    setCurrentInput(suggestion.description);
    setSelectedLocation(suggestion.description);
  }

  useEffect(() => {
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

  return (
    <div>
      {/* 1. Header section - full width, centered */}
      <div className="text-center py-16 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4"> Find a Studiable Space!</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"> Discover quiet cafes, libraries, and coworking spaces!</p> 
      
        {/* Flex row for label and search bar */}
        <div className="max-w-xl mx-auto flex items-center gap-4 relative"> 
          <span className="whitespace-nowrap text-lg font-medium text-gray-700">Show study spots near:</span>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search study spots..."
              className="w-96"
              value={currentInput}
              onChange={e => setCurrentInput(e.target.value)}
              onKeyDown={handleEnterSearch}
            />
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
            <button className="absolute right-12 top-1/2 -translate-y-1/2" onClick={handleClearClick}> <X /> </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={handleSearchClick}> <Search /> </button>
          </div>
        </div>
        <br />
        {showStudySpots()}
      </div>
    </div>
  );
}