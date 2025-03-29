// components/dashboard/SetupAlert.tsx
"use client";

import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface SetupAlertProps {
  progress: number;
}

export function SetupAlert({ progress }: SetupAlertProps) {
  return (
    <Alert className="mb-8">
      <AlertTitle className="font-medium">Complete your account setup</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <Progress value={progress} className="h-2 w-full" />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{progress}% complete</span>
            <Link href="/dashboard/setup">
              <Button size="sm" variant="default">Continue Setup</Button>
            </Link>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}