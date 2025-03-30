// Define content structure for the section content
export type ResourceType = 'Spreadsheet' | 'Tool' | 'PDF' | 'Video' | 'Article' | 'Data';

export type Section = 'Budgeting' | 'Stock Investments' | 'Bonds' | 'Stock Trading' | null;


export interface LessonContent {
    title: string;
    content: string;
    completed: boolean;
  }
  
  export interface Lesson {
    id: string;
    title: string;
    description: string;
    duration: string;
    completed?: boolean;
    content: LessonContent[];
  }
  
  export interface Resource {
    id: string;
    title: string;
    type: ResourceType;
    url: string;
    description?: string;
  }
  
  export interface FullLessonData {
    title: string;
    description: string;
    lessons: Lesson[];
    resources: Resource[];
  }
  
  interface BudgetData {
    [category: string]: number;
  }
  