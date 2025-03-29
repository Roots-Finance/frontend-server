// app/api/plaid/exchange-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPlaidClient } from '@/lib/plaid';
import { savePlaidToken, invalidateOldToken } from '@/services/plaidTokenService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, metadata, userId, existingItemId } = body;

    if (!public_token || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const plaidClient = getPlaidClient();
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    
    // Calculate token expiration (optional - adjust as needed for your use case)
    // Here we're setting it to expire in 90 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    // Save the token to MongoDB
    await savePlaidToken(userId, accessToken, itemId, expiresAt);
    
    // If this was a reconnection and we have an existing itemId,
    // mark the old token as invalid
    if (existingItemId && existingItemId !== itemId) {
      await invalidateOldToken(userId, existingItemId);
    }
    
    // Get basic institution info for the response
    const institution = metadata?.institution?.name || 'Your financial institution';
    
    return NextResponse.json({
      success: true,
      institution,
      message: `Successfully connected to ${institution}`
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to financial institution',
        details: error.response?.data?.error_message || error.message
      },
      { status: 500 }
    );
  }
}