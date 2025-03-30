"use client"

import { useState, useEffect, useRef } from "react"
import { Star, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { KnotApiClient, KnotApiEvent, KnotApiConfig } from "@/lib/knot_client"

// Create a singleton instance of KnotApiClient
const knotApiClient = new KnotApiClient();

export default function CreditCardRecommendations({ user }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const [creditCards, setCreditCards] = useState([])
  const [knotSessionId, setKnotSessionId] = useState(null)
  const [knotLoading, setKnotLoading] = useState(false)
  const [knotError, setKnotError] = useState(null)
  
  // Extract the userId from the user object
  const userId = user?.sub || user?.id || user?.userId
  
  useEffect(() => {
    const fetchCards = async () => {
      try {
        // Only fetch if we have a userId
        if (!userId) {
          console.warn("No user ID available to fetch credit cards")
          return
        }
        
        const response = await fetch(`/api/sections/Cards/cards?userId=${encodeURIComponent(userId)}`)
        if (response.ok) {
          const data = await response.json()
          setCreditCards(data)
        } else {
          console.error("Error fetching credit cards:", response.statusText)
        }
      } catch (error) {
        console.error("Error fetching credit cards:", error)
      }
    }
    
    fetchCards()
    // Also fetch Knot session on component mount
    fetchKnotSession()
  }, [userId])

  // Fetch Knot session for card switching
  const fetchKnotSession = async () => {
    if (!userId) return;
    
    try {
      // Call your API to create a Knot session
      const response = await fetch("/api/knot/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: userId,
          email: user?.email,
          phone_number: user?.phoneNumber || "+11234567890", // fallback if not available
          processor_token: "processor-production-0asd1-a92nc", // Replace with actual token from your backend
          card_blocked: false,
          card_has_funds: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Knot session");
      }
      
      const data = await response.json();
      setKnotSessionId(data.session);
      
    } catch (error) {
      console.error("Error fetching Knot session:", error);
      setKnotError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Set up Knot event listeners
  useEffect(() => {
    // Define event handlers with proper typing
    const handleSuccess = (data) => {
      console.log('Knot success:', data);
      setKnotLoading(false);
      
      // Update the user record with Knot data if needed
      updateUserWithKnot(data);
    };

    const handleEvent = (data) => {
      console.log(`Knot event: ${data.event}`, data);
      
      // If the event is merchant_authenticated, we may want to handle it specially
      if (data.event === 'merchant_authenticated') {
        console.log('Merchant authenticated:', data.merchant);
      }
    };

    const handleError = (error) => {
      console.error('Knot error:', error);
      setKnotError(`Error with ${error.product}: ${error.message}`);
      setKnotLoading(false);
    };

    const handleExit = (data) => {
      console.log('Knot closed:', data.product);
      setKnotLoading(false);
    };

    // Add event listeners
    knotApiClient.on(KnotApiEvent.SUCCESS, handleSuccess);
    knotApiClient.on(KnotApiEvent.EVENT, handleEvent);
    knotApiClient.on(KnotApiEvent.ERROR, handleError);
    knotApiClient.on(KnotApiEvent.EXIT, handleExit);

    // Clean up event listeners
    return () => {
      knotApiClient.off(KnotApiEvent.SUCCESS, handleSuccess);
      knotApiClient.off(KnotApiEvent.EVENT, handleEvent);
      knotApiClient.off(KnotApiEvent.ERROR, handleError);
      knotApiClient.off(KnotApiEvent.EXIT, handleExit);
    };
  }, []);

  // Update user with Knot connection info
  const updateUserWithKnot = async (data) => {
    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          merchantData: data,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user with Knot connection");
      }
      
      // Possibly refresh data or show success message
    } catch (error) {
      console.error("Error updating user with Knot data:", error);
      setKnotError(error instanceof Error ? error.message : "Failed to save Knot connection");
    }
  };

  // Open the Knot card switcher using KnotApiClient
  const openKnotCardSwitcher = (card) => {
    if (!knotSessionId) {
      console.error("No Knot session ID available");
      fetchKnotSession(); // Try to fetch session again
      return;
    }

    setKnotLoading(true);
    
    try {
      const config = {
        sessionId: knotSessionId,
        clientId: process.env.NEXT_PUBLIC_KNOTAPI_CLIENT_ID || "",
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        product: 'transaction_link',
        companyName: 'Roots',
        primaryColor: '#0070f3',
        // These can be customized based on the selected card
        useCategories: true,
        merchantIds: [16], // This could be dynamic based on the selected card
        entryPoint: 'card_recommendation'
      };
      
      knotApiClient.open(config);
    } catch (error) {
      console.error("Error opening Knot card switcher:", error);
      setKnotError(error instanceof Error ? error.message : "Failed to open card switcher");
      setKnotLoading(false);
    }
  };

  // Fix the useRef with useEffect for initial scrolling
  useEffect(() => {
    setTimeout(() => {
      const initialCard = document.querySelector('[data-card-index="0"]')
      if (initialCard) {
        initialCard.scrollIntoView({
          block: 'center'
        })
      }
    }, 100)
  }, [])

  const handlePrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1)
      
      // Scroll the newly activated card into view
      setTimeout(() => {
        const newActiveCard = document.querySelector(`[data-card-index="${activeIndex - 1}"]`)
        if (newActiveCard) {
          newActiveCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }, 10)
    }
  }
  
  const handleNext = () => {
    if (activeIndex < creditCards.length - 1) {
      setActiveIndex(activeIndex + 1)
      
      // Scroll the newly activated card into view
      setTimeout(() => {
        const newActiveCard = document.querySelector(`[data-card-index="${activeIndex + 1}"]`)
        if (newActiveCard) {
          newActiveCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }, 10)
    }
  }

  // If no credit cards have been loaded yet, show a loading state
  if (creditCards.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Recommended Credit Cards For You</h1>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">Loading recommendations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recommended Credit Cards For You</h1>
      
      {/* Error messaging for Knot if needed */}
      {knotError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{knotError}</p>
          <button 
            className="underline mt-2 text-sm" 
            onClick={() => {
              setKnotError(null);
              fetchKnotSession();
            }}
          >
            Try again
          </button>
        </div>
      )}
      
      <div className="relative">
        <div 
          ref={containerRef}
          className="space-y-6 max-h-[80vh] overflow-y-auto pr-4"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.2) transparent'
          }}
        >
          {creditCards.map((card, index) => {
            const isActive = activeIndex === index
            
            return (
              <div 
                key={card.id}
                data-card-index={index}
                className={cn(
                  "relative transition-all duration-300 group",
                  isActive ? "h-[280px]" : "h-[100px]"
                )}
                onClick={() => {
                  setActiveIndex(index)
                  // Scroll this card into view when clicked
                  setTimeout(() => {
                    const clickedCard = document.querySelector(`[data-card-index="${index}"]`)
                    if (clickedCard) {
                      clickedCard.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                      })
                    }
                  }, 10)
                }}>
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 transition-opacity",
                  isActive ? "bg-primary/5 opacity-100" : "group-hover:opacity-100 bg-primary/3"
                )}></div>
                <Card className={cn(
                  "h-full border rounded-xl transition-all",
                  isActive 
                    ? "ring-2 ring-primary/20 shadow-md dark:from-slate-900/50 dark:to-background" 
                    : "shadow-sm hover:shadow-md cursor-pointer bg-background/80",
                  "backdrop-blur-[2px]"
                )}>
                  <CardContent className="flex p-0 h-full">
                    {/* Left column - Card image */}
                    <div className={cn(
                      "flex items-center justify-center relative",
                      isActive ? "w-2/5 p-6" : "w-1/4 p-4",
                      "transition-all duration-300 rounded-l-xl",
                      isActive 
                        ? "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-900/40" 
                        : "bg-slate-50 dark:bg-slate-800/20"
                    )}>
                    <div className={cn(
                      "relative w-full flex items-center justify-center", 
                      isActive ? "h-[200px]" : "h-[70px]",
                      "transition-all duration-300"
                    )}>
                      <img
                        src={card.image || card.image_url}
                        alt={`${card.bank} ${card.name || card.card} card`}
                        className="max-width-full max-h-full object-contain"
                        style={{
                          maxHeight: isActive ? '180px' : '60px'
                        }}
                      />
                    </div>
                    </div>

                    {/* Right column - Card details */}
                    <div className={cn(
                      "flex flex-col p-6",
                      isActive ? "w-3/5" : "w-3/4",
                      "transition-all duration-300"
                    )}>
                      {/* Title and savings - always visible */}
                      <div className="flex flex-col h-full justify-center">
                        <h2 className={cn(
                          "font-semibold transition-all",
                          isActive ? "text-xl mb-3" : "text-lg mb-1"
                        )}>
                          {card.bank} {card.name || card.card}
                        </h2>
                        
                        <div className="flex items-center text-sm text-emerald-600 font-medium">
                          <span>Save up to {card.savings}</span>
                          <Star className="h-4 w-4 ml-1 fill-current text-yellow-400" />
                        </div>

                        {/* Description - only visible when expanded */}
                        <div className={cn(
                          "transition-all duration-300",
                          isActive ? "max-h-40 mt-4 opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {card.description || `Apply for the ${card.bank} ${card.name || card.card} card and start earning rewards today.`}
                          </p>
                          <div className="flex gap-3 mt-4">
                            <a 
                              href={card.url || "#"} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
                            >
                              Apply Now
                            </a>
                            
                            {/* Add Knot integration button */}
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openKnotCardSwitcher(card);
                              }}
                              disabled={knotLoading}
                              className="inline-block px-4 py-2 text-sm rounded-md transition-colors shadow-sm hover:shadow-md"
                            >
                              {knotLoading ? "Processing..." : "Update Sites With This Card"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Navigation buttons - only show on active card */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-[calc(100%+12px)] flex flex-col space-y-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevious();
                      }}
                      disabled={activeIndex === 0}
                      className={cn(
                        "p-3 rounded-full bg-background border shadow-sm transition-colors",
                        activeIndex > 0 
                          ? "hover:bg-muted text-foreground hover:shadow-md hover:border-primary/30" 
                          : "text-muted-foreground cursor-not-allowed opacity-50"
                      )}
                      aria-label="Previous card"
                    >
                      <ChevronUp className="h-6 w-6" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      disabled={activeIndex === creditCards.length - 1}
                      className={cn(
                        "p-3 rounded-full bg-background border shadow-sm transition-colors",
                        activeIndex < creditCards.length - 1 
                          ? "hover:bg-muted text-foreground hover:shadow-md hover:border-primary/30" 
                          : "text-muted-foreground cursor-not-allowed opacity-50"
                      )}
                      aria-label="Next card"
                    >
                      <ChevronDown className="h-6 w-6" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}