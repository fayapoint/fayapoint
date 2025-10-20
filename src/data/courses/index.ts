import { chatGPTCourse } from './chatgpt-course';
import { n8nCourse } from './n8n-course';
import { makeCourse } from './make-course';
import { geminiCourse } from './gemini-course';
import { leonardoCourse } from './leonardo-course';
import { bananaDevCourse } from './banana-dev-course';
import { midjourneyCourse } from './midjourney-course';
import { claudeCourse } from './claude-course';
import { perplexityCourse } from './perplexity-course';

export interface CourseModule {
  id: number;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  topics: string[];
}

export interface CourseTestimonial {
  name: string;
  role: string;
  company?: string;
  rating: number;
  comment: string;
  impact: string;
}

export interface CourseBonus {
  title: string;
  value: number;
  description: string;
}

export interface CourseFAQ {
  question: string;
  answer: string;
}

export interface CourseData {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  tool: string;
  category: string;
  level: string;
  duration: string;
  totalLessons: number;
  price: number;
  originalPrice: number;
  rating: number;
  students: number;
  lastUpdated: string;
  shortDescription: string;
  fullDescription: string;
  impactForIndividuals: string[];
  impactForEntrepreneurs: string[];
  impactForCompanies: string[];
  whatYouLearn: string[];
  modules: CourseModule[];
  testimonials: CourseTestimonial[];
  bonuses: CourseBonus[];
  guarantees?: string[];
  faqs: CourseFAQ[];
  realWorldProjects?: string[];
  targetAudience?: string[];
  requirements?: string[];
  features?: string[];
}

// Export all courses
export const allCourses: CourseData[] = [
  chatGPTCourse,
  n8nCourse,
  makeCourse,
  geminiCourse,
  leonardoCourse,
  bananaDevCourse,
  midjourneyCourse,
  claudeCourse,
  perplexityCourse
];

// Helper function to get course by slug
export const getCourseBySlug = (slug: string): CourseData | undefined => {
  return allCourses.find(course => course.slug === slug);
};

// Helper function to get courses by category
export const getCoursesByCategory = (category: string): CourseData[] => {
  return allCourses.filter(course => course.category === category);
};

// Helper function to get courses by tool
export const getCoursesByTool = (tool: string): CourseData[] => {
  return allCourses.filter(course => 
    course.tool.toLowerCase() === tool.toLowerCase()
  );
};

// Get all unique categories
export const getAllCategories = (): string[] => {
  return [...new Set(allCourses.map(course => course.category))];
};

// Get all unique tools
export const getAllTools = (): string[] => {
  return [...new Set(allCourses.map(course => course.tool))];
};

// Sort courses by various criteria
export const sortCourses = (courses: CourseData[], sortBy: 'price' | 'rating' | 'students' | 'newest'): CourseData[] => {
  return [...courses].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      case 'students':
        return b.students - a.students;
      case 'newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });
};

// Search courses
export const searchCourses = (query: string): CourseData[] => {
  const lowerQuery = query.toLowerCase();
  return allCourses.filter(course => 
    course.title.toLowerCase().includes(lowerQuery) ||
    course.tool.toLowerCase().includes(lowerQuery) ||
    course.shortDescription.toLowerCase().includes(lowerQuery) ||
    course.category.toLowerCase().includes(lowerQuery)
  );
};

// Get featured courses
export const getFeaturedCourses = (): CourseData[] => {
  // Return top rated courses with most students
  return sortCourses(allCourses, 'students').slice(0, 3);
};

// Calculate total savings
export const calculateSavings = (course: CourseData): number => {
  return course.originalPrice - course.price;
};

// Calculate discount percentage
export const calculateDiscountPercentage = (course: CourseData): number => {
  return Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
};
