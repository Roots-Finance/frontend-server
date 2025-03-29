// app/page.js
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-50 dark:from-background dark:to-slate-900/50">
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
        {/* Simple header */}
        <header className="flex justify-end space-x-4 mb-20">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </header>

        {/* Hero section */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h1 className="text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
            Take Control of Your Financial Future
          </h1>
          <p className="text-xl text-muted-foreground">
            Master essential skills in budgeting, stock investments, bonds, and trading strategies.
          </p>
        </div>

        {/* Main CTAs */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 mb-24">
          <div className="rounded-xl p-8 bg-card border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-semibold mb-4">For Beginners</h3>
            <p className="text-muted-foreground mb-6">
              Start your financial journey with our easy-to-follow lessons and practical budgeting tools.
            </p>
            <Button className="w-full" size="lg">Get Started</Button>
          </div>
          <div className="rounded-xl p-8 bg-card border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-semibold mb-4">For Experienced</h3>
            <p className="text-muted-foreground mb-6">
              Deepen your knowledge with advanced lessons on investment strategies and market analysis.
            </p>
            <Button className="w-full" variant="outline" size="lg">
              Explore Advanced Topics
            </Button>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            {
              title: "Budgeting",
              description: "Learn to track expenses and save effectively",
              icon: "💰"
            },
            {
              title: "Stock Investing",
              description: "Understand market fundamentals and portfolio building",
              icon: "📈"
            },
            {
              title: "Bonds",
              description: "Explore fixed-income securities and yield calculations",
              icon: "🔒"
            },
            {
              title: "Stock Trading",
              description: "Master technical analysis and trading strategies",
              icon: "⚡"
            }
          ].map((feature, index) => (
            <div key={index} className="p-6 rounded-lg bg-card/50 border hover:bg-card/80 transition-colors">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}