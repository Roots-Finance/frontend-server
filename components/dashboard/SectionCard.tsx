// components/dashboard/SectionCard.tsx
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  description: string;
  content: string;
  icon: LucideIcon;
  buttonText?: string;
  onSelect: () => void;
}

export function SectionCard({ 
  title, 
  description, 
  content, 
  icon: Icon, 
  buttonText,
  onSelect 
}: SectionCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{content}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          {buttonText || `View ${title}`}
        </Button>
      </CardFooter>
    </Card>
  );
}