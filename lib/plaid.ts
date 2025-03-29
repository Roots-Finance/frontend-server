// lib/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Create a singleton Plaid client to be used across the application
let plaidClient: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (plaidClient) {
    return plaidClient;
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENVIRONMENT as keyof typeof PlaidEnvironments || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID as string,
        'PLAID-SECRET': process.env.PLAID_SECRET as string,
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  return plaidClient;
}