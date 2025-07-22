import type { NextApiRequest, NextApiResponse } from "next";

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
  distance?: number; // Distance in km by road
};

type ResponseData = {
  studySpots?: StudySpot[];
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { lat, lng, maxDistance = 10 } = req.body; // maxDistance in km

  if (!lat || !lng) {
    return res.status(400).json({ message: "Missing coordinates" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ message: "Google Maps API key not configured" });
  }

  try {
    const studySpots: StudySpot[] = [];

    console.log(
      `Searching for places near ${lat}, ${lng}, filtering to ${maxDistance}km by road distance`
    );

    // Use a generous radius for Google search (we'll filter by road distance later)
    const searchRadius = Math.max(maxDistance * 1500, 15000); // 1.5x the max distance or 15km minimum

    // Search for different types of places that could be good for studying
    const searchQueries = ["cafe", "library", "coworking space", "coffee shop"];

    for (const query of searchQueries) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchRadius}&type=establishment&keyword=${encodeURIComponent(
        query
      )}&key=${apiKey}`;

      console.log(`Searching for: ${query}`);

      const response = await fetch(searchUrl);
      const data = await response.json();

      console.log(`${query} search status: ${data.status}`);
      console.log(
        `${query} results count: ${data.results ? data.results.length : 0}`
      );

      if (data.status === "OK" && data.results) {
        for (const place of data.results) {
          console.log(
            `Found place: ${place.name}, types: ${place.types?.join(
              ", "
            )}, rating: ${place.rating || "No rating"}`
          );

          // Skip if we already have this place (using name + coordinates as unique identifier)
          const placeKey = `${place.name}_${place.geometry.location.lat}_${place.geometry.location.lng}`;
          if (
            studySpots.find(
              (spot) =>
                `${spot.name}_${spot.coordinates.lat}_${spot.coordinates.lng}` ===
                placeKey
            )
          ) {
            console.log(`Skipping duplicate: ${place.name}`);
            continue;
          }

          // Filter for places that are likely good for studying
          const isGoodForStudying =
            place.types.includes("cafe") ||
            place.types.includes("library") ||
            place.types.includes("book_store") ||
            place.name.toLowerCase().includes("coffee") ||
            place.name.toLowerCase().includes("cafe") ||
            place.name.toLowerCase().includes("library") ||
            place.name.toLowerCase().includes("coworking") ||
            place.name.toLowerCase().includes("workspace");

          if (isGoodForStudying) {
            console.log(
              `${place.name} is potentially good for studying, fetching details...`
            );

            // Get more detailed information about the place
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,geometry,opening_hours,photos,types,price_level,user_ratings_total&key=${apiKey}`;

            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();

            console.log(
              `Details API response for ${place.name}: status=${
                detailsData.status
              }, error=${detailsData.error_message || "none"}`
            );

            if (detailsData.status === "OK" && detailsData.result) {
              const placeDetails = detailsData.result;

              // Extract opening hours
              let openTime = "Hours not available";
              if (
                placeDetails.opening_hours &&
                placeDetails.opening_hours.weekday_text
              ) {
                // Get today's hours (0 = Sunday, 1 = Monday, etc.)
                const today = new Date().getDay();
                const todayHours =
                  placeDetails.opening_hours.weekday_text[
                    today === 0 ? 6 : today - 1
                  ];
                openTime = todayHours || "Hours not available";
              }

              // Extract photo references
              const photos =
                placeDetails.photos?.map(
                  (photo: {
                    photo_reference: string;
                    height: number;
                    width: number;
                  }) =>
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
                ) || [];

              // Determine amenities based on place type and name
              const isCafe =
                placeDetails.types.includes("cafe") ||
                placeDetails.name.toLowerCase().includes("coffee") ||
                placeDetails.name.toLowerCase().includes("cafe") ||
                placeDetails.name.toLowerCase().includes("starbucks") ||
                placeDetails.name.toLowerCase().includes("true coffee");

              const isLibrary = placeDetails.types.includes("library");
              const isCoworking =
                placeDetails.name.toLowerCase().includes("coworking") ||
                placeDetails.name.toLowerCase().includes("workspace");

              const studySpot: StudySpot = {
                name: placeDetails.name,
                location: placeDetails.formatted_address,
                rating: placeDetails.rating || 0,
                Wifi: isCafe || isLibrary || isCoworking,
                Coffee: isCafe,
                Quiet: isLibrary || isCoworking,
                Outlets: isCafe || isLibrary || isCoworking,
                openTime: openTime,
                coordinates: {
                  lat: placeDetails.geometry.location.lat,
                  lng: placeDetails.geometry.location.lng,
                },
                place_id:
                  place.place_id ||
                  `${place.name}_${place.geometry.location.lat}_${place.geometry.location.lng}`,
                photos: photos,
                price_level: placeDetails.price_level,
                user_ratings_total: placeDetails.user_ratings_total,
              };

              studySpots.push(studySpot);
              console.log(
                `Added study spot: ${studySpot.name} (Total spots: ${studySpots.length})`
              );
            } else {
              console.log(
                `Failed to get details for ${place.name}: ${
                  detailsData.status
                } - ${detailsData.error_message || "Unknown error"}`
              );

              // Fallback: use basic place data from nearby search
              const isCafe =
                place.types.includes("cafe") ||
                place.name.toLowerCase().includes("coffee") ||
                place.name.toLowerCase().includes("cafe") ||
                place.name.toLowerCase().includes("starbucks") ||
                place.name.toLowerCase().includes("true coffee");

              const isLibrary = place.types.includes("library");
              const isCoworking =
                place.name.toLowerCase().includes("coworking") ||
                place.name.toLowerCase().includes("workspace");

              const fallbackStudySpot: StudySpot = {
                name: place.name,
                location: place.vicinity || "Address not available",
                rating: place.rating || 0,
                Wifi: isCafe || isLibrary || isCoworking,
                Coffee: isCafe,
                Quiet: isLibrary || isCoworking,
                Outlets: isCafe || isLibrary || isCoworking,
                openTime: "Hours not available",
                coordinates: {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                },
                place_id:
                  place.place_id ||
                  `${place.name}_${place.geometry.location.lat}_${place.geometry.location.lng}`,
                photos: [],
                price_level: place.price_level,
                user_ratings_total: place.user_ratings_total,
              };

              studySpots.push(fallbackStudySpot);
              console.log(
                `Added fallback study spot: ${fallbackStudySpot.name} (Total spots: ${studySpots.length})`
              );
            }
          } else {
            console.log(`${place.name} not suitable for studying`);
          }
        }
      } else {
        console.log(
          `Search failed with status: ${data.status}, error: ${
            data.error_message || "Unknown error"
          }`
        );
      }
    }

    console.log(`Total study spots found: ${studySpots.length}`);

    // Now filter by actual road distance using Distance Matrix API
    if (studySpots.length > 0) {
      console.log("Calculating road distances...");

      // Process in batches of 25 (Google's limit for Distance Matrix API)
      const batchSize = 25;
      const spotsWithRoadDistance: StudySpot[] = [];

      for (let i = 0; i < studySpots.length; i += batchSize) {
        const batch = studySpots.slice(i, i + batchSize);
        const destinations = batch.map(
          (spot) => `${spot.coordinates.lat},${spot.coordinates.lng}`
        );

        try {
          const originsParam = encodeURIComponent(`${lat},${lng}`);
          const destinationsParam = encodeURIComponent(destinations.join("|"));
          const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&key=${apiKey}&mode=driving`;

          const distanceResponse = await fetch(url);
          const distanceData = await distanceResponse.json();

          if (
            distanceData.status === "OK" &&
            distanceData.rows &&
            distanceData.rows[0] &&
            distanceData.rows[0].elements
          ) {
            batch.forEach((spot, idx) => {
              const element = distanceData.rows[0].elements[idx];
              if (element.status === "OK") {
                const roadDistanceKm = element.distance.value / 1000; // Convert meters to km
                console.log(
                  `${spot.name}: ${roadDistanceKm.toFixed(1)}km by road`
                );

                if (roadDistanceKm <= maxDistance) {
                  spotsWithRoadDistance.push({
                    ...spot,
                    distance: roadDistanceKm,
                  });
                  console.log(
                    `✓ ${
                      spot.name
                    } within ${maxDistance}km (${roadDistanceKm.toFixed(1)}km)`
                  );
                } else {
                  console.log(
                    `✗ ${spot.name} too far (${roadDistanceKm.toFixed(
                      1
                    )}km > ${maxDistance}km)`
                  );
                }
              } else {
                console.log(
                  `Distance calculation failed for ${spot.name}: ${element.status}`
                );
              }
            });
          } else {
            console.log(`Distance Matrix API failed: ${distanceData.status}`);
            // If distance calculation fails, include all spots from this batch without distance
            spotsWithRoadDistance.push(...batch);
          }
        } catch (err) {
          console.error("Error calculating road distances for batch:", err);
          // If distance calculation fails, include all spots from this batch
          spotsWithRoadDistance.push(...batch);
        }
      }

      console.log(
        `Study spots within ${maxDistance}km by road: ${spotsWithRoadDistance.length}`
      );

      // Remove duplicates using name+coordinates as unique identifier
      const uniqueStudySpots = spotsWithRoadDistance.filter(
        (spot, index, self) => {
          const spotKey = `${spot.name}_${spot.coordinates.lat}_${spot.coordinates.lng}`;
          const firstIndex = self.findIndex(
            (s) =>
              `${s.name}_${s.coordinates.lat}_${s.coordinates.lng}` === spotKey
          );
          return index === firstIndex;
        }
      );

      console.log(
        `Study spots after deduplication: ${uniqueStudySpots.length}`
      );

      // Sort by distance (closest first), then by rating
      const sortedSpots = uniqueStudySpots.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        // If one doesn't have distance, put the one with distance first
        if (a.distance && !b.distance) return -1;
        if (!a.distance && b.distance) return 1;
        // If neither has distance, sort by rating
        return b.rating - a.rating;
      });

      const finalSpots = sortedSpots.slice(0, 30); // Limit to top 20 results
      console.log(`Final study spots count: ${finalSpots.length}`);

      res.status(200).json({ studySpots: finalSpots });
    } else {
      res.status(200).json({ studySpots: [] });
    }
  } catch (error) {
    console.error("Error fetching study spots:", error);
    res.status(500).json({ message: "Failed to fetch study spots" });
  }
}
