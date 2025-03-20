// http-utils.ts - Utility functions for HTTP responses

// @ts-ignore: Local module
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Create a success response with appropriate headers
 * @param data The data to include in the response
 * @param status HTTP status code (defaults to 200)
 * @returns Response object
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), { 
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Create an error response with appropriate headers
 * @param message Error message
 * @param status HTTP status code (defaults to 500)
 * @returns Response object
 */
export function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), { 
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Create a CORS options response
 * @returns Response object for OPTIONS requests
 */
export function createCorsOptionsResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}
