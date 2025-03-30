// app/components/dashboard/investment/components/LessonsSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen } from "lucide-react";
import { LessonsSectionProps } from './types';
import { Lesson } from '@/components/dashboard/types';

/**
 * Component for displaying investment lessons
 */
export const LessonsSection = ({ 
  sectionData, 
  isLessonsLoading, 
  lessonsError, 
  completedLessons, 
  setActiveLesson, 
  retryFetchLessons 
}: LessonsSectionProps): React.ReactElement => {
  return (
    <div>
      <h3 className="text-xl font-medium mb-4 flex items-center">
        <BookOpen className="mr-2 h-5 w-5 text-primary" />
        Recommended Lessons
      </h3>
      
      {isLessonsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading personalized lessons...</p>
          </div>
        </div>
      ) : lessonsError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-500 mb-2">{lessonsError}</p>
          <Button onClick={retryFetchLessons} variant="outline" size="sm">
            Retry Loading Lessons
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionData?.lessons?.length ? sectionData.lessons.map((lesson: Lesson) => {
            const isCompleted = completedLessons.includes(lesson.id);
            return (
              <Card
                key={lesson.id}
                className={`overflow-hidden border ${isCompleted ? "border-green-500/50 bg-green-50/50" : ""}`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">{lesson.title}</CardTitle>
                    {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {lesson.duration}
                    </div>
                    <Button
                      size="sm"
                      className={isCompleted ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}
                      onClick={() => setActiveLesson(lesson)}
                    >
                      {isCompleted ? "Review Lesson" : "Start Lesson"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <p className="text-muted-foreground col-span-2">No lessons available at this time.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonsSection;