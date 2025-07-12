import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin, destinations } = req.body;
  if (!origin || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: 'Missing origin or destinations' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  const originsParam = encodeURIComponent(origin);
  const destinationsParam = encodeURIComponent(destinations.join('|'));
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&key=${apiKey}&mode=driving`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch distance matrix', details: error });
  }
} 