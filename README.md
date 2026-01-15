# Netlify CDN Caching Demo

This Astro application demonstrates how Netlify CDN caching can dramatically speed up slow API responses. The app fetches data from the REST Countries API (which can be slow with large datasets) and showcases the caching benefits.

## Features

- 🌍 Fetches data from REST Countries API (250+ countries with detailed information)
- ⚡ CDN caching configured via Netlify headers
- 🗑️ Cache clearing endpoint at `/api/clear-cache`
- 📊 Real-time cache status display
- 🎨 Beautiful, responsive UI

## How It Works

1. **First Request**: The page fetches data from the REST Countries API. This can take 1-3 seconds.
2. **Cached Requests**: Subsequent requests are served from Netlify's CDN cache, loading in milliseconds.
3. **Cache Status**: The page displays whether the response came from cache (HIT) or the origin (MISS).

## Setup

### Prerequisites

- Node.js 18+ and npm
- A Netlify account (for deployment)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:4321](http://localhost:4321)

### Build for Production

```bash
npm run build
```

## Deployment to Netlify

1. **Via Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

2. **Via Git:**
   - Push your code to GitHub/GitLab
   - Connect your repository to Netlify
   - Netlify will automatically detect Astro and deploy

3. **Via Netlify UI:**
   - Drag and drop the `dist` folder after running `npm run build`

## Caching Configuration

The caching is configured in `netlify.toml`:

- **Main pages**: Cache for 1 hour (`s-maxage=3600`)
- **Stale-while-revalidate**: Serve stale content for up to 24 hours while revalidating
- **API endpoints**: Same caching strategy

### Cache Headers Explained

- `s-maxage=3600`: CDN cache duration (1 hour)
- `stale-while-revalidate=86400`: Serve stale content for 24 hours while fetching fresh data in background
- `must-revalidate`: HTML pages must revalidate (no stale content)

## API Endpoints

### Revalidate Cache

**GET** `/api/revalidate?secret=your-secret`  
**POST** `/api/revalidate` (with `x-revalidate-secret` header)

Manually trigger a cache clear. Requires a secret key for security.

**Setup:**
1. Set the `ASTRO_REVALIDATE_SECRET` environment variable in Netlify
2. Use the secret in the query parameter: `/api/revalidate?secret=your-secret`

**How it works:**
- Validates the secret before clearing cache
- Uses cache-busting to bypass CDN cache
- Can be called from webhooks or manually via URL
- Perfect for demonstrating cache behavior

**Example:**
```bash
# Via GET request
curl "https://your-site.netlify.app/api/revalidate?secret=your-secret"

# Via POST request
curl -X POST "https://your-site.netlify.app/api/revalidate" \
  -H "x-revalidate-secret: your-secret"
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Testing Cache Behavior

1. **First Load**: Visit the page and note the load time (should be 1-3 seconds)
2. **Cached Load**: Refresh the page - it should load much faster (< 100ms)
3. **Check Cache Status**: Look at the "Cache Status" indicator - it should show "HIT" on cached requests
4. **Clear Cache**: Click the "Clear Cache" button to see the difference


## Project Structure

```
.
├── src/
│   └── pages/
│       ├── index.astro      # Main page with country data
│       └── api/
│           └── clear-cache.ts # Cache clearing endpoint
├── astro.config.mjs         # Astro configuration
├── netlify.toml             # Netlify configuration & caching headers
├── package.json
└── README.md
```

## License

MIT