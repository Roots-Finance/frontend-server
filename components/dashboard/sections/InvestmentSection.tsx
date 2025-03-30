import PortfolioAllocationManager from "../PortfolioAllocationManager";
import { TransactionChart } from "../charts/TransactionChart";
import { useState, useEffect } from "react";
import InvestmentQuestionnairePopup from "../InvestmentQuestionnairePopup"; 

export default function InvestmentSection() {
    // Simple state to manage form completion and popup visibility
    const [hasCompletedForm, setHasCompletedForm] = useState(false);
    const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
    
    // Check if user has completed form and open questionnaire if not
    useEffect(() => {
        if (!hasCompletedForm) {
            // You could also check localStorage or an API here to see if user has previously completed the form
            setIsQuestionnaireOpen(true);
        }
    }, [hasCompletedForm]);
    
    const handleQuestionnaireComplete = (data) => {
        console.log('Investment questionnaire completed with data:', data);
        // In a real app, you would send this data to your API
        setHasCompletedForm(true);
        
        // You could save completion status to localStorage or your backend
        // localStorage.setItem('investmentFormCompleted', 'true');
    };
    
    const handleQuestionnaireClose = () => {
        // Simply close the questionnaire without showing an alert
        setIsQuestionnaireOpen(false);
        // The overlay will still be visible since hasCompletedForm is still false
    };
    
    return (
        <div className="relative">
            {/* Main content - blurred until form is completed */}
            <div className={hasCompletedForm ? "" : "filter blur-sm pointer-events-none"}>
                <TransactionChart />
                <PortfolioAllocationManager />
            </div>
            
            {/* Overlay with button to open questionnaire */}
            {!hasCompletedForm && !isQuestionnaireOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-40">
                    <div className="bg-background rounded-lg shadow-xl p-6 max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-3">Complete Your Investment Profile</h2>
                        <p className="mb-4 text-muted-foreground">
                            Please complete the investment questionnaire to get personalized investment recommendations.
                        </p>
                        <button
                            onClick={() => setIsQuestionnaireOpen(true)}
                            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
                        >
                            Take Investment Questionnaire
                        </button>
                    </div>
                </div>
            )}
            
            {/* The questionnaire popup */}
            <InvestmentQuestionnairePopup 
                isOpen={isQuestionnaireOpen}
                onClose={handleQuestionnaireClose}
                onSubmit={handleQuestionnaireComplete}
                preventOutsideClose={false} // Allow them to close by clicking outside
            />
        </div>
    );
}