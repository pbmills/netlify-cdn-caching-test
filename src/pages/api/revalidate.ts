import type { APIRoute } from 'astro';
import { clearCache, getCacheStats } from '../../js/fetchData';

/**
 * Cache Revalidation Endpoint
 * 
 * GET /api/revalidate?secret=your-secret
 * POST /api/revalidate (with x-revalidate-secret header)
 * 
 * This endpoint allows you to trigger a cache clear when content changes.
 * 
 * Environment Variables:
 * - ASTRO_REVALIDATE_SECRET: Secret key to authenticate requests
 */

export const GET: APIRoute = async ({ request }) => {
  const secret = process.env.ASTRO_REVALIDATE_SECRET || import.meta.env.ASTRO_REVALIDATE_SECRET;
  const requestSecret = new URL(request.url).searchParams.get('secret');
  
  // If no secret is configured, allow requests (for testing)
  // In production, you should set ASTRO_REVALIDATE_SECRET
  if (!secret) {
    console.warn('[REVALIDATE] No ASTRO_REVALIDATE_SECRET configured - allowing all requests');
    // Still clear cache even without secret (for testing)
  } else if (requestSecret !== secret) {
    console.error('[REVALIDATE] Invalid secret provided');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Unauthorized',
      message: 'Invalid or missing secret parameter'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get stats before clearing
    const statsBefore = getCacheStats();
    
    // Clear the cache
    clearCache();
    
    console.log(`[REVALIDATE] Cache cleared via GET request (cleared ${statsBefore.size} cached entries)`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cache cleared successfully',
      clearedEntries: statsBefore.size,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (error) {
    console.error('[REVALIDATE] Error clearing cache:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to clear cache' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.ASTRO_REVALIDATE_SECRET || import.meta.env.ASTRO_REVALIDATE_SECRET;
  
  // If no secret is configured, reject all requests
  if (!secret) {
    console.error('[REVALIDATE] No ASTRO_REVALIDATE_SECRET configured');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Revalidation not configured' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate the secret from the request
  const requestSecret = request.headers.get('x-revalidate-secret') || 
                        request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (requestSecret !== secret) {
    console.error('[REVALIDATE] Invalid secret provided');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Unauthorized' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get stats before clearing
    const statsBefore = getCacheStats();
    
    // Clear the cache
    clearCache();
    
    // Parse the webhook payload for logging (optional)
    let payload = null;
    try {
      payload = await request.json();
    } catch {
      // Payload is optional
    }

    const logMessage = payload?.entry?.title 
      ? `Entry updated: "${payload.entry.title}"` 
      : 'Cache cleared via webhook';
    
    console.log(`[REVALIDATE] ${logMessage} (cleared ${statsBefore.size} cached entries)`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cache cleared successfully',
      clearedEntries: statsBefore.size,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (error) {
    console.error('[REVALIDATE] Error clearing cache:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to clear cache' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};