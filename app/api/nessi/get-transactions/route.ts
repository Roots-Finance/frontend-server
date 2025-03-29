// app/api/nessi/get-transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/db';
import { ITransaction } from '@/lib/types';

/**
 * API route for getting transactions for a specific account
 * GET /api/nessi/get-transactions?accountId=xyz
 */
export async function GET(request: NextRequest) {
  try {
    // Get accountId from query params
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json([], { status: 400 });
    }
    
    // Use the apiService singleton to get account transactions
    const transactions = await apiService.getAccountTransactions(accountId);
    
    if (!transactions || transactions.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    console.log(transactions)
    // Map the transactions to the ITransaction format if needed
    const formattedTransactions: ITransaction[] = transactions.map(transaction => ({
      amount: transaction.amount,
      account_id: accountId,
      transaction_id: transaction.id,
      date: transaction.date,
      merchant_name: transaction.merchant || transaction.description || "UNKNOWN",
      category: transaction.category || "UNKNOWN",
      name: transaction.description || transaction.merchant || "UNKNOWN",
      pending: transaction.pending || false,
      overallTotal: 0, // This will be calculated later
      isCredit: transaction.type === 'CREDIT',
    }));
    
    // Sort transactions by date (newest first)
    formattedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate overall balance
    let overallTotal = 0;
    for (const transaction of formattedTransactions) {
      // Calculate overall balance_
      overallTotal = overallTotal + (transaction.isCredit ? transaction.amount: -transaction.amount);
      transaction.overallTotal = overallTotal;
    }
    
    return NextResponse.json(formattedTransactions, { status: 200 });
    
  } catch (error) {
    console.error('Error in get transactions API route:', error);
    
    return NextResponse.json([]
    , { status: 500 });
  }
}