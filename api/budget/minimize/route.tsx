// app/api/budget/minimize/route.ts
import { ExtraTransaction } from "@/hooks/usePlaidUser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (request.body === null) {
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  try {
    // Get the chart data and config
    const requestData: { 
      chartData: ExtraTransaction[],
      chartConfig?: { [key: string]: number }
    } = await request.json();
    
    const { chartData, chartConfig = {} } = requestData;
    
    if (!chartData || chartData.length === 0) {
      return NextResponse.json({ error: "Missing chartData" }, { status: 400 });
    }

    // Re-calculate the balance with category adjustments from chartConfig
    let minimizedTotal = 0;
    const processedData = chartData.map((transaction) => {
      // Get the category of this transaction
      const category = transaction.personal_finance_category?.primary;
      
      // Determine if this category has an adjustment
      const adjustmentFactor = category && category in chartConfig 
        ? chartConfig[category] / 100  // Convert percentage to factor (e.g., 75% -> 0.75)
        : 1;  // Default to no adjustment (100%)

      let transactionImpact = transaction.amount;
      
      if (
        category && 
        adjustmentFactor < 1 &&
        // isDiscretionaryCategory(category) && 
        transaction.amount > 0
      ) {
        // Adjust the amount based on the category's adjustment factor
        transactionImpact = transaction.amount * adjustmentFactor;
      }
      

      console.log(transactionImpact)
      // Update running total
      minimizedTotal -= transactionImpact;
      
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