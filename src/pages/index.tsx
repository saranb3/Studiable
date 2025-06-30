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

  function showLocation(){ 
    if(selectedLocation) { 
      return <p>Showing study spots near: {selectedLocation}</p>
    }
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
                <div>Name: {spot.name}</div>
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
    setCurrentInput(suggestion.description);
    setShowSuggestions(false);
    // Optionally: setSelectedLocation(suggestion.description);
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
      <h1> Find a Studiable Space!</h1>
      <div className="relative"> 
        <input type="text" placeholder="Search study spots..."
          value={currentInput} 
          onChange={e => setCurrentInput(e.target.value)}
          onKeyDown={handleEnterSearch}/>
        <button className="absolute right-400 top-1/2 -translate-y-1/2" onClick={handleClearClick}> <X /> </button>
        <button className="absolute right-410 top-1/2 -translate-y-1/2" onClick={handleSearchClick}> <Search /> </button>
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
      </div>
      {showLocation()}
      <br />
      {showStudySpots()}
    </div>
  );
}