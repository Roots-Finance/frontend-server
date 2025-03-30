// app/api/sections/Budget/lessons/route.ts
import apiService from "@/lib/db";
import { ITransaction } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";


// This would typically be fetched from a database
const getBudgetingSectionContent = async (sub: string) => {
  const response = await apiService.getAiLessons(sub)
  return response
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get chart data
    const { chartData, user_id } = await request.json();

    
    
    if (!chartData) {
      return NextResponse.json(
        { error: 'Chart data is required' },
        { status: 400 }
      );
    }
    
    // Generate personalized content based on the chart data
    const content = await getBudgetingSectionContent(user_id);

    console.log(content)
    
    // Return the content
    return NextResponse.json(content);
    
  } catch (error) {
    console.error('Error generating section content:', error);
    return NextResponse.json(
      { error: 'Failed to generate section content' },
      { status: 500 }
    );
  }
}