
// app/api/sections/Investment/categories/route.ts
import apiService from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    // In a real application, you would fetch the user's portfolio allocation
    // from your database using the userId
    
    const response = await apiService.getPortfolio(userId);

    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching portfolio categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio categories' },
      { status: 500 }
    );
  }
}
