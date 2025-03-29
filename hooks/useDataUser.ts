// hooks/useDataUser.ts
"use client"
import { useUser } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { Transaction, AccountBase } from "plaid";
import { ConnectionType, DBUser, IAccount, ITransaction } from "@/lib/types";
import { detConnType } from "@/lib/utils";


interface RawPlaidData {
  accounts: AccountBase[];
  transactions: Transaction[];
}

export interface Data {
  accounts: IAccount[];
  transactions: ITransaction[];
}

// Base user extension with shared properties
export type BaseExtendedUser = ReturnType<typeof useUser>["user"] & {
  connectionType: ConnectionType;
  data?: Data;
  dataLoading: boolean;
  dataError: Error | null;
  refreshData: () => Promise<void>;
};

// Plaid-specific user extension
export type PlaidExtendedUser = BaseExtendedUser & {
  connectionType: ConnectionType.PLAID;
};

// NESSI-specific user extension
export type NessiExtendedUser = BaseExtendedUser & {
  connectionType: ConnectionType.NESSI;
};

// No connection type extension
export type NoConnectionExtendedUser = BaseExtendedUser & {
  connectionType: ConnectionType.NONE;
};

// Combined user type
export type ExtendedUser = PlaidExtendedUser | NessiExtendedUser | NoConnectionExtendedUser;

// Extend Auth0 user with data
export interface DataUserReturn extends Omit<ReturnType<typeof useUser>, "user"> {
  user?: ExtendedUser;
}

// Response interfaces for better typing

export function useDataUser(): DataUserReturn {
  const auth0 = useUser();
  const [connectionType, setConnectionType] = useState<ConnectionType>(ConnectionType.NONE);
  const [data, setData] = useState<Data | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<Error | null>(null);

  // Function to check user's connection type
  const checkConnectionType = async (userId: string): Promise<ConnectionType> => {
    try {
      const encodedUserId = encodeURIComponent(userId);
      const response = await fetch(`/api/user?userId=${encodedUserId}`);

      if (response.status === 404) {
        // User not found, create user
        await createUser(userId);
        return ConnectionType.NONE;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to get connection type: ${response.status}`);
      }
      
      const data = await response.json() as DBUser;
   
      return detConnType(data);

    } catch (error) {
      console.error("Error checking connection type:", error);
      return ConnectionType.NONE;
    }
  };

  // Create a new user when they don't exist yet
  const createUser = async (userId: string): Promise<void> => {
    if (!auth0.user?.given_name || !auth0.user?.family_name) {
      console.error("Missing user name information");
      return;
    }
    
    try {
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oauth_sub: userId,
          first_name: auth0.user.given_name,
          last_name: auth0.user.family_name
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating user: ${response.status}`);
      }
      
      console.log("New user created successfully");
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  // Generate a random mask (2-4 digits) when one is not provided
  const generateRandomMask = (): string => {
    const length = Math.floor(Math.random() * 3) + 2; // Random length between 2-4
    let mask = '';
    for (let i = 0; i < length; i++) {
      mask += Math.floor(Math.random() * 10).toString();
    }
    return mask;
  };

  // Function to fetch Plaid data
  const fetchPlaidData = async (): Promise<void> => {
    if (!auth0.user?.sub) return;

    setDataLoading(true);
    setDataError(null);

    try {
      // First check connection type
      const userConnectionType = await checkConnectionType(auth0.user.sub);
      setConnectionType(userConnectionType);
      
      // If not using Plaid, exit early
      if (userConnectionType !== ConnectionType.PLAID) {
        setData(undefined);
        setDataLoading(false);
        return;
      }

      // Continue with Plaid connection flow
      // 1. Get Plaid status to check if connected and get item ID
      const encodedUserId = encodeURIComponent(auth0.user.sub);
      const statusResponse = await fetch(`/api/plaid/status?userId=${encodedUserId}`);
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to get Plaid status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      
      if (!statusData.hasPlaid || !statusData.isValid) {
        // User doesn't have valid Plaid connection
        setData(undefined);
        setDataLoading(false);
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
      
      if (!transactionsResponse.ok) {
        throw new Error(`Failed to get transactions: ${transactionsResponse.status}`);
      }
      
      const rawData: RawPlaidData = await transactionsResponse.json();

      // 4. Map transactions to ITransaction format
      const transactions: ITransaction[] = rawData.transactions.map((transaction) => ({
        amount: transaction.amount,
        account_id: transaction.account_id,
        transaction_id: transaction.transaction_id,
        date: transaction.date,
        merchant_name: transaction.merchant_name ?? "UNKNOWN",
        category: transaction.personal_finance_category?.primary ?? "UNKNOWN",
        name: transaction.name,
        pending: transaction.pending,
        overallTotal: 0, // Placeholder for overall total
        isCredit: false
      }));

      let overallTotal = 0;
      for (const transaction of transactions) {
        // Calculate overall balance for each transaction
        transaction.overallTotal = overallTotal -= transaction.amount;
      }

      // Extract accounts data based on IAccount interface
      const accounts: IAccount[] = rawData.accounts.map((account) => ({
        account_id: account.account_id,
        balance: account.balances.current || NaN,
        mask: account.mask || generateRandomMask(),
        name: account.name
      }));

      setData({ accounts, transactions });
    } catch (error) {
      console.error("Error fetching Plaid data:", error);
      setDataError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setDataLoading(false);
    }
  };

  // Function to handle NESSI connection using the new API endpoints
  const handleNessiConnection = async (): Promise<void> => {
    if (!auth0.user?.sub) return;
    
    setDataLoading(true);
    setDataError(null);
    
    try {
      // 1. Get user accounts from our new Nessi API endpoint
      const encodedUserId = encodeURIComponent(auth0.user.sub);
      const accountsResponse = await fetch(`/api/nessi/get-accounts?userId=${encodedUserId}`);
      
      if (!accountsResponse.ok) {
        throw new Error(`Failed to get NESSI accounts: ${accountsResponse.status}`);
      }
      
      const accountsData = await accountsResponse.json() as IAccount[];
      const accounts = accountsData;
      
      if (!accounts || accounts.length === 0) {
        console.warn("No NESSI accounts found for user");
        setData({ accounts: [], transactions: [] });
        setDataLoading(false);
        return;
      }
      
      // 2. Get transactions for each account using our new Nessi transactions endpoint
      let allTransactions: ITransaction[] = [];

      console.log(accounts)
      
      for (const account of accounts) {
        const transactionResponse = await fetch(`/api/nessi/get-transactions?accountId=${account.account_id}`);
        
        if (!transactionResponse.ok) {
          console.warn(`Failed to get transactions for account ${account.account_id}: ${transactionResponse.status}`);
          continue; // Skip to next account if we can't get transactions for this one
        }
        
        const transactionData = await transactionResponse.json() as ITransaction[];
        const accountTransactions = transactionData;
        
        // Add transactions to our collection
        if (accountTransactions && accountTransactions.length > 0) {
          allTransactions = [...allTransactions, ...accountTransactions];
        }
      }
      
      // The transactions should already be sorted and have the overallTotal calculated by our API
      // But we'll double-check to make sure they're properly processed
      
      // Sort transactions by date (newest first) if needed
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Calculate overall balance for each transaction if needed
      if (allTransactions.length > 0 && allTransactions[0].overallTotal === 0) {
        let overallTotal = 0;
        for (const transaction of allTransactions) {
          transaction.overallTotal = overallTotal -= transaction.amount;
        }
      }
      
      setData({
        accounts,
        transactions: allTransactions
      });
    } catch (error) {
      console.error("Error fetching NESSI data:", error);
      setDataError(error instanceof Error ? error : new Error("Unknown error fetching NESSI data"));
      setData(undefined);
    } finally {
      setDataLoading(false);
    }
  };

  const refreshData = async (): Promise<void> => {
    if (!auth0.user?.sub) return;

    console.log('REFRESH DATA')
    
    // Check connection type first
    const userConnectionType = await checkConnectionType(auth0.user.sub);
    setConnectionType(userConnectionType);
  
    if (userConnectionType === ConnectionType.PLAID) {
      await fetchPlaidData();
    } else if (userConnectionType === ConnectionType.NESSI) {
      await handleNessiConnection();
    } else {
      setDataLoading(false);
    }
  };

  // Fetch connection data when user changes
  useEffect(() => {
    if (auth0.user) {
      refreshData();
    }
  }, [auth0.user]);

  // Construct the appropriate user object based on connection type
  let extendedUser: ExtendedUser | undefined;
  
  if (auth0.user) {
    const baseUser = {
      ...auth0.user,
      connectionType,
      data,
      dataLoading,
      dataError,
      refreshData
    };
    
    if (connectionType === ConnectionType.PLAID) {
      extendedUser = {
        ...baseUser,
        connectionType: ConnectionType.PLAID
      } as PlaidExtendedUser;
    } else if (connectionType === ConnectionType.NESSI) {
      extendedUser = {
        ...baseUser,
        connectionType: ConnectionType.NESSI
      } as NessiExtendedUser;
    } else {
      extendedUser = {
        ...baseUser,
        connectionType: ConnectionType.NONE
      } as NoConnectionExtendedUser;
    }
  }

  // Return extended user object
  return {
    ...auth0,
    user: extendedUser
  };
}