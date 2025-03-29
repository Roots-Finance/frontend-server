// app/api/sections/Budget/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiService } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Get userId from the URL query parameters
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Validate required parameters
  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    // Call the apiService to get the user's budget data
    const budgetData = await apiService.getUserBudget(userId);

    // Return just the budget data
    return NextResponse.json(budgetData);
  } catch (error) {
    console.error("Error fetching budget data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" }, 
      { status: 500 }
    );
  }
}