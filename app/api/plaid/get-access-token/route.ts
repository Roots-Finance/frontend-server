// app/api/plaid/get-access-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPlaidToken } from '@/services/plaidTokenService';

export async function POST(request: NextRequest) {
  try {
    const { userId, itemId } = await request.json();

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'User ID and Item ID are required' },
        { status: 400 }
      );
    }

    // Make sure userId is properly decoded if it was URL encoded
    const decodedUserId = decodeURIComponent(userId);
    
    // Get the Plaid token document from the database
    const tokenDoc = await getPlaidToken(decodedUserId, itemId);
    
    if (!tokenDoc) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Return just the access token
    return NextResponse.json({
      accessToken: tokenDoc.accessToken
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error retrieving access token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve access token',
        details: error.message
      },
      { status: 500 }
    );
  }
}