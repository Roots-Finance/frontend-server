// app/dashboard/page.tsx
"use client";

import { useUser } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from "@/components/dashboard/Header";
import { SetupAlert } from "@/components/dashboard/SetupAlert";
import { DashboardContent } from "@/components/dashboard/DashBoardContent";
import { SideNav } from "@/components/dashboard/SideNav";
import { cn } from "@/lib/utils";
import { Section } from '@/components/dashboard/types';


export default function Dashboard() {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<Section>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    // redirect to login if user is not authenticated
    router.push('/auth/login');
    return null;
  }
  
  // Hide setup alert when a section is selected
  const showSetupAlert = !user.hasCompletedSetup && !selectedSection;
  
  // Handle sidebar expansion state changes
  const handleSidebarExpand = (expanded: boolean) => {
    setSidebarExpanded(expanded);
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Pass sidebar state handlers */}
      <SideNav 
        selectedSection={selectedSection} 
        onSelectSection={setSelectedSection}
        onExpand={handleSidebarExpand}
      />
      
      {/* Transition the main content area based on sidebar state */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out", 
          sidebarExpanded ? "ml-56" : "ml-16"
        )}
      >
        <Header userName={user.name!} />
        
        <main className="px-4 py-8">
          {/* Setup Banner - only shown on main dashboard view */}

          <h2 className="text-2xl font-bold mb-6 text-foreground">
            {selectedSection || 'Dashboard'}
          </h2>
          
          <div className="grid grid-cols-1 gap-6">
            <DashboardContent 
              selectedSection={selectedSection} 
              onSelectSection={setSelectedSection} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}