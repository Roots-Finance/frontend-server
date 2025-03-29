// hooks/usePlaidUser.ts
import { useUser } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { Transaction } from "plaid";
import { ITransaction } from "@/lib/types";

export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  balances: {
    available: number | null;
    current: number;
    iso_currency_code: string;
  };
  mask: string | null;
}

interface RawPlaidData {
  accounts: PlaidAccount[];
  transactions: Transaction[];
}

export interface PlaidData {
  accounts: PlaidAccount[];
  transactions: ITransaction[];
}

export type ExtendedUser = ReturnType<typeof useUser>["user"] & {
  plaidData?: PlaidData;
  plaidLoading: boolean;
  plaidError: Error | null;
  refreshPlaidData: () => Promise<void>;
};

// Extend Auth0 user with Plaid data
export interface PlaidUserReturn extends Omit<ReturnType<typeof useUser>, "user"> {
  user?: ExtendedUser;
}

export function usePlaidUser(): PlaidUserReturn {
  console.log("new user!");
  const auth0 = useUser();
  const [plaidData, setPlaidData] = useState<PlaidData | undefined>(undefined);
  const [plaidLoading, setPlaidLoading] = useState<boolean>(true);
  const [plaidError, setPlaidError] = useState<Error | null>(null);

  // Function to fetch Plaid data
  const fetchPlaidData = async (): Promise<void> => {
    if (!auth0.user?.sub) return;

    setPlaidLoading(true);
    setPlaidError(null);

    try {
      // 1. Get Plaid status to check if connected and get item ID
      const encodedUserId = encodeURIComponent(auth0.user.sub);
      const statusResponse = await fetch(`/api/plaid/status?userId=${encodedUserId}`);

      if (!statusResponse.ok) {
        throw new Error(`Failed to get Plaid status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();

      if (!statusData.hasPlaid || !statusData.isValid) {
        // User doesn't have valid Plaid connection
        setPlaidData(undefined);
        setPlaidLoading(false);
        return;
      }

      // 2. Get access token for the item
      const tokenResponse = await fetch("/api/plaid/get-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth0.user.sub,
          itemId: statusData.itemId,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get access token: ${tokenResponse.status}`);
      }

      const { accessToken } = await tokenResponse.json();
      // 3. Get transactions using the access token
      const transactionsResponse = await fetch("/api/plaid/get-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      console.log("new user got data");
      if (!transactionsResponse.ok) {
        throw new Error(`Failed to get transactions: ${transactionsResponse.status}`);
      }

      const data: RawPlaidData = await transactionsResponse.json();

      // 4. Map transactions to ITransaction format
      const transactions: ITransaction[] = data.transactions.map((transaction) => ({
        amount: transaction.amount,
        account_id: transaction.account_id,
        transaction_id: transaction.transaction_id,
        date: transaction.date,
        merchant_name: transaction.merchant_name ?? "UNKNOWN",
        category: transaction.personal_finance_category?.primary ?? "UNKNOWN",
        name: transaction.name,
        pending: transaction.pending,
        overallTotal: 0, // Placeholder for overall total
      }));

      let overallTotal = 0;
      for (const transaction of transactions) {
        // Calculate overall balance for each transaction
        transaction.overallTotal = overallTotal -= transaction.amount;
      }

      setPlaidLoading(false);
      setPlaidData({ accounts: data.accounts, transactions });
    } catch (error) {
      console.error("Error fetching Plaid data:", error);
      setPlaidError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setPlaidLoading(false);
    }
  };

  // Fetch Plaid data when user changes
  useEffect(() => {
    if (auth0.user) {
      fetchPlaidData();
    }
  }, [auth0.user]);

  // Return extended user object
  return {
    ...auth0,
    user: auth0.user
      ? {
          ...auth0.user,
          plaidData,
          plaidLoading,
          plaidError,
          refreshPlaidData: fetchPlaidData,
        }
      : undefined,
  };
}
