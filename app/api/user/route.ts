// app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import apiService from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    console.log("User ID from query params:", userId);

    // Validate input
    if (!userId) {
      return NextResponse.json({ status: 400 });
    }

    // Get user from API using Auth0 sub
    const userData = await apiService.getUserByOAuthSub(userId);

    // If user doesn't exist, return appropriate error
    if (!userData) {
      return NextResponse.json({ status: 404 });
    }

    // Return the user data
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to fetch user",
        status: 0,
        error: 1,
      },
      { status: 500 }
    );
  }
}
