// app/api/user/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { oauth_sub, first_name, last_name } = body;

    console.log('Request body:', body);

    // Validate required fields
    if (!oauth_sub) {
      return NextResponse.json(
        { message: 'Auth0 user ID (oauth_sub) is required', status: 0, error: 1 }, 
        { status: 400 }
      );
    }

    // First name and last name are required for user creation
    if (!first_name) {
      return NextResponse.json(
        { message: 'First name and last name are required', status: 0, error: 1 }, 
        { status: 400 }
      );
    }

    // Prepare user data
    const userData = {
      oauth_sub,
      first_name,
      last_name: last_name || 'TEST'
    };

    console.log('in back', userData)

    // Create user using the API service
    try {
      const user = await apiService.createUser(userData);
      
      // Return success with user data
      return NextResponse.json(user);
    } catch (error) {
      console.error('API error creating user:', error);
      return NextResponse.json(

        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing user creation request:', error);
    return NextResponse.json(
      { status: 500 }
    );
  }
}