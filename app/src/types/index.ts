export interface Answer {
  id: 'a' | 'b' | 'c' | 'd';
  text: string;
}

export interface Question {
  id: number;
  categoryId: string;
  question: string;
  answers: Answer[];
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  darkColor: string;
  icon: string;
  questionCount: number;
}

export type StudyMode = 'flashcard' | 'quiz' | 'test';

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  selectedAnswer: 'a' | 'b' | 'c' | 'd' | null;
  answers: Record<number, 'a' | 'b' | 'c' | 'd'>;
  isFinished: boolean;
}

export interface Progress {
  studied: number[];
  quizResults: QuizResult[];
  testResults: TestResult[];
}

export interface QuizResult {
  date: string;
  categoryId: string;
  score: number;
  total: number;
}

export interface TestResult {
  date: string;
  score: number;
  total: number;
  questionIds: number[];
}

export interface CategoryProgress {
  categoryId: string;
  studiedCount: number;
  totalCount: number;
  quizBestScore: number | null;
  quizAttempts: number;
}
