// app/api/budget/minimize/route.ts
import { ITransaction } from "@/lib/types"
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (request.body === null) {
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  try {
    // Get the chart data and config
    const requestData: { 
      chartData: ITransaction[],
      chartConfig?: { [key: string]: number }
    } = await request.json();
    
    const { chartData, chartConfig = {} } = requestData;
    
    if (!chartData) {
      return NextResponse.json({ error: "Missing chartData" }, { status: 400 });
    }

    // Re-calculate the balance with category adjustments from chartConfig
    let minimizedTotal = 0;
    const processedData = chartData.map((transaction) => {
      // Get the category of this transaction
      const category = transaction.category;
      
      // Determine if this category has an adjustment
      const adjustmentFactor = category && category in chartConfig 
        ? chartConfig[category] / 100  // Convert percentage to factor (e.g., 75% -> 0.75)
        : 1;  // Default to no adjustment (100%)

      let transactionImpact = transaction.amount;
      
      if (
        category && 
        adjustmentFactor < 1
        // isDiscretionaryCategory(category) && 
        // transaction.isCredit === false
      ) {
        // Adjust the amount based on the category's adjustment factor
        transactionImpact = transaction.amount * adjustmentFactor;
      }
      
      // Update running total
      minimizedTotal += transaction.isCredit ? transactionImpact : -transactionImpact;
      
      // Return transaction with updated minimizedTotal
      return {
        ...transaction,
        minimizedTotal: minimizedTotal,
      };
    });

    // Return the projection data
    return NextResponse.json(processedData);
  } catch (error) {
    console.error("Error generating budget projection:", error);
    return NextResponse.json({ error: "Failed to generate budget projection" }, { status: 500 });
  }
}