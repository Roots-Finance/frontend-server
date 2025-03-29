"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaidLinkOnSuccessMetadata, usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlaidUser } from '@/hooks/usePlaidUser';

export default function AuthCallback() {
  const router = useRouter();
  const { user, error: auth0Error, isLoading: auth0Loading } = usePlaidUser();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  
  // This effect runs once when component mounts or when auth state changes
  useEffect(() => {
    // Skip if still loading auth data or no user
    if (auth0Loading || !user) return;
    
    // If user already has plaid data, redirect to dashboard
    if (user.plaidData) {
      router.push('/dashboard');
      return;
    }
    
    // Only proceed with link token creation if user has no plaid data and isn't loading
    if (!user.plaidLoading && !user.plaidData && !linkToken) {
      fetchLinkToken();
    }
  }, [auth0Loading, user, router, linkToken]);

  // Handle creating link token
  const fetchLinkToken = async () => {
    if (!user?.sub || localLoading) return;
    
    try {
      setLocalLoading(true);
      setLocalError(null);
      
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
      setLocalError(error instanceof Error ? error.message : 'Unknown error creating link token');
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Handle successful Plaid link
  const onPlaidSuccess = async (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => {
    if (!user?.sub) return;
    
    try {
      setLocalLoading(true);
      setLocalError(null);
      
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
      
      // Refresh Plaid data after successful connection
      if (user.refreshPlaidData) {
        await user.refreshPlaidData();
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Exchange token error:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to connect account');
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
        setLocalError('There was an issue connecting your bank account.');
      }
    }
  });
  
  // Show loading state
  if (auth0Loading || localLoading || user?.plaidLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Processing your request...</p>
      </div>
    );
  }
  
  // Show errors
  const errorMessage = localError || auth0Error?.message || user?.plaidError?.message;
  if (errorMessage) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-red-500 mb-4">{errorMessage}</p>
        <Button onClick={() => router.push('/api/auth/login')}>Try Again</Button>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    router.push('/api/auth/login');
    return null;
  }
  
  // If already connected, redirect to dashboard
  if (user.plaidData) {
    router.push('/dashboard');
    return null;
  }
  
  // Show Plaid Link button if not connected and we have a link token
  if (linkToken) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {reconnecting ? 'Reconnect Your Bank Account' : 'Connect Your Bank Account'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-center mb-6">
              {reconnecting 
                ? 'Your bank connection needs to be updated to continue using the app.'
                : 'To complete your registration, please connect your bank account.'
              }
            </p>
            
            <Button 
              onClick={() => open()} 
              disabled={!ready}
              className="w-full"
            >
              {reconnecting ? 'Update Bank Connection' : 'Connect Bank Account'}
            </Button>
            
            {!reconnecting && (
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mt-4"
              >
                Skip for now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Fallback while waiting for link token
  return (
    <div className="flex justify-center items-center min-h-screen">
      <p>Preparing connection...</p>
    </div>
  );
}