import { useState, useCallback } from 'react';
import type { QuizResult, TestResult } from '../types';

const STORAGE_KEY = 'java-quiz-progress';

interface ProgressData {
  studied: number[];
  quizResults: QuizResult[];
  testResults: TestResult[];
}

const defaultProgress: ProgressData = {
  studied: [],
  quizResults: [],
  testResults: [],
};

function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    return JSON.parse(raw);
  } catch {
    return defaultProgress;
  }
}

function saveProgress(data: ProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress);

  const markStudied = useCallback((questionId: number) => {
    setProgress(prev => {
      if (prev.studied.includes(questionId)) return prev;
      const next = { ...prev, studied: [...prev.studied, questionId] };
      saveProgress(next);
      return next;
    });
  }, []);

  const addQuizResult = useCallback((result: QuizResult) => {
    setProgress(prev => {
      const next = { ...prev, quizResults: [result, ...prev.quizResults].slice(0, 100) };
      saveProgress(next);
      return next;
    });
  }, []);

  const addTestResult = useCallback((result: TestResult) => {
    setProgress(prev => {
      const next = { ...prev, testResults: [result, ...prev.testResults].slice(0, 50) };
      saveProgress(next);
      return next;
    });
  }, []);

  const getCategoryProgress = useCallback((categoryId: string, totalCount: number) => {
    const studiedCount = progress.studied.length;
    const categoryResults = progress.quizResults.filter(r => r.categoryId === categoryId);
    const bestScore = categoryResults.length > 0
      ? Math.max(...categoryResults.map(r => r.score / r.total))
      : null;
    return {
      studiedCount,
      totalCount,
      bestScore,
      attempts: categoryResults.length,
    };
  }, [progress]);

  const isStudied = useCallback((questionId: number) => {
    return progress.studied.includes(questionId);
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
    saveProgress(defaultProgress);
  }, []);

  return {
    progress,
    markStudied,
    addQuizResult,
    addTestResult,
    getCategoryProgress,
    isStudied,
    resetProgress,
  };
}
