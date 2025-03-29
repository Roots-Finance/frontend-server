"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataUser } from '@/hooks/useDataUser';

// Simple loading state component
const LoadingState = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p>Processing your login...</p>
  </div>
);

// Auth callback component
export default function AuthCallback() {
  const router = useRouter();
  const { user, error, isLoading } = useDataUser();
  
  useEffect(() => {
    // Skip if still loading auth data
    if (isLoading) return;
    
    // If there's an error, handle it
    if (error) {
      console.error('Auth error:', error);
      router.push('/auth/login');
      return;
    }
    
    // If authenticated, check for user data
    if (user) {
      if (user.data) {
        // User already has data, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User needs to configure their account
        router.push('/user/config');
      }
    } else {
      // Not authenticated, redirect to login
      router.push('/auth/login');
    }
  }, [isLoading, user, error, router]);
  
  // Show loading state until redirected
  return <LoadingState />;
}