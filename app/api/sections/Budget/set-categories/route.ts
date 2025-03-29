// app/api/sections/Budget/set-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiService } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, budget } = body;

    // Validate required parameters
    if (!userId) {
      return NextResponse.json({ error: "Missing userId in request body" }, { status: 400 });
    }

    if (!budget || typeof budget !== "object") {
      return NextResponse.json({ error: "Missing or invalid budget data" }, { status: 400 });
    }

    // Call the apiService to update the user's budget data
    const updatedBudget = await apiService.updateUserBudget(userId, budget);

    // Return just the updated budget data
    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error("Error updating budget data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" }, 
      { status: 500 }
    );
  }
}