import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ConnectionType, DBUser } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function detConnType(user: DBUser): ConnectionType {
  if (user.plaid_key) {
    return ConnectionType.PLAID;
  }
  if (user.knot_key) {
    return ConnectionType.KNOT;
  }
  if (user.nessi_key) {
    return ConnectionType.NESSI;
  }

  return ConnectionType.NESSI;
}