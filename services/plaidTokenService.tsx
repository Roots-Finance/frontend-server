// services/plaidTokenService.ts
import clientPromise from '@/lib/mongodb';
import { getPlaidClient } from '@/lib/plaid';
import { Db, Collection } from 'mongodb';
import { IPlaidToken, PlaidToken } from '@/models/PlaidToken';

// Token validation response interface
export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  item?: any;
}

export async function savePlaidToken(
  userId: string, 
  accessToken: string, 
  itemId: string, 
  expiresAt: Date | null = null
): Promise<any> {
  const client = await clientPromise;
  const db: Db = client.db(process.env.MONGODB_DB as string);
  const collection: Collection<IPlaidToken> = db.collection('plaidTokens');
  
  const plaidToken = new PlaidToken(userId, accessToken, itemId, expiresAt);
  
  // Check if a token already exists for this user and item
  const existingToken = await collection.findOne({ 
    userId, 
    itemId 
  });
  
  if (existingToken) {
    // Update existing token
    return collection.updateOne(
      { userId, itemId },
      { 
        $set: { 
          accessToken,
          expiresAt,
          updatedAt: new Date() 
        } 
      }
    );
  } else {
    // Insert new token
    return collection.insertOne(plaidToken);
  }
}

export async function getPlaidToken(
  userId: string, 
  itemId: string
): Promise<IPlaidToken | null> {
  const client = await clientPromise;
  const db: Db = client.db(process.env.MONGODB_DB as string);
  
  return db.collection<IPlaidToken>('plaidTokens').findOne({ userId, itemId });
}

export async function getAllUserPlaidTokens(userId: string): Promise<IPlaidToken[]> {
  const client = await clientPromise;
  const db: Db = client.db(process.env.MONGODB_DB as string);
  
  return db.collection<IPlaidToken>('plaidTokens')
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function validatePlaidToken(
  userId: string, 
  itemId: string
): Promise<TokenValidationResult> {
  try {
    // Get the token from database
    const tokenDoc = await getPlaidToken(userId, itemId);
    
    if (!tokenDoc) {
      return { valid: false, error: 'Token not found' };
    }
    
    // Check if token is expired
    if (tokenDoc.expiresAt && new Date() > new Date(tokenDoc.expiresAt)) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify token with Plaid API
    const plaidClient = getPlaidClient();
    const response = await plaidClient.itemGet({
      access_token: tokenDoc.accessToken
    });
    
    // If we get here without error, token is valid
    return { valid: true, item: response.data.item };
    
  } catch (error: any) {
    console.error('Error validating Plaid token:', error);
    
    return { 
      valid: false, 
      error: error.response?.data?.error_message || error.message 
    };
  }
}

export async function invalidateOldToken(
  userId: string, 
  oldItemId: string
): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB as string);
    
    // Mark as invalid by setting expiresAt to a past date
    await db.collection('plaidTokens').updateOne(
      { userId, itemId: oldItemId },
      { $set: { expiresAt: new Date(0), updatedAt: new Date() } }
    );
  } catch (error) {
    console.error('Error invalidating old token:', error);
    // Continue anyway since this is just cleanup
  }
}