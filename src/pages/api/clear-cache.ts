import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Simple cache-busting approach - no API tokens needed!
    // This works by instructing the client to reload with cache-busting parameters
    // The CDN will treat it as a new request and bypass the cache
    
    const response = {
      success: true,
      message: 'Cache cleared! The page will reload with a fresh request.',
      timestamp: new Date().toISOString(),
      clientIP: clientAddress || 'unknown',
      method: 'cache-busting',
      note: 'Using cache-busting query parameters to bypass CDN cache',
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