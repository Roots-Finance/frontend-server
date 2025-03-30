// lib/dataProcessing.ts
import { ITransaction } from "@/lib/types";

/**
 * Sorts transactions chronologically by date
 * @param transactions The transactions to sort
 * @returns A new array with sorted transactions
 */
export function sortTransactionsChronologically(transactions: ITransaction[]): ITransaction[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Calculates the running total for transactions
 * @param transactions The transactions to process
 * @returns A new array with overallTotal property calculated
 */
export function calculateRunningTotal(transactions: ITransaction[]): ITransaction[] {
  if (transactions.length === 0) return [];
  
  const sorted = sortTransactionsChronologically(transactions);
  let overallTotal = 0;
  
  return sorted.map(transaction => {
    overallTotal += (transaction.isCredit ? 1 : -1) * transaction.amount;
    return {
      ...transaction,
      overallTotal
    };
  });
}

/**
 * Processes transactions to calculate cumulative investment value
 * @param transactions The transactions with minimizedTotal and overallTotal properties
 * @returns Transactions with totalValue property
 */
export function calculateInvestmentValue(transactions: (ITransaction & {minimizedTotal: number})[]): (ITransaction & {minimizedTotal: number})[] {
  let runningTotal = 0;
  
  return transactions.map(transaction => {
    // Calculate difference for this transaction
    const difference = (transaction.minimizedTotal || 0) - (transaction.overallTotal || 0);
    
 
    // Return transaction with new totalValue property
    return {
      ...transaction,
      totalValue: difference
    };
  });
}

/**
 * Deep compares two arrays of transactions to detect meaningful changes
 * @param prevData Previous array of transactions
 * @param newData New array of transactions
 * @returns True if the data has meaningful changes
 */
export function hasDataChanged(prevData: ITransaction[], newData: ITransaction[]): boolean {
  if (!prevData || !newData) return true;
  if (prevData.length !== newData.length) return true;
  
  // Check first and last elements via stringify
  if (prevData.length > 0) {
    const firstPrevStr = JSON.stringify({
      date: prevData[0].date,
      total: prevData[0].overallTotal
    });
    const firstNewStr = JSON.stringify({
      date: newData[0].date,
      total: newData[0].overallTotal
    });
    
    const lastPrevStr = JSON.stringify(
        prevData[prevData.length - 1]
    );
    const lastNewStr = JSON.stringify(
        newData[newData.length - 1]
    );
    
    if (firstPrevStr !== firstNewStr || lastPrevStr !== lastNewStr) {
      return true;
    }
  }
  
  // Sample a few elements in the middle for larger datasets
  if (newData.length > 10) {
    const sampleIndices = [
      Math.floor(newData.length * 0.25),
      Math.floor(newData.length * 0.5),
      Math.floor(newData.length * 0.75)
    ];
    
    for (const idx of sampleIndices) {
      const prevItemStr = JSON.stringify(prevData[idx]);
      const newItemStr = JSON.stringify(newData[idx]);
      
      if (prevItemStr !== newItemStr) {
        return true;
      }
    }
  }
  
  return false;
}