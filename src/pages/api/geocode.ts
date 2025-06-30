import type { NextApiRequest, NextApiResponse } from "next";

type Coordinate = {
  address: string;
  lat: number;
  lng: number;
};

type ResponseData = {
  coordinates?: Coordinate[];
  message?: string;
};

async function geocodeSingleAddress(address:string, apiKey: string) { 
    try { 
    
    // Step 1: Encode the address - what JavaScript function encodes text for URLs?
    const encodedAddress = encodeURIComponent(address);
    
    // Step 2: Build the Google API URL - remember the pattern from earlier?
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    // Step 3: Make the fetch request - similar to how your frontend calls your API
    const response = await fetch(url); 
    
    // Step 4: Parse the JSON response
    const data = await response.json();
    
    // Step 5: Check if Google found the address (status === 'OK' and results exist)
    if (data.status === 'OK' && data.results.length > 0 ) {
    // Step 6: Extract lat/lng from the nested response structure
        return data.results[0].geometry.location
    }
    
    
    // Step 7: Return the result
    console.warn(`Geocoding failed for address: ${address}. Status: ${data.status}`);
    return null;
    } 
    catch (error) { 
    
        // Step 8: Handle any errors (network issues, etc.)
        console.error("An error occurred during geocoding:", error);
        return null;
    }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>){

    const apiKey = process.env.GOOGLE_MAPS_API_KEY; 

    if (!apiKey) { 
        return res.status(500).json({message: "Invalid api key."});
    }

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed." });
      }
      
      const addresses = req.body.addresses;
      
      if (!addresses || !Array.isArray(addresses)) {
        return res.status(400).json({ message: "Invalid addresses" });
      }
      // Create the promises array first, then pass it to Promise.all
      const geocodingPromises = addresses.map(address => geocodeSingleAddress(address, apiKey));
      const geocodeResults = await Promise.all(geocodingPromises);

    const coordinates = geocodeResults.map((result, index) => {
        if (result) { 
            return { 
                address: addresses[index],
                lat: result.lat,
                lng: result.lng
            };
        } else {
            return { 
                address: addresses[index],
                lat: null,
                lng: null
            };
        }
    });
    
    res.status(200).json({ coordinates });
}
