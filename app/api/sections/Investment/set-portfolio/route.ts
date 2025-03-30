// app/api/sections/Investment/set-categories/route.ts
import apiService from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, portfolio } = await request.json();

    if (!userId || !portfolio) {
      return NextResponse.json(
        { error: 'User ID and portfolio data are required' },
        { status: 400 }
      );
    }

    // In a real application, you would save the portfolio allocation
    // to your database for the specified user

    const response = await apiService.sendUserPortfolio(userId, portfolio);


    // Return the updated portfolio allocation
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving portfolio categories:', error);
    return NextResponse.json(
      { error: 'Failed to save portfolio categories' },
      { status: 500 }
    );
  }
}