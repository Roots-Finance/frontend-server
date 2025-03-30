// components/dashboard/DashboardContent.tsx
"use client";

import { TransactionChart } from "@/components/dashboard/charts/TransactionChart";
import { SectionCardsGrid } from "@/components/dashboard/SectionCardsGrid";
import { Section } from "@/components/dashboard/types";
import { BudgetingSection } from "@/components/dashboard/sections/BudgetingSection";
import { InvestmentSection } from "@/components/dashboard/sections/InvestmentSection";

// import { getChartData } from "@/lib/data/transactions"
import { useDataUser } from "@/hooks/useDataUser";

interface DashboardContentProps {
  selectedSection: Section;
  onSelectSection: (section: Section) => void;
}

export function DashboardContent({ selectedSection, onSelectSection }: DashboardContentProps) {


  const {user, isLoading} = useDataUser();

  if (!user) return null;

  // Render the appropriate chart based on the selected section
  const renderChart = () => {
    switch (selectedSection) {
      case "Budgeting":
        return (
          <BudgetingSection
            user={user}
            userLoading={isLoading}
            onBack={() => onSelectSection(null)}
          />
        );
      case "Stock Investments":
        return (
          <InvestmentSection
            user={user}
            userLoading={isLoading}
            onBack={() => onSelectSection(null)}
            />
        )
    //   case "Stock Investments":
    //     return <InvestmentChart />;
    //   case "Bonds":
    //     return <BondsChart />;
    //   case "Stock Trading":
    //     return <TradingChart />;
      default:
        if (!user.data) return null;
        return <TransactionChart data={user.data?.transactions}/>;
    }
  };

  if (selectedSection) {
    return (
      <>
        <div className="col-span-4">{renderChart()}</div>
      </>
    );
  }
  
  return (
    <>
      <div className="col-span-4">
        <TransactionChart data={user.data?.transactions}/>
      </div>
      <div className="col-span-4">
        <SectionCardsGrid onSelectSection={onSelectSection} />
      </div>
    </>
  );
}
