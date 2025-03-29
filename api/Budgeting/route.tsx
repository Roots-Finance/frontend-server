import { NextRequest, NextResponse } from "next/server";
import { ExtraTransaction } from "@/hooks/usePlaidUser";


/**
 * Rocco here.
 * 
 * All of this should be offloaded to AI, imo. There's enough information given for AI to give solid advice
 * on what to spend, and what not to spend.
 */

// Helper function to determine if a transaction is discretionary
function isDiscretionary(transaction: ExtraTransaction): boolean {
  // Plaid's categories that are typically discretionary
  const discretionaryCategories = [
    "Food and Drink", 
    "Entertainment",
    "Shopping",
    "Recreation",
    "Travel",
    "Personal Care",
    "Subscription"
  ];
  
  // Check if primary category (first in array) is discretionary
  if (transaction.category && transaction.category.length > 0) {
    return discretionaryCategories.some(cat => 
      transaction.category![0]?.toLowerCase().includes(cat.toLowerCase())
    );
  }
  
  return false;
}

// Helper function to determine if a transaction is savings
function isSavings(transaction: ExtraTransaction): boolean {
  // Plaid's categories that are typically savings
  const savingsCategories = [
    "Transfer", 
    "Deposit"
  ];
  
  // Check for transfers to savings accounts
  if (transaction.amount < 0 && transaction.category) {
    return savingsCategories.some(cat => 
      transaction.category!.some(c => c.toLowerCase().includes(cat.toLowerCase()))
    );
  }
  
  return false;
}

// This would typically be fetched from a database
const getBudgetingSectionContent = (transactions: ExtraTransaction[]) => {
  // Calculate total expenses (negative amounts are expenses in Plaid)
  const expenses = transactions.filter(t => t.amount > 0); // In Plaid, positive amounts are debits (expenses)
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  console.log(transactions)
  // Calculate discretionary expenses
  const discretionaryExpenses = expenses
    .filter(t => isDiscretionary(t))
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate current savings and potential savings
  const savingsTransactions = transactions.filter(t => isSavings(t) && t.amount < 0); // Negative amounts are credits
  const currentSavings = Math.abs(savingsTransactions.reduce((sum, t) => sum + t.amount, 0));
  
  // Default to 10% of total expenses if no savings found
  const effectiveSavings = currentSavings
  
  // Assume 50% of discretionary could be saved
  const potentialSavings = effectiveSavings + (discretionaryExpenses * 0.5);
  const percentIncrease = Math.round(((potentialSavings - effectiveSavings) / effectiveSavings) * 100);
  
  // Identify top discretionary categories
  const discretionaryByCategory: Record<string, number> = {};
  
  expenses
    .filter(t => isDiscretionary(t))
    .forEach(t => {
      const category = t.category && t.category.length > 0 
        ? t.category[0] 
        : t.merchant_name || 'Other';
        
      if (!discretionaryByCategory[category]) {
        discretionaryByCategory[category] = 0;
      }
      discretionaryByCategory[category] += t.amount;
    });


  // Sort categories by amount
  const sortedCategories = Object.entries(discretionaryByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount }));
  
  const topSpendingCategory = sortedCategories[0]?.category || 'discretionary spending';
  
  return {
    title: "Budgeting Fundamentals",
    description: "Learn how to create and maintain a personal budget that helps you achieve your financial goals.",
    savings: {
      current: Math.round(effectiveSavings),
      potential: Math.round(potentialSavings),
      percentIncrease: percentIncrease > 0 ? percentIncrease : 10 // Default to 10% if calculation is off
    },
    lessons: [
      {
        id: "cut-discretionary",
        title: `Trim Your ${topSpendingCategory} Spending`,
        description: `Discover effective strategies to reduce ${topSpendingCategory.toLowerCase()} expenses while still enjoying life.`,
        duration: "10 min",
        content: [
          {
            title: "Understanding Your Spending Patterns",
            content: "Your spending patterns are the foundation of your financial health. By analyzing where your money goes each month, you can identify areas where you might be overspending or where you could potentially save more. Look at your chart to see how your balance changes over time, and notice the difference between your actual spending and what it could be with reduced discretionary expenses.",
            completed: false
          },
          {
            title: "Identifying Essential vs. Discretionary Expenses",
            content: "Essential expenses are those you can't avoid: housing, utilities, groceries, transportation, and healthcare. Discretionary expenses are those you have more control over: dining out, entertainment, shopping, and subscriptions. The purple line on your chart shows how your balance would look if you reduced discretionary spending. This doesn't mean eliminating things you enjoy, but rather being more intentional about where your money goes.",
            completed: false
          },
          {
            title: "Creating a Sustainable Savings Plan",
            content: "A good savings plan should be challenging but sustainable. Start by setting aside a small percentage of your income (even 5-10%) and gradually increase it over time. Automating your savings is one of the most effective strategies - set up a recurring transfer to your savings account on payday so you're saving before you have a chance to spend. Remember, consistency is more important than amount when you're starting out.",
            completed: false
          },
          {
            title: "Implementing Your New Budget",
            content: "Now that you understand your spending patterns and have identified potential savings opportunities, it's time to implement your plan. Start by reducing discretionary spending in your highest expense category. Set specific, measurable goals, like 'Reduce dining out from $400 to $300 this month' rather than just 'Spend less on food.' Track your progress weekly to stay accountable and make adjustments as needed. Remember, budgeting is a skill that improves with practice.",
            completed: false
          }
        ]
      },
      {
        id: "budget-basics",
        title: "Budget Basics",
        description: "Learn the fundamentals of creating and maintaining a personal budget.",
        duration: "15 min",
        content: [
          {
            title: "What is a Budget?",
            content: "A budget is a financial plan that helps you track your income and expenses over a period of time. It's a tool that allows you to make informed decisions about your money and ensures you're spending less than you earn. A good budget should align with your financial goals and values.",
            completed: false
          },
          {
            title: "The 50/30/20 Rule",
            content: "The 50/30/20 rule is a simple budgeting framework that allocates 50% of your income to needs (housing, utilities, groceries), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment. This balanced approach ensures you're meeting your obligations while still enjoying life and building financial security.",
            completed: false
          },
          {
            title: "Tracking Your Spending",
            content: "Consistent tracking is key to successful budgeting. Review your transactions regularly to ensure you're staying within your planned limits. Categorize your expenses to identify patterns and opportunities for savings. Remember that budgeting is an ongoing process - your budget should evolve as your financial situation changes.",
            completed: false
          }
        ]
      }
    ],
    resources: [
      {
        id: "budget-template",
        title: "Simple Budget Template",
        type: "Spreadsheet",
        url: "https://www.consumerfinance.gov/consumer-tools/budget-template/",
        description: "A free budget spreadsheet from the Consumer Financial Protection Bureau."
      },
      {
        id: "emergency-fund",
        title: "Building an Emergency Fund",
        type: "Article",
        url: "https://www.investopedia.com/terms/e/emergency_fund.asp",
        description: "Learn why emergency funds are important and how to start yours."
      }
    ]
  };
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get chart data
    const { chartData } = await request.json();
    
    if (!chartData) {
      return NextResponse.json(
        { error: 'Chart data is required' },
        { status: 400 }
      );
    }
    
    // Generate personalized content based on the chart data
    const content = getBudgetingSectionContent(chartData);
    
    // Return the content
    return NextResponse.json(content);
    
  } catch (error) {
    console.error('Error generating section content:', error);
    return NextResponse.json(
      { error: 'Failed to generate section content' },
      { status: 500 }
    );
  }
}