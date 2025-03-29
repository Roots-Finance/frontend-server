// hooks/useDataUser.ts
import { useUser } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { Transaction, AccountBase } from "plaid";
import { IAccount, ITransaction } from "@/lib/types";

// Define connection types enum
export enum ConnectionType {
  PLAID = "PLAID",
  NESSI = "NESSI",
  NONE = "NONE"
}

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

export function useDataUser(): DataUserReturn {
  const auth0 = useUser();
  const [connectionType, setConnectionType] = useState<ConnectionType>(ConnectionType.NONE);
  const [data, setData] = useState<Data | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<Error | null>(null);

  // Function to check user's connection type
  const checkConnectionType = async (userId: string): Promise<ConnectionType> => {
    return ConnectionType.NONE; // Default to NONE
    try {
      const encodedUserId = encodeURIComponent(userId);
      const response = await fetch(`/api/user?userId=${encodedUserId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get connection type: ${response.status}`);
      }
      
      const { connectionType } = await response.json();
      return connectionType as ConnectionType || ConnectionType.NONE;
    } catch (error) {
      console.error("Error checking connection type:", error);
      return ConnectionType.NONE;
    }
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

  // Generate a random mask (2-4 digits) when one is not provided
  const generateRandomMask = (): string => {
    const length = Math.floor(Math.random() * 3) + 2; // Random length between 2-4
    let mask = '';
    for (let i = 0; i < length; i++) {
      mask += Math.floor(Math.random() * 10).toString();
    }
    return mask;
  };

  // Function to handle NESSI connection
  // This is a skeleton implementation to be expanded later
  const handleNessiConnection = async (): Promise<void> => {
    // Implement NESSI-specific connection logic here
    // For now, we just set appropriate states
    setData(undefined);
    setDataLoading(false);
    setDataError(null);
  };

  const refreshData = async (): Promise<void> => {
    if (!auth0.user?.sub) return;
    
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