// hooks/useDataUser.ts
"use client"
import { useUser } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { Transaction, AccountBase } from "plaid";
import { ConnectionType, DBUser, IAccount, ITransaction } from "@/lib/types";
import { detConnType } from "@/lib/utils";
import { calculateRunningTotal, sortTransactionsChronologically } from "@/lib/dataProcessing";

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

/**
 * Generates a random mask (2-4 digits) when one is not provided
 */
const generateRandomMask = (): string => {
  const length = Math.floor(Math.random() * 3) + 2; // Random length between 2-4
  let mask = '';
  for (let i = 0; i < length; i++) {
    mask += Math.floor(Math.random() * 10).toString();
  }
  return mask;
};

/**
 * Fetches user's connection type from the API
 */
const fetchConnectionType = async (userId: string): Promise<ConnectionType> => {
  try {
    const encodedUserId = encodeURIComponent(userId);
    const response = await fetch(`/api/user?userId=${encodedUserId}`);

    if (response.status === 404) {
      // User not found, create user
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

/**
 * Creates a new user in the database
 */
const createUser = async (userId: string, firstName: string, lastName: string): Promise<void> => {
  if (!firstName || !lastName) {
    console.error("Missing user name information");
    return;
  }
  
  try {
    const response = await fetch('/api/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oauth_sub: userId,
        first_name: firstName,
        last_name: lastName
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

/**
 * Processes transaction data into the standardized format
 */
const processTransactions = (
  transactions: Transaction[],
  isPlaid: boolean = true
): ITransaction[] => {
  // Map transactions to ITransaction format
  const mappedTransactions: ITransaction[] = transactions.map((transaction) => ({
    amount: transaction.amount,
    account_id: transaction.account_id,
    transaction_id: transaction.transaction_id,
    date: new Date(transaction.date),
    merchant_name: transaction.merchant_name ?? "UNKNOWN",
    category: transaction.personal_finance_category?.primary ?? "UNKNOWN",
    name: transaction.name,
    pending: transaction.pending,
    overallTotal: 0, // Placeholder for overall total
    isCredit: false
  }));

  // Process transactions through our utility functions
  const sortedTransactions = sortTransactionsChronologically(mappedTransactions);
  return calculateRunningTotal(sortedTransactions);
};

/**
 * Processes account data into the standardized format
 */
const processAccounts = (accounts: AccountBase[]): IAccount[] => {
  return accounts.map((account) => ({
    account_id: account.account_id,
    balance: account.balances.current || NaN,
    mask: account.mask || generateRandomMask(),
    name: account.name
  }));
};

// Main hook that combines Auth0 with financial data
export function useDataUser(): DataUserReturn {
  const auth0 = useUser();
  const [connectionType, setConnectionType] = useState<ConnectionType>(ConnectionType.NONE);
  const [data, setData] = useState<Data | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<Error | null>(null);

  /**
   * Fetches Plaid data for the user
   */
  const fetchPlaidData = async (userId: string): Promise<Data | undefined> => {
    try {
      // 1. Get Plaid status to check if connected and get item ID
      const encodedUserId = encodeURIComponent(userId);
      const statusResponse = await fetch(`/api/plaid/status?userId=${encodedUserId}`);
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to get Plaid status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      
      if (!statusData.hasPlaid || !statusData.isValid) {
        // User doesn't have valid Plaid connection
        return undefined;
      }
      
      // 2. Get access token for the item
      const tokenResponse = await fetch("/api/plaid/get-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
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
      
      // Process the data
      const transactions = processTransactions(rawData.transactions, true);
      const accounts = processAccounts(rawData.accounts);
      
      return { accounts, transactions };
    } catch (error) {
      throw error;
    }
  };

  /**
   * Fetches NESSI data for the user
   */
  const fetchNessiData = async (userId: string): Promise<Data | undefined> => {
    try {
      // 1. Get user accounts from Nessi API endpoint
      const encodedUserId = encodeURIComponent(userId);
      const accountsResponse = await fetch(`/api/nessi/get-accounts?userId=${encodedUserId}`);
      
      if (!accountsResponse.ok) {
        throw new Error(`Failed to get NESSI accounts: ${accountsResponse.status}`);
      }
      
      const accounts = await accountsResponse.json() as IAccount[];
      
      if (!accounts || accounts.length === 0) {
        console.warn("No NESSI accounts found for user");
        return { accounts: [], transactions: [] };
      }
      
      // 2. Get transactions
      const transactionsResponse = await fetch(`/api/nessi/get-transactions?userId=${encodedUserId}`);
 
      if (!transactionsResponse.ok) {
        console.warn(`Failed to get transactions: ${transactionsResponse.status}`);
        return { accounts, transactions: [] };
      }
      
      const transactions = await transactionsResponse.json() as ITransaction[];
      
      // Process transactions through our utility functions
      const processedTransactions = calculateRunningTotal(
        sortTransactionsChronologically(transactions)
      );

      processedTransactions.forEach((transaction) => {
        transaction.date = new Date(transaction.date);
      });
      
      
      return {
        accounts,
        transactions: processedTransactions
      };
    } catch (error) {
      throw error;
    }
  };

  /**
   * Main function to refresh user data based on connection type
   */
  const refreshData = async (): Promise<void> => {
    if (!auth0.user?.sub) return;

    console.log('REFRESH DATA');
    setDataLoading(true);
    setDataError(null);
    
    try {
      // First check/create user and determine connection type
      const userConnectionType = await fetchConnectionType(auth0.user.sub);
      
      // Create user if needed
      if (userConnectionType === ConnectionType.NONE && auth0.user?.given_name && auth0.user?.family_name) {
        await createUser(auth0.user.sub, auth0.user.given_name, auth0.user.family_name);
      }
      
      setConnectionType(userConnectionType);
      
      // Fetch data based on connection type
      let userData: Data | undefined;
      
      if (userConnectionType === ConnectionType.PLAID) {
        userData = await fetchPlaidData(auth0.user.sub);
      } else if (userConnectionType === ConnectionType.NESSI) {
        userData = await fetchNessiData(auth0.user.sub);
      }
      
      setData(userData);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setDataError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
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