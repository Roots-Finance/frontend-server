// app/api/sections/Investment/lessons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FullLessonData } from '@/components/dashboard/types';

export async function POST(request: NextRequest) {
  try {
    const { user_id, chartData } = await request.json();

    // In a real application, you would use the user_id and chartData
    // to fetch personalized lessons from your database
    
    // Mock data for the investment section
    const investmentLessons: FullLessonData = {
      title: "Investment Fundamentals",
      description: "Learn the essentials of investing to build long-term wealth and achieve your financial goals.",
      lessons: [
        {
          id: "inv-101",
          title: "Understanding Asset Classes",
          description: "Learn about different types of assets and how they fit into a balanced portfolio",
          duration: "15 min",
          content: [
            {
              title: "Introduction to Asset Classes",
              content: "Asset classes are categories of investments that behave similarly in the marketplace. The main asset classes include stocks, bonds, cash, real estate, and commodities. Each asset class has different risk and return profiles.",
              completed: false
            },
            {
              title: "Stocks and Equities",
              content: "Stocks represent ownership in a company. When you buy a stock, you're purchasing a share of the company's assets and earnings. Stocks generally provide the highest returns over long periods but come with higher volatility.",
              completed: false
            },
            {
              title: "Bonds and Fixed Income",
              content: "Bonds are loans you make to an entity (like a government or corporation) that promises to pay you back with interest. They're generally less volatile than stocks but offer lower returns over time.",
              completed: false
            }
          ]
        },
        {
          id: "inv-102",
          title: "Portfolio Diversification",
          description: "Strategies to spread risk across different investments to optimize returns",
          duration: "20 min",
          content: [
            {
              title: "Why Diversification Matters",
              content: "Diversification is the practice of spreading your investments across various asset classes to reduce risk. It works because different assets respond differently to market events.",
              completed: false
            },
            {
              title: "Creating a Diversified Portfolio",
              content: "A well-diversified portfolio typically includes a mix of stocks, bonds, and other assets. The specific allocation depends on your goals, time horizon, and risk tolerance.",
              completed: false
            },
            {
              title: "Rebalancing Your Portfolio",
              content: "Over time, some investments will perform better than others, changing your portfolio's allocation. Rebalancing involves periodically adjusting your investments back to your target allocation.",
              completed: false
            }
          ]
        },
        {
          id: "inv-103",
          title: "Investment Risk Management",
          description: "Techniques to assess and manage risk in your investment portfolio",
          duration: "25 min",
          content: [
            {
              title: "Understanding Investment Risk",
              content: "Investment risk is the possibility that an investment's actual return will differ from what's expected. Common risks include market risk, inflation risk, liquidity risk, and concentration risk.",
              completed: false
            },
            {
              title: "Risk Tolerance Assessment",
              content: "Your risk tolerance is influenced by factors like your time horizon, financial situation, and personal comfort with market fluctuations. It's important to align your investments with your risk tolerance.",
              completed: false
            },
            {
              title: "Risk Management Strategies",
              content: "Effective strategies include diversification, asset allocation, dollar-cost averaging, and maintaining an emergency fund to avoid selling investments during market downturns.",
              completed: false
            }
          ]
        }
      ],
      resources: [
        {
          id: "res-201",
          title: "Investment Portfolio Calculator",
          type: "Tool",
          url: "https://example.com/tools/portfolio-calculator",
          description: "Interactive tool to analyze your investment allocation and projected returns"
        },
        {
          id: "res-202",
          title: "Beginner's Guide to Index Funds",
          type: "Article",
          url: "https://example.com/articles/index-fund-guide",
          description: "Comprehensive overview of index fund investing for beginners"
        },
        {
          id: "res-203",
          title: "Asset Allocation Spreadsheet Template",
          type: "Spreadsheet",
          url: "https://example.com/templates/asset-allocation.xlsx",
          description: "Download this template to track and plan your investment allocation"
        },
        {
          id: "res-204",
          title: "Understanding Market Cycles",
          type: "Video",
          url: "https://example.com/videos/market-cycles",
          description: "Expert explanation of market cycles and their impact on investments"
        },
        {
          id: "res-205",
          title: "Annual Investment Returns by Asset Class",
          type: "Data",
          url: "https://example.com/data/historical-returns",
          description: "Historical data showing annual returns for major asset classes"
        },
        {
          id: "res-206",
          title: "Tax-Efficient Investing Guide",
          type: "PDF",
          url: "https://example.com/guides/tax-efficient-investing.pdf",
          description: "Learn how to minimize tax impact on your investment returns"
        }
      ]
    };

    return NextResponse.json(investmentLessons);
  } catch (error) {
    console.error('Error in Investment lessons API:', error);
    return NextResponse.json(
      { error: 'Failed to load investment lessons' },
      { status: 500 }
    );
  }
}
