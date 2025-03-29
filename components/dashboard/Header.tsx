// components/dashboard/Header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center w-full">
        
        {/* Title section with left border */}
        <div className="h-full flex items-center border-l px-6">
          <span className="font-bold text-lg">Financial Education</span>
        </div>
        
        {/* User info pushed to the right */}
        <div className="ml-auto flex items-center gap-4 px-6">
          <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
          <ThemeToggle />
          <a href="/auth/logout">
            <Button variant="ghost">Logout</Button>
          </a>
        </div>
      </div>
    </header>
  );
}