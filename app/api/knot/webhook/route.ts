// app/api/knot/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for Knot API webhooks
 * Register this endpoint in your Knot API dashboard to receive event notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook payload
    const webhookData = await request.json();
    
    // Log the webhook for debugging
    console.log('Received Knot webhook:', JSON.stringify(webhookData, null, 2));
    
    // TODO: Verify webhook signature if Knot API provides one
    
    // Process different webhook events
    switch (webhookData.event_type) {
      case 'AUTHENTICATED':
        // User has successfully authenticated with a merchant
        // This is when you should call the switch_card endpoint
        await handleMerchantAuthenticated(webhookData);
        break;
        
      case 'CARD_SWITCHED':
        // Card was successfully switched at the merchant
        await handleCardSwitched(webhookData);
        break;
        
      case 'ERROR':
        // An error occurred
        console.error('Knot API webhook error:', webhookData.error);
        break;
        
      default:
        console.log('Unhandled webhook event:', webhookData.event_type);
    }
    
    // Always return a 200 status to acknowledge receipt of the webhook
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    
    // Even on error, return 200 to acknowledge receipt
    // This prevents Knot from retrying the webhook unnecessarily
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 200 }
    );
  }
}

/**
 * Handle the AUTHENTICATED webhook event
 * Call the switch_card endpoint to update the card information
 */
async function handleMerchantAuthenticated(webhookData: any) {
  const { session_id, merchant_id } = webhookData;
  
  try {
    // Get Knot API credentials
    const clientId = process.env.NEXT_PUBLIC_KNOTAPI_CLIENT_ID;
    const secret = process.env.KNOTAPI_CLIENT_SECRET;
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://secure.knotapi.com'
      : 'https://secure.development.knotapi.com';
    
    if (!clientId || !secret) {
      throw new Error('Missing Knot API credentials');
    }
    
    // Call Knot API to switch the card
    // You would typically get the card details from your database
    const cardDetails = {
      number: '4242424242424242', // Example card number, replace with real data
      expiration: {
        month: 12,
        year: 2030
      },
      cvv: '123'
    };
    
    const response = await fetch(`${baseUrl}/card/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Knot-Version': '2.0'
      },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        session_id: session_id,
        merchant_id: merchant_id,
        card: cardDetails
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to switch card');
    }
    
    const result = await response.json();
    console.log('Card switched successfully:', result);
    
  } catch (error) {
    console.error('Error switching card:', error);
    // Handle the error appropriately
  }
}

/**
 * Handle the CARD_SWITCHED webhook event
 * Update your database or perform any other necessary actions
 */
async function handleCardSwitched(webhookData: any) {
  const { session_id, merchant_id, user_id } = webhookData;
  
  try {
    // Update your database to record that the card was switched
    // This might involve updating a user record, logging the event, etc.
    console.log(`Card successfully switched for user ${user_id} at merchant ${merchant_id}`);
    
    // Additional business logic can go here
    
  } catch (error) {
    console.error('Error processing card switched event:', error);
    // Handle the error appropriately
  }
}