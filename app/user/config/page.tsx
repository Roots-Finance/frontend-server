"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataUser } from '@/hooks/useDataUser';
import { ConnectionType, IAccount, ITransaction, DBUser, DBUserData } from '@/lib/types';

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

// Interface for API responses
interface ApiResponse<T> {
  status: 0 | 1;
  error: 0 | 1;
  message?: string;
  user?: T;
  data?: T;
}

// Interface for user data extended with connection info
interface ExtendedUser extends DBUser {
  connection_type?: ConnectionType;
  plaid_key?: string | null;
  knot_key?: string | null;
  nessi_key?: string | null;
  plaid_item_id?: string;
  plaid_key_needs_update?: boolean;
}

// User Config component
export default function UserConfig() {
  const router = useRouter();
  const { user, error: auth0Error, isLoading: auth0Loading } = useDataUser();
  const [viewState, setViewState] = useState<ViewState>('LOADING');
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType>(ConnectionType.NONE);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isPlaidLoading, setIsPlaidLoading] = useState(false);
  const [userData, setUserData] = useState<ExtendedUser | null>(null);

  // Fetch user data from our API
  const fetchUserData = async (): Promise<ExtendedUser | null> => {
    if (!user?.sub) return null;
    
    try {
      const response = await fetch(`/api/user?userId=${encodeURIComponent(user.sub)}`);
      
      if (!response.ok) {
        // If user doesn't exist yet (404), create the user
        if (response.status === 404) {
          console.log('sup')
          return await createUser();
        }
        throw new Error(`Error fetching user data: ${response.status}`);
      }
      
      const data = await response.json() as ApiResponse<ExtendedUser>;
      const fetchedUserData = data.user || null;
      setUserData(fetchedUserData);
      return fetchedUserData;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  // Create a new user
  const createUser = async (): Promise<ExtendedUser | null> => {
    const name = user?.name || 'TEST'
    const lastName = user?.family_name || 'TEST'
    if (!user?.sub || !name) return null;
    
    try {
      const userData: DBUserData = {
        oauth_sub: user.sub,
        first_name: name,
        last_name: lastName
      };
      
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating user: ${response.status}`);
      }
      
      const data = await response.json() as ApiResponse<ExtendedUser>;
      const createdUserData = data.user || null;
      setUserData(createdUserData);
      return createdUserData;
    } catch (error) {
      console.error('Error creating user:', error);
      setViewState('ERROR');
      return null;
    }
  };

  // Fetch Plaid link token
  const fetchPlaidLinkToken = async () => {
    if (!user?.sub || isPlaidLoading) return;
    
    try {
      setIsPlaidLoading(true);
      setPlaidError(null);
      
      // First check if we need to reconnect by checking user's connection
      const userData = await fetchUserData();
      
      if (!userData) {
        throw new Error('User data not available');
      }
      
      // Check if user has Plaid connection that needs to be reconnected
      const needsReconnect = userData.connection_type === ConnectionType.PLAID && 
                           (!userData.plaid_key || userData.plaid_key_needs_update);
      
      setIsReconnecting(!!needsReconnect);
      
      // Create link token
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_user_id: user.sub,
          ...(needsReconnect && userData.plaid_item_id ? { itemId: userData.plaid_item_id } : {})
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create link token');
      }
      
      const { link_token } = await response.json();
      setPlaidLinkToken(link_token);
    } catch (error) {
      console.error('Link token error:', error);
      setPlaidError(error instanceof Error ? error.message : 'Unknown error creating link token');
      setViewState('ERROR');
    } finally {
      setIsPlaidLoading(false);
    }
  };

  // Interface for Plaid metadata
  interface PlaidMetadata {
    institution?: {
      name: string;
      institution_id: string;
    };
    accounts?: Array<{
      id: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
    }>;
    link_session_id?: string;
    [key: string]: any;
  }

  // Interface for token exchange response
  interface TokenExchangeResponse {
    accessToken: string;
    itemId: string;
    error?: string;
  }

  // Handle successful Plaid connection
  const handlePlaidSuccess = async (public_token: string, metadata: PlaidMetadata) => {
    if (!user?.sub) return;
    
    try {
      setIsPlaidLoading(true);
      setPlaidError(null);
      
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          metadata,
          userId: user.sub,
          ...(isReconnecting ? { reconnect: true } : {})
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange token');
      }

      const { accessToken, itemId } = await response.json() as TokenExchangeResponse;
      
      // Update user's connection type and Plaid key
      const updateResponse = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          connectionType: ConnectionType.PLAID,
          key: accessToken
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update user connection');
      }
      
      // Use the refreshData method from useDataUser hook if available
      if (user.refreshData) {
        await user.refreshData();
      } else {
        // Otherwise refresh user data manually
        await fetchUserData();
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Exchange token error:', error);
      setPlaidError(error instanceof Error ? error.message : 'Failed to connect account');
      setViewState('ERROR');
    } finally {
      setIsPlaidLoading(false);
    }
  };
  
  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: plaidLinkToken || '',
    onSuccess: handlePlaidSuccess as any,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
        setPlaidError('There was an issue connecting your bank account.');
        setViewState('ERROR');
      }
    }
  });
  
  // Handle NESSI setup completion
  const handleNessiComplete = async () => {
    if (!user?.sub) return;
    
    try {
      // Update user's connection type to NESSI
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          connectionType: ConnectionType.NESSI,
          key: 'default-nessi-key' // Use a default key for NESSI
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set connection type');
      }
      
      // Use the refreshData method from useDataUser hook if available
      if (user.refreshData) {
        await user.refreshData();
      } else {
        // Otherwise refresh user data manually
        await fetchUserData();
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing NESSI setup:', error);
      setViewState('ERROR');
    }
  };

  // Handle connection type selection
  const handleSelectConnectionType = (type: ConnectionType) => {
    setSelectedConnectionType(type);
    
    if (type === ConnectionType.PLAID) {
      setViewState('PLAID_SETUP');
      fetchPlaidLinkToken();
    } else if (type === ConnectionType.NESSI) {
      setViewState('NESSI_SETUP');
    }
  };
  
  // Check if user should be redirected to dashboard
  const checkUserRedirect = async (): Promise<boolean> => {
    // Skip if still loading auth data or no user
    if (auth0Loading || !user?.sub) return false;
    
    try {
      // Fetch updated user data
      const userData = await fetchUserData();
      
      // If user has a connection type set, redirect to dashboard
      if (userData && userData.connection_type && userData.connection_type !== ConnectionType.NONE) {
        router.push('/dashboard');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking user redirect:', error);
      return false;
    }
  };
  
  // This effect manages the component lifecycle
  useEffect(() => {
    const initializeComponent = async () => {
      // Skip if still loading auth data or no user
      if (auth0Loading || !user?.sub) return;
      
      // Check if user should be redirected
      const shouldRedirect = await checkUserRedirect();
      
      if (!shouldRedirect) {
        // If everything is loaded but user has no connection yet, show connection selection
        setViewState('CONNECTION_SELECT');
      }
    };
    
    initializeComponent();
  }, [auth0Loading, user?.sub]);
  
  // Show loading state
  if (auth0Loading || user?.dataLoading || viewState === 'LOADING' || isPlaidLoading) {
    return <LoadingState />;
  }
  
  // Show errors
  const errorMessage = plaidError || auth0Error?.message || user?.dataError?.message;
  if (errorMessage || viewState === 'ERROR') {
    return <ErrorState 
      message={errorMessage || "An error occurred during setup."} 
      onRetry={() => {
        setViewState('CONNECTION_SELECT');
        setPlaidError(null);
      }} 
    />;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    router.push('/auth/login');
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
        {isPlaidLoading ? (
          <p>Preparing Plaid connection...</p>
        ) : plaidLinkToken ? (
          <PlaidLinkCard 
            isReconnecting={isReconnecting}
            onConnect={() => open()}
            onSkip={() => router.push('/dashboard')}
            onBack={() => setViewState('CONNECTION_SELECT')}
            disabled={!ready}
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