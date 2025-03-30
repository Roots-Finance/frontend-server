"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataUser } from "@/hooks/useDataUser";
import { ConnectionType } from "@/lib/types";
import { KnotApiClient, KnotApiEvent, KnotApiConfig } from "@/lib/knot_client";

// Create a singleton instance of KnotApiClient
const knotApiClient = new KnotApiClient();

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
        <Button
          onClick={() => onSelectConnection(ConnectionType.KNOT)}
          className="w-full mb-4"
          variant="outline"
        >
          Connect via Knot
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

interface KnotSetupProps {
  onConnect: () => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

const KnotSetup = ({ onConnect, onBack, onSkip, isLoading }: KnotSetupProps) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update Cards on Merchant Sites</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-6">
          Update your card information across multiple merchant sites with just a few clicks.
        </p>
        <Button onClick={onConnect} disabled={isLoading} className="w-full">
          {isLoading ? "Loading..." : "Connect Merchant Accounts"}
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

// --- Main UserConfig Component ---

type ViewState = "LOADING" | "ERROR" | "CONNECTION_SELECT" | "PLAID_SETUP" | "NESSI_SETUP" | "KNOT_SETUP";

export default function UserConfig() {
  const router = useRouter();
  const { user, isLoading } = useDataUser();
  const [viewState, setViewState] = useState<ViewState>("LOADING");
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [knotSessionId, setKnotSessionId] = useState<string | null>(null);
  const [knotError, setKnotError] = useState<string | null>(null);
  const [knotLoading, setKnotLoading] = useState<boolean>(false);

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

  // Knot connection handlers
  const fetchKnotSession = async () => {
    setKnotLoading(true);
    setKnotError(null);
    
    try {
      // Call your API to create a Knot session
      const response = await fetch("/api/knot/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user?.sub,
          email: user?.email,
          phone_number: user?.phoneNumber || "+11234567890", // fallback if not available
          processor_token: "processor-production-0asd1-a92nc", // Replace with actual token
          card_blocked: false,
          card_has_funds: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Knot session");
      }
      
      const data = await response.json();
      setKnotSessionId(data.session);
      
    } catch (error) {
      console.error("Error fetching Knot session:", error);
      setKnotError(error instanceof Error ? error.message : "Unknown error");
      setViewState("ERROR");
    } finally {
      setKnotLoading(false);
    }
  };

  // Set up Knot event listeners
  useEffect(() => {
    // Define event handlers with proper typing
    const handleSuccess = (data: { product: string; merchant: string }) => {
      console.log('Knot success:', data);
      
      // Update the user record in your database
      updateUserWithKnot(data);
    };

    const handleEvent = (data: { 
      product: string; 
      event: string; 
      merchant: string; 
      payload?: Record<string, unknown>; 
      taskId?: string 
    }) => {
      console.log(`Knot event: ${data.event}`, data);
      
      // If the event is merchant_authenticated, we may want to handle it specially
      if (data.event === 'merchant_authenticated') {
        console.log('Merchant authenticated:', data.merchant);
        // You might want to call your API here to switch the card on the server
      }
    };

    const handleError = (error: { 
      product: string; 
      errorCode: string; 
      message: string; 
      payload: any 
    }) => {
      console.error('Knot error:', error);
      setKnotError(`Error with ${error.product}: ${error.message}`);
      setKnotLoading(false);
    };

    const handleExit = (data: { product: string }) => {
      console.log('Knot closed:', data.product);
      setKnotLoading(false);
    };

    // Add event listeners
    knotApiClient.on(KnotApiEvent.SUCCESS, handleSuccess);
    knotApiClient.on(KnotApiEvent.EVENT, handleEvent);
    knotApiClient.on(KnotApiEvent.ERROR, handleError);
    knotApiClient.on(KnotApiEvent.EXIT, handleExit);

    // Clean up event listeners
    return () => {
      knotApiClient.off(KnotApiEvent.SUCCESS, handleSuccess);
      knotApiClient.off(KnotApiEvent.EVENT, handleEvent);
      knotApiClient.off(KnotApiEvent.ERROR, handleError);
      knotApiClient.off(KnotApiEvent.EXIT, handleExit);
    };
  }, []);

  // Update user with Knot connection info
  const updateUserWithKnot = async (data: { merchant: string }) => {
    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.sub,
          connectionType: ConnectionType.KNOT,
          knot_key: data.merchant, // or other identifier from Knot
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user with Knot connection");
      }
      
      await user!.refreshData();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating user with Knot data:", error);
      setKnotError(error instanceof Error ? error.message : "Failed to save Knot connection");
      setViewState("ERROR");
    }
  };

  // Open the Knot card switcher using our improved KnotApiClient
  const openKnotCardSwitcher = () => {
    if (!knotSessionId) {
      console.error("No Knot session ID available");
      return;
    }

    setKnotLoading(true);
    
    try {
      const config: KnotApiConfig = {
        sessionId: knotSessionId,
        clientId: process.env.NEXT_PUBLIC_KNOTAPI_CLIENT_ID || "",
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        product: 'transaction_link',
        companyName: 'Roots',
        primaryColor: '#0070f3',
        // Any additional options can be passed here
        useCategories: true,
        merchantIds: [16],
        entryPoint: 'connection_page'
      };
      
      knotApiClient.open(config);
    } catch (error) {
      console.error("Error opening Knot card switcher:", error);
      setKnotError(error instanceof Error ? error.message : "Failed to open card switcher");
      setKnotLoading(false);
    }
  };

  // Handlers for connection type selection
  const handleSelectConnection = (type: ConnectionType) => {
    if (type === ConnectionType.PLAID) {
      setViewState("PLAID_SETUP");
      fetchPlaidLinkToken();
    } else if (type === ConnectionType.NESSI) {
      setViewState("NESSI_SETUP");
    } else if (type === ConnectionType.KNOT) {
      setViewState("KNOT_SETUP");
      fetchKnotSession();
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
    setKnotError(null);
    setViewState("CONNECTION_SELECT");
  };

  // --- Render logic ---
  if (isLoading || !user) {
    return <LoadingState />;
  }

  if (viewState === "ERROR" || user.dataError || plaidError || knotError) {
    return (
      <ErrorState
        message={
          plaidError || 
          knotError || 
          (user.dataError instanceof Error ? user.dataError.message : "An error occurred")
        }
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

  if (viewState === "KNOT_SETUP") {
    return (
      <KnotSetup
        onConnect={openKnotCardSwitcher}
        onBack={() => setViewState("CONNECTION_SELECT")}
        onSkip={handleContinue}
        isLoading={knotLoading}
      />
    );
  }

  return <LoadingState />;
}