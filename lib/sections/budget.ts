// src/lib/budget.ts
import { ITransaction } from "@/lib/types";

export interface ChartConfig {
  [category: string]: number;
}

/**
 * Processes transactions by applying category adjustments from chartConfig.
 * It returns a new array of transactions with a running `minimizedTotal` field.
 *
 * @param transactions - The original array of transactions.
 * @param chartConfig - An optional config where each key is a category and the value is the percentage (0-100).
 * @returns Processed array of transactions with minimizedTotal calculated.
 */
export function minimizeBudgetProjection(
  transactions: ITransaction[],
  chartConfig: ChartConfig = {}
): ITransaction[] {
  let minimizedTotal = 0;
  const ret = transactions.map((transaction) => {
    const category = transaction.category;
    // Get adjustment factor (convert percentage to a multiplier; e.g., 75 -> 0.75)
    const adjustmentFactor =
      category && chartConfig[category] !== undefined
        ? chartConfig[category] / 100
        : 1;

    // Calculate impact based on adjustment if applicable
    let transactionImpact = transaction.amount;
    if (category && adjustmentFactor < 1) {
      transactionImpact = transaction.amount * adjustmentFactor;
    }



    // Update running total based on credit or debit
    minimizedTotal += transaction.isCredit ? transactionImpact : -transactionImpact;

    return {
      ...transaction,
      minimizedTotal,
    };
  });
  return ret
}
