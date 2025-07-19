# Studiable 📚

A location-based study spot finder that helps users discover cafes, libraries, and coworking spaces perfect for studying. Built with Next.js and powered by Google Places API.

![Studiable Preview](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Studiable+Study+Spot+Finder)

## ✨ Features

- **Smart Location Search** - Auto-complete powered by Google Places API
- **Current Location Detection** - One-click geolocation access
- **Distance-Based Filtering** - Filter results by 1km, 5km, 10km, or 25km radius
- **Study-Friendly Venues** - Automatically identifies cafes, libraries, and coworking spaces
- **Amenity Indicators** - Shows WiFi, coffee, outlets, and quiet space availability
- **Real-Time Data** - Live ratings, photos, and hours from Google Places

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **APIs**: Google Places API, Google Maps Geocoding API, Google Distance Matrix API
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Google Maps API Key with Places API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/studiable.git
cd studiable

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Google Maps API key to .env.local
```

### Environment Setup

Create a `.env.local` file:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Required Google APIs:**

- Places API
- Geocoding API
- Distance Matrix API

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── pages/
│   ├── api/           # API routes for Google Places integration
│   ├── index.tsx      # Main application page
│   └── _app.tsx       # Next.js app configuration
└── styles/
    └── globals.css    # Global styles with Tailwind
```

## 🔧 API Routes

- `/api/places-autocomplete` - Location search suggestions
- `/api/places-search` - Find study spots near coordinates
- `/api/geocode` - Convert addresses to coordinates
- `/api/distance-matrix` - Calculate road distances

## 🌐 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Other Platforms

- **Netlify**: Set build command to `npm run build`
- **Railway**: Connect GitHub repository
- **DigitalOcean**: Use App Platform with automatic GitHub deployment

## 🔑 Key Implementation Details

- **Smart Filtering**: Combines Google Places nearby search with road distance calculation
- **Batch Processing**: Handles Google API rate limits with batched requests
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Graceful fallbacks for API failures

## 📊 Performance

- **Load Time**: ~2s initial load
- **API Efficiency**: Batched requests to minimize Google API calls
- **Caching**: Browser-level caching for repeated searches
- **Responsive**: Optimized for mobile and desktop

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built by [Your Name]** - [Portfolio](https://yourwebsite.com) | [LinkedIn](https://linkedin.com/in/yourprofile)
