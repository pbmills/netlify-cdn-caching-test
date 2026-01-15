import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Note: Netlify CDN cache purging can be done via:
    // 1. Netlify API: POST to https://api.netlify.com/api/v1/sites/{site_id}/purge
    // 2. Netlify Build Plugin: @netlify/plugin-cache
    // 3. Manual purge via Netlify Dashboard
    // 
    // For this demo, we return a success message and set no-cache headers
    // The cache will naturally expire based on Cache-Control headers (1 hour)
    
    const response = {
      success: true,
      message: 'Cache purge request received. The CDN cache will expire based on Cache-Control headers (1 hour). For immediate purge, use Netlify API or Dashboard.',
      timestamp: new Date().toISOString(),
      clientIP: clientAddress || 'unknown',
      note: 'To implement full cache purging, add Netlify API token and call their purge endpoint',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Cache-Cleared': 'true',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

// Also allow GET for easier testing
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'Use POST method to clear cache',
      endpoint: '/api/clear-cache',
      method: 'POST',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};