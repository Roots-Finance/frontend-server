// models/PlaidToken.ts
export interface IPlaidToken {
  userId: string;
  accessToken: string;
  itemId: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PlaidToken implements IPlaidToken {
  userId: string;
  accessToken: string;
  itemId: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(userId: string, accessToken: string, itemId: string, expiresAt: Date | null = null) {
    this.userId = userId;
    this.accessToken = accessToken;
    this.itemId = itemId;
    this.expiresAt = expiresAt;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}