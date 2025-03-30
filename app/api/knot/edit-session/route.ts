// app/api/knot/extend-session/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for extending a Knot API session
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { session_id } = body;
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing required field: session_id' },
        { status: 400 }
      );
    }
    
    // Get Knot API credentials from environment variables
    const clientId = process.env.NEXT_PUBLIC_KNOTAPI_CLIENT_ID;
    const secret = process.env.KNOTAPI_CLIENT_SECRET;
    
    if (!clientId || !secret) {
      console.error('Missing Knot API credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Get Knot API base URL from environment
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://secure.knotapi.com'
      : 'https://development.knotapi.com';

    // Create the basic auth credentials
    const authString = `${clientId}:${secret}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    // Call Knot API to extend the session
    const response = await fetch(`${baseUrl}/session/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Knot-Version': '2.0',
        'Authorization': `Basic ${base64Auth}`
      },
      body: JSON.stringify({
        session_id: session_id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Knot API Error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to extend session' },
        { status: response.status }
      );
    }

    // Return the extended session data
    const sessionData = await response.json();
    
    return NextResponse.json(sessionData);
  } catch (error: any) {
    console.error('Error extending Knot session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}