"use client";

/**
 * Offline-mode persistence. When Supabase isn't configured we keep every
 * student, exam, and topic error in localStorage so the demo still works
 * end-to-end. All shapes mirror the Supabase tables.
 */
import type { Student, Exam, SubjectScore, TopicError } from "@/types/yks";

const KEY = "yks-ai-coach:store/v1";

interface Store {
  student: Student | null;
  exams: Exam[];
  scores: SubjectScore[];
  topicErrors: TopicError[];
}

const EMPTY: Store = { student: null, exams: [], scores: [], topicErrors: [] };

export function read(): Store {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function write(s: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function reset() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function setStudent(student: Student) {
  const s = read();
  s.student = student;
  write(s);
}

export function pushExam(exam: Exam, scores: SubjectScore[], errors: TopicError[]) {
  const s = read();
  s.exams.push(exam);
  s.scores.push(...scores);
  s.topicErrors.push(...errors);
  write(s);
}
