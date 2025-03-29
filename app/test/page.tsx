"use client";

import { TransactionChart } from "@/components/dashboard/charts/TransactionChart";
import { sampleTransactions } from "./sampleTransactions";
//import  PortfolioAllocationChart  from "@/components/dashboard/charts/alt/PortfolioAllocationChart";
import  {PortfolioPieChart}  from "@/components/dashboard/charts/PortfolioPieChart";
//import { TraditionalPieChart } from "@/components/dashboard/charts/alt/TraditionalPieChart"
import PortfolioAllocationManager from "@/components/dashboard/sections/PortfolioAllocationManager";

export default function TestPage() {
  const portfolioData = {
    "US Stocks": 25000,
    "International Stocks": 15000,
    "Bonds": 10000,
    "Real Estate": 7500,
    "Crypto": 2500,
    "Cash": 5000
  };
    
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Component Testing Area</h1>
      
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Transaction Chart</h2>
        <TransactionChart data={sampleTransactions} />
      </div>
    <PortfolioPieChart></PortfolioPieChart>
    <PortfolioAllocationManager></PortfolioAllocationManager>
    </div>
  );
}
