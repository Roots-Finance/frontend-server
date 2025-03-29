// app/api/plaid/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllUserPlaidTokens, validatePlaidToken } from '@/services/plaidTokenService';

export async function POST(request: NextRequest) {
  console.log('API route handler called'); // Add this for debugging
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  // Make sure userId is properly decoded if it was URL encoded
  const decodedUserId = userId ? decodeURIComponent(userId) : null;

  if (!decodedUserId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' }, 
      { status: 400 }
    );
  }

  try {
    // Check if user has any Plaid tokens
    const userTokens = await getAllUserPlaidTokens(decodedUserId);
    
    // If no tokens found, user needs to set up Plaid
    if (!userTokens || userTokens.length === 0) {
      return NextResponse.json({
        hasPlaid: false,
        isValid: false
      });
    }

    // Get the latest token (first in the sorted array)
    const primaryToken = userTokens[0];
    
    // Validate the token with Plaid API
    const validationResult = await validatePlaidToken(decodedUserId, primaryToken.itemId);
    
    return NextResponse.json({
      hasPlaid: true,
      isValid: validationResult.valid,
      itemId: primaryToken.itemId,
      error: validationResult.error
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error checking Plaid status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check Plaid status',
        hasPlaid: false,
        isValid: false
      },
      { status: 500 }
    );
  }
}