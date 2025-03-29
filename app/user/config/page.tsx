"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataUser } from "@/hooks/useDataUser";
import { ConnectionType } from "@/lib/types";

// --- Presentational Components ---

const LoadingState = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p>Loading your configuration...</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col justify-center items-center min-h-screen">
    <p className="text-red-500 mb-4">{message}</p>
    <Button onClick={onRetry}>Try Again</Button>
  </div>
);

interface ConnectionOptionsProps {
  onSelectConnection: (type: ConnectionType) => void;
  onContinue: () => void;
  showContinue: boolean;
}

const ConnectionOptions = ({ onSelectConnection, onContinue, showContinue }: ConnectionOptionsProps) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Choose Your Financial Connection</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-6">
          Select how you would like to connect your financial data.
        </p>
        <Button onClick={() => onSelectConnection(ConnectionType.PLAID)} className="w-full mb-4">
          Connect via Plaid
        </Button>
        <Button
          onClick={() => onSelectConnection(ConnectionType.NESSI)}
          className="w-full mb-4"
          variant="outline"
        >
          Connect via NESSI
        </Button>
        {showContinue && (
          <Button variant="ghost" onClick={onContinue} className="mt-2">
            Continue with Current Connection
          </Button>
        )}
      </CardContent>
    </Card>
  </div>
);

interface PlaidSetupProps {
  onConnect: () => void;
  onBack: () => void;
  onSkip: () => void;
  isReconnecting: boolean;
  disabled: boolean;
}

const PlaidSetup = ({ onConnect, onBack, onSkip, isReconnecting, disabled }: PlaidSetupProps) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {isReconnecting ? "Reconnect Your Bank Account" : "Connect Your Bank Account"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-6">
          {isReconnecting
            ? "Your bank connection needs updating to continue using the app."
            : "To complete your registration, please connect your bank account."}
        </p>
        <Button onClick={onConnect} disabled={disabled} className="w-full">
          {isReconnecting ? "Update Bank Connection" : "Connect Bank Account"}
        </Button>
        <div className="flex w-full mt-4 justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Options
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

interface NessiSetupProps {
  onComplete: () => void;
  onBack: () => void;
}

const NessiSetup = ({ onComplete, onBack }: NessiSetupProps) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Setup NESSI Connection</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-6">
          Follow these steps to set up your NESSI financial connection.
        </p>
        {/* Insert NESSI setup form or instructions here */}
        <div className="w-full p-4 mb-4 bg-gray-50 rounded-md">
          <p className="text-center text-gray-500">NESSI setup interface placeholder</p>
        </div>
        <div className="flex w-full justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Options
          </Button>
          <Button onClick={onComplete}>Complete Setup</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// --- Main UserConfig Component ---

type ViewState = "LOADING" | "ERROR" | "CONNECTION_SELECT" | "PLAID_SETUP" | "NESSI_SETUP";

export default function UserConfig() {
  const router = useRouter();
  const { user, isLoading } = useDataUser();
  const [viewState, setViewState] = useState<ViewState>("LOADING");
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);

  // Initialize the page by waiting for user data
  useEffect(() => {
    if (!isLoading && user && viewState === "LOADING") {
      setViewState("CONNECTION_SELECT");
    }
  }, [isLoading, user]);

  // Initialize data

  // Plaid connection handlers
  const fetchPlaidLinkToken = async () => {
    try {
      setPlaidError(null);
      // Here, we assume your API endpoint will provide a link token.
      // If the user is reconnecting, your endpoint should detect that from the backend.
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_user_id: user?.sub }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create link token");
      }
      const { link_token } = await response.json();
      setPlaidLinkToken(link_token);
      // Optionally set isReconnecting based on backend data
      // setIsReconnecting(...);
    } catch (error) {
      console.error("Error fetching link token:", error);
      setPlaidError(error instanceof Error ? error.message : "Unknown error");
      setViewState("ERROR");
    }
  };

  const { open, ready } = usePlaidLink({
    token: plaidLinkToken || "",
    onSuccess: async (public_token: string, metadata: any) => {
      try {
        // Exchange public token for access token
        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_token,
            metadata,
            userId: user?.sub,
            reconnect: isReconnecting,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Token exchange failed");
        }
        // After successful exchange, refresh user data and navigate to dashboard
        await user!.refreshData();
        router.push("/dashboard");
      } catch (error) {
        console.error("Error during token exchange:", error);
        setPlaidError(error instanceof Error ? error.message : "Failed to connect account");
        setViewState("ERROR");
      }
    },
    onExit: (err) => {
      if (err) {
        console.error("Plaid exit error:", err);
        setPlaidError("There was an issue connecting your bank account.");
        setViewState("ERROR");
      }
    },
  });

  // Handlers for connection type selection
  const handleSelectConnection = (type: ConnectionType) => {
    if (type === ConnectionType.PLAID) {
      setViewState("PLAID_SETUP");
      fetchPlaidLinkToken();
    } else if (type === ConnectionType.NESSI) {
      setViewState("NESSI_SETUP");
    }
  };

  // Continue with current connection (if already set)
  const handleContinue = () => {
    router.push("/dashboard");
  };

  // Handler for NESSI setup completion
  const handleNessiComplete = async () => {
    try {
      // Assume your NESSI completion logic updates the user on the backend
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.sub,
          connectionType: ConnectionType.NESSI,
          key: "default-nessi-key",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update user connection");
      }
      await user!.refreshData();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing NESSI setup:", error);
      setViewState("ERROR");
    }
  };

  // Retry handler in case of error
  const handleRetry = () => {
    setPlaidError(null);
    setViewState("CONNECTION_SELECT");
  };

  // --- Render logic ---
  if (isLoading || !user) {
    return <LoadingState />;
  }

  if (viewState === "ERROR" || user.dataError || plaidError) {
    return (
      <ErrorState
        message={plaidError || (user.dataError instanceof Error ? user.dataError.message : "An error occurred")}
        onRetry={handleRetry}
      />
    );
  }

  if (viewState === "CONNECTION_SELECT") {
    // Show the "continue" button if the user already has a connection (not NONE)
    const showContinue = user.connectionType !== ConnectionType.NONE;
    return (
      <ConnectionOptions
        onSelectConnection={handleSelectConnection}
        onContinue={handleContinue}
        showContinue={showContinue}
      />
    );
  }

  if (viewState === "PLAID_SETUP") {
    return (
      <PlaidSetup
        onConnect={() => open()}
        onBack={() => setViewState("CONNECTION_SELECT")}
        onSkip={handleContinue}
        isReconnecting={isReconnecting}
        disabled={!ready}
      />
    );
  }

  if (viewState === "NESSI_SETUP") {
    return <NessiSetup onComplete={handleNessiComplete} onBack={() => setViewState("CONNECTION_SELECT")} />;
  }

  return <LoadingState />;
}
