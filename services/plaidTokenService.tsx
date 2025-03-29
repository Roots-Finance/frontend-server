// services/plaidTokenService.ts
import { getPlaidClient } from '@/lib/plaid';
import { IPlaidToken } from '@/models/PlaidToken';

// Token validation response interface
export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  item?: any;
}

// Get the backend URI from environment variables
const BACKEND_URI = process.env.BACKEND_URI || '';

/**
 * Save a Plaid token to the database
 */
export async function savePlaidToken(
  userId: string, 
  accessToken: string, 
  itemId: string, 
  expiresAt: Date | null = null
): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URI}/plaid-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        accessToken,
        itemId,
        expiresAt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save Plaid token: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving Plaid token:', error);
    throw error;
  }
}

/**
 * Get a specific Plaid token for a user and item
 */
export async function getPlaidToken(
  userId: string, 
  itemId: string
): Promise<IPlaidToken | null> {
  try {
    const response = await fetch(
      `${BACKEND_URI}/plaid-tokens/${encodeURIComponent(userId)}/${encodeURIComponent(itemId)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get Plaid token: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Plaid token:', error);
    throw error;
  }
}

/**
 * Get all Plaid tokens for a user
 */
export async function getAllUserPlaidTokens(userId: string): Promise<IPlaidToken[]> {
  try {
    const response = await fetch(
      `${BACKEND_URI}/plaid-tokens/user/${encodeURIComponent(userId)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to get Plaid tokens: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting all user Plaid tokens:', error);
    return [];
  }
}

/**
 * Validate a Plaid token
 */
export async function validatePlaidToken(
  userId: string, 
  itemId: string
): Promise<TokenValidationResult> {
  try {
    // First, try to get the token from our backend
    const response = await fetch(
      `${BACKEND_URI}/plaid-tokens/validate/${encodeURIComponent(userId)}/${encodeURIComponent(itemId)}`
    );

    // If our backend has a validation endpoint, use that result
    if (response.ok) {
      return await response.json();
    }

    // If backend doesn't have validation endpoint, get token and validate ourselves
    const tokenResponse = await fetch(
      `${BACKEND_URI}/plaid-tokens/${encodeURIComponent(userId)}/${encodeURIComponent(itemId)}`
    );
    
    if (!tokenResponse.ok) {
      return { valid: false, error: 'Token not found' };
    }
    
    const tokenDoc = await tokenResponse.json();
    
    // Check if token is expired
    if (tokenDoc.expiresAt && new Date() > new Date(tokenDoc.expiresAt)) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify token with Plaid API
    const plaidClient = getPlaidClient();
    const plaidResponse = await plaidClient.itemGet({
      access_token: tokenDoc.accessToken
    });
    
    // If we get here without error, token is valid
    return { valid: true, item: plaidResponse.data.item };
    
  } catch (error: any) {
    console.error('Error validating Plaid token:', error);
    
    return { 
      valid: false, 
      error: error.response?.data?.error_message || error.message 
    };
  }
}

/**
 * Invalidate an old token
 */
export async function invalidateOldToken(
  userId: string, 
  oldItemId: string
): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URI}/plaid-tokens/invalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        itemId: oldItemId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to invalidate token: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error invalidating old token:', error);
    // Continue anyway since this is just cleanup
  }
}