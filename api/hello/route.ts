// app/api/plaid/get-transactions/route.ts
import { getPlaidClient } from '@/lib/plaid';
import { NextResponse } from 'next/server';

const plaidClient = getPlaidClient();
export async function GET(request: Request) {
    return NextResponse.json({ message: 'Hello from the API!' });
}