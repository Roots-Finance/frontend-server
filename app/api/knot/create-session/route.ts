// app/api/knot/create-session/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for creating a new Knot API session
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { 
      user_id, 
      email, 
      phone_number,
      processor_token,
      card_blocked = false,
      card_has_funds = true
    } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
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

    // Prepare the request payload
    const payload = {
      type: "card_switcher",
      phone_number: phone_number,
      email: email,
      external_user_id: user_id,
      card: {
        blocked: card_blocked,
        has_funds: card_has_funds
      },
      card_id: user_id,
      processor_token: processor_token
    };
    
    // Create the basic auth credentials
    const authString = `${clientId}:${secret}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    // Call Knot API to create a session
    const response = await fetch(`${baseUrl}/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Knot-Version': '2.0',
        'Authorization': `Basic ${base64Auth}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Knot API Error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to create session' },
        { status: response.status }
      );
    }

    // Return the session data
    const sessionData = await response.json();
    
    return NextResponse.json(sessionData);
  } catch (error: any) {
    console.error('Error creating Knot session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}