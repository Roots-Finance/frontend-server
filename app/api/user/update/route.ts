// app/api/user/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ConnectionType } from '@/lib/types';
import apiService from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, connectionType, key } = body;

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' }, 
        { status: 400 }
      );
    }

    if (!connectionType) {
      return NextResponse.json(
        { message: 'Connection type is required' }, 
        { status: 400 }
      );
    }

    // Get user from API
    const userResponse = await apiService.getUserByOAuthSub(userId);

    console.log('user response', userResponse, userId)
    
    // If user doesn't exist, throw an error
    if (userResponse == null) {
        return NextResponse.json(
            { message: 'User not found' }, 
            { status: 404 }
        );
    }

    // Prepare update object based on connection type
    const updateData: {
      oauth_sub: string;
      plaid_key?: string;
      knot_key?: string;
    //   connection_type?: string;
      nessi_key?: string;
    } = {
      oauth_sub: userId, // Required for PATCH endpoint
    };

    // Set connection-specific keys
    switch (connectionType) {
      case ConnectionType.PLAID:
        updateData.plaid_key = key || null;
        delete updateData.knot_key; // Clear other connection
        // updateData.connection_type = ConnectionType.PLAID;
        break;
      case ConnectionType.KNOT:
        updateData.knot_key = key;
        delete updateData.plaid_key; // Clear other connection
        // updateData.connection_type = ConnectionType.KNOT;
        break;
      case ConnectionType.NESSI:
        // NESSI key is assumed to exist
        updateData.nessi_key = key || 'default-nessi-key'; // Default NESSI key if none provided
        delete updateData.plaid_key ; // Clear other connection
        delete updateData.knot_key ; // Clear other connection
        // updateData.connection_type = ConnectionType.NESSI;
        break;
      default:
        // Default to NESSI if no valid connection type provided
        updateData.nessi_key = key || 'default-nessi-key';
        delete updateData.plaid_key; 
        delete updateData.knot_key ;
        // updateData.connection_type = ConnectionType.NESSI;
        break;
    }


    // Update user using the new updateUser method
    const result = await apiService.updateUser(updateData);
    
    if (result.error === 1) {
      return NextResponse.json(
        { message: result.message }, 
        { status: 400 }
      );
        
    }

    // Return success with minimal response
    return NextResponse.json({
      connectionType,
      updated: true
    });
  } catch (error) {
    console.error('Error updating connection type:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update connection type' }, 
      { status: 500 }
    );
  }
}