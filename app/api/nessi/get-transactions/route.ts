// app/api/nessi/get-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import apiService from "@/lib/db";
import { ITransaction } from "@/lib/types";

/**
 * API route for getting transactions for a user across all accounts.
 * 
 * Expected usage:
 * GET /api/nessi/get-transactions?userId=xyz
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json([], { status: 400 });
    }
    
    // Get all accounts for the user
    const accounts = await apiService.getUserAccounts(userId);
    
    if (!accounts || accounts.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    const allTransactions: ITransaction[] = [];
    
    // Loop through each account and get its transactions
    for (const account of accounts) {
      const transactions = await apiService.getAccountTransactions(account.id);
      
      if (transactions && transactions.length > 0) {
        const formattedTransactions: ITransaction[] = transactions.map((transaction) => ({
          amount: transaction.amount,
          account_id: "", // not needed; leave empty
          transaction_id: transaction.id,
          date: transaction.date,
          merchant_name: transaction.merchant || transaction.description || "UNKNOWN",
          category: transaction.category || "UNKNOWN",
          name: transaction.description || transaction.merchant || "UNKNOWN",
          pending: transaction.pending || false,
          overallTotal: 0, // will be calculated below
          isCredit: transaction.type === "CREDIT",
          raw: transaction
        }));
        allTransactions.push(...formattedTransactions);
      }
    }
    
    // Sort all transactions by date (newest first)
    allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Calculate overall balance cumulatively
    let overallTotal = 0;
    for (const transaction of allTransactions) {
      overallTotal += transaction.isCredit ? transaction.amount : -transaction.amount;
      transaction.overallTotal = overallTotal;
    }
    
    return NextResponse.json(allTransactions, { status: 200 });
  } catch (error) {
    console.error("Error in get transactions API route:", error);
    return NextResponse.json([], { status: 500 });
  }
}
