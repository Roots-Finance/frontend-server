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

}

import type { Transaction } from "plaid";
