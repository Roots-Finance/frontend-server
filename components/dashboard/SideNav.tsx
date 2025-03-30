"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DollarSign, Home, TrendingUp, CreditCard, BookOpen, ChevronRight, Receipt } from "lucide-react";
import { Section } from "@/app/dashboard/page";

interface SideNavProps {
  selectedSection: Section;
  onSelectSection: (section: Section) => void;
  onExpand: (expanded: boolean) => void;
}

export function SideNav({ selectedSection, onSelectSection, onExpand }: SideNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Update the handleMouseEnter and handleMouseLeave functions
  const handleMouseEnter = () => {
    setIsExpanded(true);
    onExpand(true);
  };
  
  const handleMouseLeave = () => {
    setIsExpanded(false);
    onExpand(false);
  };

  const navItems = [
    {
      id: null as Section,
      name: "Dashboard",
      icon: Home
    },
    {
      id: "Budgeting" as Section,
      name: "Budgeting",
      icon: DollarSign
    },
    {
      id: "Stock Investments" as Section,
      name: "Investments",
      icon: TrendingUp
    },
    {
      id: "Cards" as Section,
      name: "Cards",
      icon: CreditCard
    },
    {
      id: "Taxes" as Section,
      name: "Taxes",
      icon: Receipt
    }
  ];


  return (
    <div 
      className={cn(
        "fixed top-0 left-0 h-full bg-background border-r z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "w-56" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-16 flex items-center justify-center border-b">
        <span className={cn("font-bold", isExpanded ? "text-xl" : "text-sm")}>
          {isExpanded ? "Roots" : "R"}
        </span>
      </div>
      
      <nav className="py-4 flex flex-col space-y-2 px-2">
        {navItems.map((item) => (
          <Button
            key={item.name}
            variant={selectedSection === item.id ? "default" : "ghost"}
            className={cn(
              "justify-start h-10 px-3",
              selectedSection === item.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSelectSection(item.id)}
          >
            <item.icon className="h-4 w-4 mr-2" />
            <span className={cn("transition-opacity", 
              isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}>
              {item.name}
            </span>
          </Button>
        ))}
      </nav>
      
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
        <div className={cn(
          "bg-muted/50 rounded-full flex items-center justify-center",
          "h-8 w-8 cursor-pointer transition-opacity duration-200",
          isExpanded ? "opacity-0" : "opacity-100"
        )}>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}