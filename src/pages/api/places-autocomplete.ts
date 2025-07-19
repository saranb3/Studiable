import type { NextApiRequest, NextApiResponse } from "next";

// This defines the structure of a single prediction we'll send back to the client.
type Prediction = {
  description: string; // The human-readable name of the location (e.g., "Bangkok, Thailand")
  place_id: string; // A unique ID from Google to fetch details about this place later
};

// This defines the structure of our API's response.
// It can either contain an array of predictions or an error message.
type ResponseData = {
  predictions?: Prediction[];
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 1. Check if the request method is POST. We only want to handle POST requests.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST"); // Let the client know which method is allowed
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 2. Extract the user's search input from the request body.
    const { input } = req.body;

    // 3. Validate that the input exists and is a non-empty string.
    if (!input || typeof input !== "string") {
      return res.status(400).json({ message: "Invalid or missing input" });
    }

    // 4. Get the Google Maps API key from environment variables on the server.
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is not configured.");
      return res
        .status(500)
        .json({ message: "API key is not configured on the server." });
    }

    // 5. Call the Google Places Autocomplete API.
    const encodedInput = encodeURIComponent(input);
    // Let's restrict results to Thailand since the example data is there.
    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedInput}&key=${apiKey}&components=country:th`;

    const googleResponse = await fetch(googleApiUrl);
    const data = await googleResponse.json();

    // Check if the Google API call was successful.
    if (data.status !== "OK") {
      console.error(
        "Google Places API Error:",
        data.status,
        data.error_message
      );
      return res
        .status(500)
        .json({ message: `Google Places API error: ${data.status}` });
    }

    // 6. Format the results to match our `Prediction` type and limit them to the top 5.
    const predictions: Prediction[] = data.predictions
      .map((p: { description: string; place_id: string }) => ({
        description: p.description,
        place_id: p.place_id,
      }))
      .slice(0, 3);

    // 7. Send the successful response back to the client.
    res.status(200).json({ predictions });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    res.status(500).json({ message: "An internal server error occurred." });
  }
}
