"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Star, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Sample data for credit cards
const creditCards = [
  {
    id: 1,
    bank: "Chase",
    name: "Sapphire Preferred",
    savings: 750,
    description:
      "The Chase Sapphire Preferred offers excellent travel rewards with a generous sign-up bonus and flexible redemption options. Earn 2x points on travel and dining worldwide, with no foreign transaction fees.",
    image: "/credit-cards/chase-sapphire-preferred.png" // Replace with actual path
  },
  {
    id: 2,
    bank: "American Express",
    name: "Gold Card",
    savings: 600,
    description:
      "The American Express Gold Card is perfect for foodies, offering 4x points at restaurants and supermarkets. Enjoy monthly dining and Uber credits that help offset the annual fee.",
    image: "/credit-cards/amex-gold.png" // Replace with actual path
  },
  {
    id: 3,
    bank: "Capital One",
    name: "Venture X",
    savings: 800,
    description:
      "The Capital One Venture X provides premium travel benefits at a reasonable price point. Enjoy airport lounge access, annual travel credits, and 10x miles on hotels and rental cars booked through Capital One Travel.",
    image: "/credit-cards/capital-one-venture.png" // Replace with actual path
  },
  {
    id: 4,
    bank: "Citi",
    name: "Double Cash",
    savings: 400,
    description:
      "The Citi Double Cash card offers straightforward cash back with no annual fee. Earn effectively 2% on every purchase—1% when you buy and 1% when you pay your bill.",
    image: "https://placehold.co/600x400" // Replace with actual path
  },
  {
    id: 5,
    bank: "Discover",
    name: "It Cash Back",
    savings: 350,
    description:
      "The Discover it Cash Back features rotating 5% cash back categories each quarter and matches all the cash back you earn in your first year. Perfect for maximizing rewards in different spending categories.",
    image: "/credit-cards/discover-it.png" // Replace with actual path
  },
]

export default function CreditCardRecommendations() {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
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

  // Scroll the initial active card into view when component mounts
  useRef(() => {
    setTimeout(() => {
      const initialCard = document.querySelector('[data-card-index="0"]')
      if (initialCard) {
        initialCard.scrollIntoView({
          block: 'center'
        })
      }
    }, 100)
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recommended Credit Cards For You</h1>
      
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
                  "relative transition-all duration-300",
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
                }}
              >
                <Card className={cn(
                  "h-full border rounded-xl transition-all",
                  isActive 
                    ? "ring-2 ring-primary/20 shadow-md" 
                    : "shadow-sm hover:shadow-md cursor-pointer"
                )}>
                  <CardContent className="flex p-0 h-full">
                    {/* Left column - Card image */}
                    <div className={cn(
                      "flex items-center justify-center bg-slate-50 relative",
                      isActive ? "w-2/5 p-6" : "w-1/4 p-4",
                      "transition-all duration-300 rounded-l-xl"
                    )}>
                      <div className={cn(
                        "relative w-full", 
                        isActive ? "h-[200px]" : "h-[70px]",
                        "transition-all duration-300"
                      )}>
                        {/* Use placeholder.svg just for the example */}
                        <Image
                          src={`/placeholder.svg?height=${isActive ? 200 : 70}&width=${isActive ? 320 : 110}`}
                          alt={`${card.bank} ${card.name} card`}
                          fill
                          className="object-contain"
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
                          {card.bank} {card.name}
                        </h2>
                        
                        <div className="flex items-center text-sm text-emerald-600 font-medium">
                          <span>Save up to ${card.savings}/year</span>
                          <Star className="h-4 w-4 ml-1 fill-current" />
                        </div>

                        {/* Description - only visible when expanded */}
                        <div className={cn(
                          "transition-all duration-300",
                          isActive ? "max-h-40 mt-4 opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
                            Apply Now
                          </button>
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
                          ? "hover:bg-muted text-foreground" 
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
                          ? "hover:bg-muted text-foreground" 
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