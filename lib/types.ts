export interface ITransaction {
  amount: number;
  account_id: string; // this is the bank account id.
  transaction_id: string;
  date: string;
  merchant_name: string;
  category: string;
  name: string; // name of transaction, can be considered a description. IE: Uber #2832, merchant is Uber
  pending: boolean; // this should basically always be false (for our use case)
  overallTotal: number; // across EVERY account registered for a user, what is the current total? (This maybe needs to be done on frontend, so perhaps don't inclue and I'll handle it.)
  isCredit: boolean;
}

export interface IAccount {
    account_id: string
    balance: number

    // The last 2-4 alphanumeric characters of either the account’s displayed mask 
    // or the account’s official account number. Note that the mask may be non-unique between an Item’s accounts.
    mask: string // for you, just return random digits.
    name: string
}


/**
 * ApiService - Handles API requests to backend
 */
export interface DBUserData {
  oauth_sub: string;
  first_name: string;
  last_name: string;
}

export interface DBUser {
  first_name: string;
  last_name: string;
  plaid_access_token: string | null;
  knot_access_token: string | null;
  [key: string]: any;
}


// Define connection types enum
export enum ConnectionType {
  KNOT = "KNOT",
  PLAID = "PLAID",
  NESSI = "NESSI",
  NONE = "NONE"
}

export interface CategoryData {
  [category: string]: number;
}
