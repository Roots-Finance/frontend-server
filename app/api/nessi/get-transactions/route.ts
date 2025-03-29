// app/api/user/[oauthSub]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/nessi';

/**
 * API route for getting user data by oauth_sub
 * GET /api/user/:oauthSub
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { oauthSub: string } }
) {
  try {
    // Validate the oauth_sub parameter
    const { oauthSub } = params;
    
    if (!oauthSub) {
      return NextResponse.json({
        message: 'Missing required parameter: oauthSub',
      }, { status: 400 });
    }
    
    // Use the apiService singleton from nessi.ts to make the request
    const response = await apiService.getUserByOAuthSub(oauthSub);
    
    // Check if the request was successful
    if (response.error === 1 || response.status === 0) {
      // Return just the error message with appropriate status code
      return NextResponse.json({
        message: response.message || 'User not found or an error occurred',
      }, { status: response.statusCode || 404 });
    }
    
    // If we have a user in the response, return just the user object
    if (response.user) {
      return NextResponse.json(response.user, { status: 200 });
    }
    
    // Filter out status, error, and statusCode fields
    const { status, error, statusCode, ...rest } = response;
    return NextResponse.json(rest, { status: 200 });
    
  } catch (error) {
    console.error('Error in get user API route:', error);
    
    // Return a simplified error response
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}