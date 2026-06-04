import { ABSTRACT_QUESTIONS } from './q_abstract';
import { RECORDS_QUESTIONS } from './q_records';
import { INTERFACES_QUESTIONS } from './q_interfaces';
import { LAMBDAS_QUESTIONS } from './q_lambdas';
import { ENUM_QUESTIONS } from './q_enum';
import { GENERICS_QUESTIONS } from './q_generics';
import { COLLECTIONS_QUESTIONS } from './q_collections';
import { STREAMS_QUESTIONS } from './q_streams';
import { THREADS_QUESTIONS } from './q_threads';
import type { Question } from '../types';

export const ALL_QUESTIONS: Question[] = [
  ...ABSTRACT_QUESTIONS,
  ...RECORDS_QUESTIONS,
  ...INTERFACES_QUESTIONS,
  ...LAMBDAS_QUESTIONS,
  ...ENUM_QUESTIONS,
  ...GENERICS_QUESTIONS,
  ...COLLECTIONS_QUESTIONS,
  ...STREAMS_QUESTIONS,
  ...THREADS_QUESTIONS,
];

export function getQuestionsByCategory(categoryId: string): Question[] {
  return ALL_QUESTIONS.filter(q => q.categoryId === categoryId);
}

export function getRandomQuestions(count: number): Question[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function shuffleAnswers(question: Question): Question {
  const answers = [...question.answers].sort(() => Math.random() - 0.5);
  const reindexed = answers.map((a, i) => ({
    ...a,
    id: (['a', 'b', 'c', 'd'] as const)[i],
  }));
  const originalToNew: Record<string, 'a' | 'b' | 'c' | 'd'> = {};
  answers.forEach((a, i) => {
    originalToNew[a.id] = (['a', 'b', 'c', 'd'] as const)[i];
  });
  return {
    ...question,
    answers: reindexed,
    correctAnswer: originalToNew[question.correctAnswer],
  };
}
