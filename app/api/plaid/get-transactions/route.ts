// app/api/plaid/get-transactions/route.ts
import { getPlaidClient } from '@/lib/plaid';
import { NextResponse } from 'next/server';

const plaidClient = getPlaidClient();
export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Get current date and date 30 days ago
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Get transactions from Plaid API
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 100,
        offset: 0,
      },
    });

    console.log('transactionsResponse:', transactionsResponse.data.transactions)

    // Get accounts to show balances
    const accountsResponse = await plaidClient.accountsGet({
      access_token,
    });

    return NextResponse.json({
      accounts: accountsResponse.data.accounts,
      transactions: transactionsResponse.data.transactions,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error fetching transactions:', error);
    
    // Return more specific error information
    return NextResponse.json(
      { 
        error: 'Failed to fetch transactions',
        details: error.response?.data || error.message
      },
      { status: 500 }
    );
  }
}