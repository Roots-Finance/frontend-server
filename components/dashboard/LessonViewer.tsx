// components/dashboard/sections/LessonViewer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowLeft, ArrowRight, CheckCircle, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionChart, ChartLine } from "@/components/dashboard/charts/TransactionChart";

import { ITransaction } from "@/lib/types";
import { Lesson } from "./types";

interface LessonViewerProps {
  lesson: Lesson;
  chartData: ITransaction[];
  lines: ChartLine[];
  onClose: () => void;
  onComplete: (lessonId: string) => void;
  
  // Layout configuration
  fullPropWidth?: string           // Width of the full prop (CSS value)
  fullPropHeight?: string;         // Height of the full prop (CSS value)
  contentWidth?: string;           // Width of the content panel (CSS value)
  chartWidth?: string;             // Width of the chart panel (CSS value)
  layoutClass?: string;            // Additional classes for the main layout container
  
  // Chart configuration
  chartTitle?: string;             // Title for the chart section
  chartDescription?: string;       // Description for the chart
  chartNote?: string;              // Additional note displayed below the chart
  hideChartNote?: boolean;         // Option to hide the chart note
  
  // Lesson display configuration
  showStepCount?: boolean;         // Whether to show step count in the header
  showStepTitles?: boolean;        // Whether to show step titles
  allowSkipToEnd?: boolean;        // Whether to show a "Skip to End" button
}

export function LessonViewer({ 
  lesson, 
  chartData, 
  lines, 
  onClose, 
  onComplete,
  
  // Layout defaults
  fullPropWidth = "80%",
  fullPropHeight = "80%",
  contentWidth = "40%",
  chartWidth = "60%", 
  layoutClass = "",
  
  // Chart defaults
  chartTitle = "Your Financial Visualization",
  chartDescription = "See how these principles apply to your finances",
  chartNote = "This chart shows your transaction history with optimized spending habits. As you apply the concepts from this lesson, you'll see improvements in your financial trajectory similar to the purple line.",
  hideChartNote = false,
  
  // Lesson display defaults
  showStepCount = true,
  showStepTitles = true,
  allowSkipToEnd = false
}: LessonViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    lesson.content.map((step) => step.completed || false)
  );
  const [isFullscreenContent, setIsFullscreenContent] = useState(false);
  const [isFullscreenChart, setIsFullscreenChart] = useState(false);

  // Prevent scrolling on body when the component mounts
  useEffect(() => {
    // Save the original overflow style
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const markStepComplete = (index: number) => {
    const newCompletedSteps = [...completedSteps];
    newCompletedSteps[index] = true;
    setCompletedSteps(newCompletedSteps);
  };

  const isLastStep = currentStep === lesson.content.length - 1;
  // const allStepsCompleted = completedSteps.every((step) => step);

  const handleNext = () => {
    if (currentStep < lesson.content.length - 1) {
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    } else if (isLastStep) {
      markStepComplete(currentStep);
      // All steps complete, complete the lesson
      onComplete(lesson.id);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Mark all steps as complete
    const allComplete = Array(lesson.content.length).fill(true);
    setCompletedSteps(allComplete);
    onComplete(lesson.id);
  };

  const handleSkipToEnd = () => {
    setCurrentStep(lesson.content.length - 1);
    // Don't mark intermediate steps as complete when skipping
  };

  // Stop propagation for the content area to prevent closing when clicking inside
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Calculate dynamic widths based on fullscreen states
  const getContentWidth = () => {
    if (isFullscreenContent) return "100%";
    if (isFullscreenChart) return "0%";
    return contentWidth;
  };

  const getChartWidth = () => {
    if (isFullscreenChart) return "100%";
    if (isFullscreenContent) return "0%";
    return chartWidth;
  };

  const getContentVisibility = () => {
    return isFullscreenChart ? "hidden" : "flex";
  };

  const getChartVisibility = () => {
    return isFullscreenContent ? "hidden" : "flex";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Blurred background - covers the entire viewport */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Lesson viewer content */}
      <div 
        className={`relative z-10 w-full h-full sm:w-auto sm:h-auto flex flex-col md:flex-row gap-6 p-4 ${layoutClass}`}
        style={{
          maxWidth: fullPropWidth, 
          maxHeight: fullPropHeight,
          margin: 'auto'
        }}
        onClick={handleContentClick}
      >
        {/* Left side - Lesson content */}
        <Card 
          className={`${getContentVisibility()} flex-col h-full sm:max-h-[80vh] overflow-hidden`} 
          style={{ width: getContentWidth() }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold">{lesson.title}</CardTitle>
              {showStepCount && (
                <CardDescription>
                  Step {currentStep + 1} of {lesson.content.length}
                </CardDescription>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsFullscreenContent(!isFullscreenContent)}
                title={isFullscreenContent ? "Exit fullscreen" : "Fullscreen content"}
              >
                {isFullscreenContent ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow overflow-y-auto pb-20">
            <div className="space-y-4">
              {showStepTitles && (
                <h3 className="text-lg font-semibold">{lesson.content[currentStep].title}</h3>
              )}
              <div className="prose prose-sm max-w-none">
                <p>{lesson.content[currentStep].content}</p>
              </div>
            </div>
          </CardContent>
          
          <div className="p-4 border-t flex justify-between items-center bg-card">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <div className="flex space-x-2">
              {allowSkipToEnd && !isLastStep && (
                <Button variant="outline" onClick={handleSkipToEnd} className="text-sm">
                  Skip to End
                </Button>
              )}
              
              {isLastStep ? (
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Complete Lesson
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
        
        {/* Right side - Chart visualization */}
        <Card 
          className={`${getChartVisibility()} flex-col h-full sm:max-h-[80vh] overflow-hidden`}
          style={{ width: getChartWidth() }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold">{chartTitle}</CardTitle>
              <CardDescription>{chartDescription}</CardDescription>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFullscreenChart(!isFullscreenChart)}
              title={isFullscreenChart ? "Exit fullscreen" : "Fullscreen chart"}
            >
              {isFullscreenChart ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          
          <CardContent className="flex-grow h-[calc(100%-5rem)]">
            <div className="h-full flex flex-col">
              <div className="flex-grow">
                <TransactionChart 
                  title="" 
                  description="" 
                  data={chartData} 
                  lines={lines} 
                />
              </div>

              {!hideChartNote && chartNote && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">How This Relates to Your Finances</h4>
                  <p className="text-sm text-muted-foreground">{chartNote}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}