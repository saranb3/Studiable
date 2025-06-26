import { useState } from "react";
import { Search, X} from 'lucide-react';



export default function Home() {
  const [currentInput, setCurrentInput] = useState(''); 
  const [selectedLocation, setSelectedLocation] = useState(''); 

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
      location: "101 เดอะเติร์ธเพลส ห้อง 112-A ชั้น 1", 
      rating: 4.7,
      Wifi: true, 
      Coffee: true, 
      Quiet: true, 
      Outlets: true,
      openTime: "8:00 AM - 10:00 PM"
    }, 

    {
      name: "True Cafe", 
      location: "ศูนย์การค้า วิสซ์ดอม วัน-โอ-วัน", 
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
  
  function showStudySpots(){ 
    if(selectedLocation) { 
      return (
        <ul>
          {studySpots.map((spot, idx) => (
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

  
    return ( 
      <div>
        <h1> Find a Studiable Space!</h1>
        <div className="relative"> 
          <input type="text" placeholder="Search study spots..."
          value = {currentInput} 
          onChange= {e => setCurrentInput(e.target.value)}
          onKeyDown={handleEnterSearch}/>
          <button className="absolute right-400 top-1/2 -translate-y-1/2" onClick={handleClearClick}> <X /> </button>
          <button className="absolute right-410 top-1/2 -translate-y-1/2" onClick={handleSearchClick}> <Search /> </button>
        </div> 

      {showLocation()}
      <br/>
      {showStudySpots()}
    </div>
  );
}