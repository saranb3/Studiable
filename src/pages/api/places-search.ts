import type { NextApiRequest, NextApiResponse } from 'next';

type PlaceResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  price_level?: number;
  user_ratings_total?: number;
};

type StudySpot = {
  name: string;
  location: string;
  rating: number;
  Wifi: boolean;
  Coffee: boolean;
  Quiet: boolean;
  Outlets: boolean;
  openTime: string;
  coordinates: { lat: number; lng: number };
  place_id: string;
  photos?: string[];
  price_level?: number;
  user_ratings_total?: number;
};

type ResponseData = {
  studySpots?: StudySpot[];
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { lat, lng, radius = 5000 } = req.body; // radius in meters, default 5km

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Missing coordinates' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'Google Maps API key not configured' });
  }

  try {
    const studySpots: StudySpot[] = [];
    
    console.log(`Searching for places near ${lat}, ${lng} within ${radius}m`);
    
    // Search for different types of places that could be good for studying
    const searchQueries = [
      'cafe',
      'library',
      'coworking space',
      'coffee shop'
    ];

    for (const query of searchQueries) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=establishment&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
      
      console.log(`Searching for: ${query}`);
      console.log(`URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log(`${query} search status: ${data.status}`);
      console.log(`${query} results count: ${data.results ? data.results.length : 0}`);

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          console.log(`Found place: ${place.name}, types: ${place.types?.join(', ')}, rating: ${place.rating}`);
          
          // Skip if we already have this place (using name + coordinates as unique identifier)
          const placeKey = `${place.name}_${place.geometry.location.lat}_${place.geometry.location.lng}`;
          if (studySpots.find(spot => `${spot.name}_${spot.coordinates.lat}_${spot.coordinates.lng}` === placeKey)) {
            console.log(`Skipping duplicate: ${place.name}`);
            continue;
          }

          // Filter for places that are likely good for studying
          const isGoodForStudying = 
            place.types.includes('cafe') ||
            place.types.includes('library') ||
            place.types.includes('book_store') ||
            place.name.toLowerCase().includes('coffee') ||
            place.name.toLowerCase().includes('cafe') ||
            place.name.toLowerCase().includes('library') ||
            place.name.toLowerCase().includes('coworking') ||
            place.name.toLowerCase().includes('workspace');

          if (isGoodForStudying) {
            console.log(`${place.name} is good for studying, fetching details...`);
            
            // Get more detailed information about the place
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,geometry,opening_hours,photos,types,price_level,user_ratings_total&key=${apiKey}`;
            
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            console.log(`Details API response for ${place.name}: status=${detailsData.status}, error=${detailsData.error_message || 'none'}`);
            
            if (detailsData.status === 'OK' && detailsData.result) {
              const placeDetails = detailsData.result;
              
              // Extract opening hours
              let openTime = 'Hours not available';
              if (placeDetails.opening_hours && placeDetails.opening_hours.weekday_text) {
                // Get today's hours (0 = Sunday, 1 = Monday, etc.)
                const today = new Date().getDay();
                const todayHours = placeDetails.opening_hours.weekday_text[today === 0 ? 6 : today - 1];
                openTime = todayHours || 'Hours not available';
              }

              // Extract photo references
              const photos = placeDetails.photos?.map((photo: any) => 
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
              ) || [];

              // Determine amenities based on place type and name
              const isCafe = placeDetails.types.includes('cafe') || 
                           placeDetails.name.toLowerCase().includes('coffee') ||
                           placeDetails.name.toLowerCase().includes('cafe') ||
                           placeDetails.name.toLowerCase().includes('starbucks') ||
                           placeDetails.name.toLowerCase().includes('true coffee');
              
              const isLibrary = placeDetails.types.includes('library');
              const isCoworking = placeDetails.name.toLowerCase().includes('coworking') ||
                                placeDetails.name.toLowerCase().includes('workspace');

              const studySpot: StudySpot = {
                name: placeDetails.name,
                location: placeDetails.formatted_address,
                rating: placeDetails.rating || 0,
                Wifi: isCafe || isLibrary || isCoworking, // Most cafes, libraries, and coworking spaces have WiFi
                Coffee: isCafe,
                Quiet: isLibrary || isCoworking,
                Outlets: isCafe || isLibrary || isCoworking, // Most study-friendly places have outlets
                openTime: openTime,
                coordinates: {
                  lat: placeDetails.geometry.location.lat,
                  lng: placeDetails.geometry.location.lng
                },
                place_id: placeDetails.place_id,
                photos: photos,
                price_level: placeDetails.price_level,
                user_ratings_total: placeDetails.user_ratings_total
              };

              studySpots.push(studySpot);
              console.log(`Added study spot: ${studySpot.name}`);
            } else {
              console.log(`Failed to get details for ${place.name}`);
            }
          } else {
            console.log(`${place.name} not suitable for studying`);
          }
        }
      }
    }

    // Remove duplicates using name+coordinates as unique identifier and sort by rating
    console.log(`Total study spots before deduplication: ${studySpots.length}`);
    
    const uniqueStudySpots = studySpots.filter((spot, index, self) => {
      const spotKey = `${spot.name}_${spot.coordinates.lat}_${spot.coordinates.lng}`;
      const firstIndex = self.findIndex(s => `${s.name}_${s.coordinates.lat}_${s.coordinates.lng}` === spotKey);
      const isUnique = index === firstIndex;
      if (!isUnique) {
        console.log(`Removing duplicate: ${spot.name} (coordinates: ${spot.coordinates.lat}, ${spot.coordinates.lng})`);
      }
      return isUnique;
    });

    console.log(`Study spots after deduplication: ${uniqueStudySpots.length}`);

    const sortedSpots = uniqueStudySpots.sort((a, b) => b.rating - a.rating);
    console.log(`Study spots after sorting: ${sortedSpots.length}`);
    
    const finalSpots = sortedSpots.slice(0, 20); // Limit to top 20 results
    console.log(`Final study spots count: ${finalSpots.length}`);
    console.log('Study spots:', finalSpots.map(s => `${s.name} (${s.place_id})`));

    res.status(200).json({ studySpots: finalSpots });

  } catch (error) {
    console.error('Error fetching study spots:', error);
    res.status(500).json({ message: 'Failed to fetch study spots' });
  }
}