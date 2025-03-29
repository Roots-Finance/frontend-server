// app/api/nessi/get-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/db';
import { IAccount } from '@/lib/types';

/**
 * API route for getting accounts for a user
 * GET /api/nessi/get-accounts?userId=xyz
 */
export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json([], { status: 400 });
    }
    
    // Use the apiService singleton to get user accounts
    const accounts = await apiService.getUserAccounts(userId);
    
    if (!accounts || accounts.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Generate a random mask (2-4 digits) when one is not provided
    const generateRandomMask = (): string => {
      const length = Math.floor(Math.random() * 3) + 2; // Random length between 2-4
      let mask = '';
      for (let i = 0; i < length; i++) {
        mask += Math.floor(Math.random() * 10).toString();
      }
      return mask;
    };
    
    // Map the db accounts to the IAccount format
    const formattedAccounts: IAccount[] = accounts.map(account => ({
      account_id: account.id,
      balance: account.balance,
      mask:  generateRandomMask(), // Generate a random mask for each account
      name: account.nickname || account.type
    }));
    
    return NextResponse.json(formattedAccounts, { status: 200 });
    
  } catch (error) {
    console.error('Error in get accounts API route:', error);
    
    return NextResponse.json([], { status: 500 });
  }
}