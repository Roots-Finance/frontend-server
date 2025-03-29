import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { NextResponse } from "next/server"

export const auth0 = new Auth0Client({
    beforeSessionSaved: async (session) => {
        return session;
    },  
    onCallback: async () => {
        return NextResponse.next()
    },
    // signInReturnToPath: "/auth/callback",
    transactionCookie: {
        secure: true,
        // sameSite: "strict",
    }
})