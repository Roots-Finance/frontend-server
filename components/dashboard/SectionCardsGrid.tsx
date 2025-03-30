"use client";

import { DollarSign, TrendingUp, BanIcon, BookOpen, Receipt } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Section } from "./types";

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
      id: 'Stock Trading' as Section,
      title: 'Stock Trading',
      description: 'Learn advanced trading concepts',
      content: 'Master technical analysis, day trading strategies, and risk management.',
      icon: BookOpen,
      buttonText: 'Advanced Topics',
      gridClass: 'col-span-1 md:col-span-1 lg:col-span-2'
    },
    {
      id: 'Taxes' as Section,
      title: 'Taxes',
      description: 'Optimize your tax strategy',
      content: 'Review potential deductions, understand tax liability, and plan for tax season.',
      icon: Receipt,
      buttonText: 'View Tax Information',
      gridClass: 'col-span-1 md:col-span-1 lg:col-span-2'
    }
  ];

  // Group sections into rows of 2
  const firstRow = sections.slice(0, 2);
  const secondRow = sections.slice(2, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* First row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {firstRow.map(section => (
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
      
      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {secondRow.map(section => (
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