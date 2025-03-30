
// app/api/sections/Investment/categories/route.ts
import apiService from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId, monthly_savings } = await request.json();
  console.log(userId, monthly_savings)
  if (!userId || !monthly_savings) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    // In a real application, you would fetch the user's portfolio allocation
    // from your database using the userId
    
    const response = await apiService.getSPIPortfolio(userId, parseFloat(monthly_savings));

    console.log(response)


    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching portfolio categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio categories' },
      { status: 500 }
    );
  }
}
