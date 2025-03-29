"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDataUser } from "@/hooks/useDataUser";

// Simple loading state component
const LoadingState = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p>Processing your login...</p>
  </div>
);

export default function AuthCallback() {
  const router = useRouter();
  const { user, error, isLoading } = useDataUser();
  // Ref to ensure the effect only runs once
  const hasHandled = useRef(false);

  // Function to create the account in our database if it doesn't exist
  const createAccount = async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/user/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oauth_sub: user.sub,
          first_name: user.nickname || user.name || "TEST",
          last_name: user.family_name || "TEST",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      hasHandled.current = true;
      // Refresh user data to include the new account info
      await user.refreshData();
    } catch (err) {
      console.error("Error creating account:", err);
    }
  };

  useEffect(() => {
    const processAuth = async () => {
      // Ensure this effect only runs once after redirection
      if (hasHandled.current) return;
      if (isLoading) return;
      if (error) {
        console.error("Auth error:", error);
        router.push("/auth/login");
        hasHandled.current = true;
        return;
      }
      if (user) {
        if (!user.data) {
          // Create account if user has no data
          await createAccount();
        }
        router.push("/user/config");
      } else {
        hasHandled.current = true;
        router.push("/auth/login");

      }
    };

    processAuth();
  }, [isLoading, user, error, router]);

  return <LoadingState />;
}
