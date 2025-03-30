// app/api/sections/Cards/cards/route.ts
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
    // Call the apiService to get the user's recommended cards
    const cardsData = await apiService.getRecommendedCards(userId);
    
    // The API returns data in a nested structure with numerical keys
    // We should transform this into an array format for easier consumption
    if (cardsData) {
      const formattedCards = Object.entries(cardsData).map(([key, card]) => ({
        id: parseInt(key),
        bank: card.bank,
        name: card.card,
        savings: card.savings,
        image: card.image_url,
        url: card.url
      }));
      
      return NextResponse.json(formattedCards);
    } else {
      return NextResponse.json([], { status: 200 }); // Return empty array if no data
    }
  } catch (error) {
    console.error("Error fetching recommended cards:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" }, 
      { status: 500 }
    );
  }
}