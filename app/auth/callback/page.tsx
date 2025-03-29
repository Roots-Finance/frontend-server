"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaidLinkOnSuccessMetadata, usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataUser, ConnectionType } from '@/hooks/useDataUser';

// Component for showing loading state
const LoadingState = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p>Processing your request...</p>
  </div>
);

// Component for showing error state
const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col justify-center items-center min-h-screen">
    <p className="text-red-500 mb-4">{message}</p>
    <Button onClick={onRetry}>Try Again</Button>
  </div>
);

// Component for connection options
const ConnectionOptionsCard = ({
  onSelectPlaid,
  onSelectNessi,
  onSkip
}: {
  onSelectPlaid: () => void;
  onSelectNessi: () => void;
  onSkip: () => void;
}) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Choose Your Financial Connection</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-6">
          Select how you would like to connect your financial data.
        </p>
        
        <Button 
          onClick={onSelectPlaid} 
          className="w-full mb-4"
        >
          Connect via Plaid
        </Button>
        
        <Button 
          onClick={onSelectNessi} 
          className="w-full mb-4"
          variant="outline"
        >
          Connect via NESSI
        </Button>
        
        {/* <Button
          variant="ghost"
          onClick={onSkip}
          className="mt-2"
        >
          Skip for now
        </Button> */}
      </CardContent>
    </Card>
  </div>
);

// Component for Plaid connection card
const PlaidLinkCard = ({ 
  isReconnecting, 
  onConnect, 
  onSkip, 
  onBack,
  disabled 
}: { 
  isReconnecting: boolean; 
  onConnect: () => void; 
  onSkip: () => void;
  onBack: () => void;
  disabled: boolean;
}) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {isReconnecting ? 'Reconnect Your Bank Account' : 'Connect Your Bank Account'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-6">
          {isReconnecting 
            ? 'Your bank connection needs to be updated to continue using the app.'
            : 'To complete your registration, please connect your bank account.'
          }
        </p>
        
        <Button 
          onClick={onConnect} 
          disabled={disabled}
          className="w-full"
        >
          {isReconnecting ? 'Update Bank Connection' : 'Connect Bank Account'}
        </Button>
        
        {!isReconnecting && (
          <div className="flex w-full mt-4 justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className=""
            >
              Back to options
            </Button>
            
            {!isReconnecting && (
              <Button
                variant="ghost"
                onClick={onSkip}
              >
                Skip for now
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

// Component for NESSI setup
const NessiSetupCard = ({
  onComplete,
  onBack
}: {
  onComplete: () => void;
  onBack: () => void;
}) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Setup NESSI Connection</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-6">
          Follow these steps to set up your NESSI financial connection.
        </p>
        
        {/* NESSI setup form would go here */}
        <div className="w-full p-4 mb-4 bg-gray-50 rounded-md">
          <p className="text-center text-gray-500">NESSI setup interface placeholder</p>
        </div>
        
        <div className="flex w-full justify-between">
          <Button 
            variant="outline"
            onClick={onBack}
          >
            Back to options
          </Button>
          
          <Button 
            onClick={onComplete}
          >
            Complete Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Define view states
type ViewState = 'LOADING' | 'ERROR' | 'CONNECTION_SELECT' | 'PLAID_SETUP' | 'NESSI_SETUP';

// Hook for managing Plaid link token and status
const usePlaidLinkSetup = ({ user, onSuccess, onError }: any) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  
  // Fetch link token when needed
  const fetchLinkToken = async () => {
    if (!user?.sub || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if we need to reconnect an existing account
      const statusResponse = await fetch(`/api/plaid/status?userId=${encodeURIComponent(user.sub)}`);
      if (!statusResponse.ok) {
        throw new Error(`Error checking Plaid status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      const needsReconnect = statusData.hasPlaid && !statusData.isValid;
      setReconnecting(needsReconnect);
      
      // Create link token for new connection or reconnection
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_user_id: user.sub,
          ...(needsReconnect && statusData.itemId ? { itemId: statusData.itemId } : {})
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create link token');
      }
      
      const { link_token } = await response.json();
      setLinkToken(link_token);
    } catch (error) {
      console.error('Link token error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating link token';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Plaid link success
  const handlePlaidSuccess = async (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => {
    if (!user?.sub) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          metadata,
          userId: user.sub,
          ...(reconnecting ? { reconnect: true } : {})
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange token');
      }
      
      // Call success callback
      onSuccess?.();
      
    } catch (error) {
      console.error('Exchange token error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect account';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: handlePlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
        const errorMessage = 'There was an issue connecting your bank account.';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    }
  });
  
  return {
    linkToken,
    loading,
    error,
    reconnecting,
    fetchLinkToken,
    openPlaidLink: () => open(),
    isPlaidLinkReady: ready
  };
};

// Main component
export default function AuthCallback() {
  const router = useRouter();
  const { user, error: auth0Error, isLoading: auth0Loading } = useDataUser();
  const [localError, setLocalError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('LOADING');
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType>(ConnectionType.NONE);
  
  // Use custom Plaid link hook
  const plaidLink = usePlaidLinkSetup({
    user,
    onSuccess: async (public_token: any, metadata: any) => {
      try {
        setLocalError(null);
        
        // First, update user's connection type on the server
        const typeResponse = await fetch('/api/connection/set-type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.sub,
            connectionType: ConnectionType.PLAID
          }),
        });
        
        if (!typeResponse.ok) {
          throw new Error('Failed to set connection type');
        }
        
        // Then exchange the Plaid token
        const tokenResponse = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            metadata,
            userId: user?.sub
          }),
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange token');
        }
        
        // Refresh data after successful connection
        if (user?.refreshData) {
          await user.refreshData();
        }
        
        router.push('/dashboard');
      } catch (error) {
        console.error('Error completing Plaid setup:', error);
        setLocalError(error instanceof Error ? error.message : 'Failed to complete setup');
        setViewState('ERROR');
      }
    },
    onError: (error: any) => {
      setLocalError(error);
      setViewState('ERROR');
    }
  });
  
  // This effect manages the component lifecycle
  useEffect(() => {
    // Skip if still loading auth data or no user
    if (auth0Loading || !user) return;
    
    // If user already has data, redirect to dashboard
    if (user.data) {
      router.push('/dashboard');
      return;
    }
    
    // // If everything is loaded but user has no data yet, show connection selection
    // if (!auth0Loading && !user.dataLoading) {
    //   setViewState('CONNECTION_SELECT');
    // }
  }, [auth0Loading, user, router, plaidLink]);
  
  // Handle connection type selection
  const handleSelectConnectionType = async (type: ConnectionType) => {
    setSelectedConnectionType(type);
    
    // We don't update the user's connection type yet - that happens when they complete setup
    // We just change which setup flow to show
    if (type === ConnectionType.PLAID) {
      setViewState('PLAID_SETUP');
      if (!plaidLink.linkToken && !plaidLink.loading) {
        plaidLink.fetchLinkToken();
      }
    } else if (type === ConnectionType.NESSI) {
      setViewState('NESSI_SETUP');
    }
  };
  
  // Handle NESSI setup completion
  const handleNessiComplete = async () => {
    try {
      setLocalError(null);
      
      // Update user's connection type on the server
      const response = await fetch('/api/connection/set-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.sub,
          connectionType: ConnectionType.NESSI
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set connection type');
      }
      
      // Refresh user data to reflect the new connection type
      if (user?.refreshData) {
        await user.refreshData();
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing NESSI setup:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to complete setup');
    }
  };
  
  // Show loading state
  if (auth0Loading || user?.dataLoading || viewState === 'LOADING') {
    return <LoadingState />;
  }
  
  // Show errors
  const errorMessage = localError || auth0Error?.message || user?.dataError?.message || plaidLink.error;
  if (errorMessage || viewState === 'ERROR') {
    return <ErrorState 
      message={errorMessage || "An error occurred during setup."} 
      onRetry={() => router.push('/api/auth/login')} 
    />;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    router.push('/api/auth/login');
    return null;
  }
  
  // If already connected with data, redirect to dashboard
  if (user.data) {
    router.push('/dashboard');
    return null;
  }
  
  // Show connection selection
  if (viewState === 'CONNECTION_SELECT') {
    return (
      <ConnectionOptionsCard 
        onSelectPlaid={() => handleSelectConnectionType(ConnectionType.PLAID)}
        onSelectNessi={() => handleSelectConnectionType(ConnectionType.NESSI)}
        onSkip={() => router.push('/dashboard')}
      />
    );
  }
  
  // Show Plaid setup
  if (viewState === 'PLAID_SETUP') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {plaidLink.loading ? (
          <p>Preparing Plaid connection...</p>
        ) : plaidLink.linkToken ? (
          <PlaidLinkCard 
            isReconnecting={false}
            onConnect={plaidLink.openPlaidLink}
            onSkip={() => router.push('/dashboard')}
            onBack={() => setViewState('CONNECTION_SELECT')}
            disabled={!plaidLink.isPlaidLinkReady}
          />
        ) : (
          <div className="flex flex-col items-center">
            <p className="mb-4">Unable to initialize Plaid connection.</p>
            <Button onClick={() => setViewState('CONNECTION_SELECT')}>
              Back to Options
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  // Show NESSI setup
  if (viewState === 'NESSI_SETUP') {
    return (
      <NessiSetupCard 
        onComplete={handleNessiComplete}
        onBack={() => setViewState('CONNECTION_SELECT')}
      />
    );
  }
  
  // Fallback
  return (
    <div className="flex justify-center items-center min-h-screen">
      <p>Preparing connection...</p>
    </div>
  );
}