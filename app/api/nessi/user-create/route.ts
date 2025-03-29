// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/db';
import { DBUserData } from '@/lib/types';

/**
 * API route for user creation/update
 * POST /api/user
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const userData: DBUserData = await request.json();
    
    // Validate required fields
    if (!userData.oauth_sub || !userData.first_name || !userData.last_name) {
      return NextResponse.json({
        message: 'Missing required fields: oauth_sub, first_name, or last_name',
      }, { status: 400 });
    }
    
    // Use the apiService singleton from nessi.ts to make the request
    const response = await apiService.createUser(userData);
    
    // Check if the request was successful
    if (response.error === 1 || response.status === 0) {
      // Return just the error message with appropriate status code
      return NextResponse.json({
        message: response.message || 'An error occurred',
      }, { status: response.statusCode || 500 });
    }
    
    // Return simplified success response
    // Simply return whatever data came back from the backend without status/error
    const { status, error, statusCode, ...rest } = response;
    return NextResponse.json(rest, { status: 200 });
    
  } catch (error) {
    console.error('Error in user API route:', error);
    
    // Return a simplified error response
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}