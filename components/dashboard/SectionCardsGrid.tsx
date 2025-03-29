// components/dashboard/SectionCardsGrid.tsx 
"use client";

import { DollarSign, TrendingUp, BanIcon, BookOpen } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Section } from "@/app/dashboard/page";

interface SectionCardsGridProps {
  onSelectSection: (section: Section) => void;
}

export function SectionCardsGrid({ onSelectSection }: SectionCardsGridProps) {
  // Define all section data
  const sections = [
    {
      id: 'Budgeting' as Section,
      title: 'Budgeting',
      description: 'Learn to manage your finances',
      content: 'Create budgets, track expenses, and improve your financial health.',
      icon: DollarSign,
      buttonText: 'View Budgeting Tools',
      gridClass: 'col-span-1 md:col-span-1 lg:col-span-2'
    },
    {
      id: 'Stock Investments' as Section,
      title: 'Stock Investments',
      description: 'Learn about stock markets',
      content: 'Understand stock markets, investment strategies, and portfolio management.',
      icon: TrendingUp,
      buttonText: 'Start Learning',
      gridClass: 'col-span-1 md:col-span-1 lg:col-span-2'
    },
    {
      id: 'Bonds' as Section,
      title: 'Bonds',
      description: 'Learn about fixed income securities',
      content: 'Understand different types of bonds, yields, and their role in diversification.',
      icon: BanIcon,
      buttonText: 'Explore Bonds',
      gridClass: 'col-span-1 md:col-span-1 lg:col-span-2'
    },
    {
      id: 'Stock Trading' as Section,
      title: 'Stock Trading',
      description: 'Learn advanced trading concepts',
      content: 'Master technical analysis, day trading strategies, and risk management.',
      icon: BookOpen,
      buttonText: 'Advanced Topics',
      gridClass: 'col-span-1 md:col-span-1 lg:col-span-2'
    }
  ];

  // Group sections into top row and bottom row
  const topRowSections = sections.slice(0, 2);
  const bottomRowSections = sections.slice(2);

  return (
    <div className="flex flex-col gap-6">
      {/* Top row - Budgeting and Stock Investments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topRowSections.map(section => (
          <SectionCard
            key={section.id}
            title={section.title}
            description={section.description}
            content={section.content}
            icon={section.icon}
            buttonText={section.buttonText}
            onSelect={() => onSelectSection(section.id)}
          />
        ))}
      </div>
      
      {/* Bottom row - Bonds and Stock Trading */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bottomRowSections.map(section => (
          <SectionCard
            key={section.id}
            title={section.title}
            description={section.description}
            content={section.content}
            icon={section.icon}
            buttonText={section.buttonText}
            onSelect={() => onSelectSection(section.id)}
          />
        ))}
      </div>
    </div>
  );
}