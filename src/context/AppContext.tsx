"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { runAnalytics, type AnalyticsResult } from "@/lib/analytics";
import { read, write, setStudent, pushExam, reset } from "@/lib/local-store";
import type { Student, Exam, SubjectScore, TopicError, Program, University } from "@/types/yks";
import { getSupabase } from "@/lib/supabase-client";

interface AppContextValue {
  student: Student | null;
  exams: Exam[];
  scores: SubjectScore[];
  topicErrors: TopicError[];
  targetUniversity: University | null;
  targetProgram: Program | null;
  analytics: AnalyticsResult;
  // mutations
  registerStudent: (s: Omit<Student, "id" | "created_at">) => Promise<Student>;
  addExam: (exam: Omit<Exam, "id">, scores: Omit<SubjectScore, "id">[], errors: Omit<TopicError, "id">[]) => Promise<void>;
  setTarget: (uni: University, program: Program | null, ranking: number | null) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudentState] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [scores, setScores] = useState<SubjectScore[]>([]);
  const [topicErrors, setTopicErrors] = useState<TopicError[]>([]);
  const [targetUniversity, setTargetUniversity] = useState<University | null>(null);
  const [targetProgram, setTargetProgram] = useState<Program | null>(null);

  // hydrate from localStorage on first mount
  useEffect(() => {
    const s = read();
    if (s.student)  setStudentState(s.student);
    setExams(s.exams);
    setScores(s.scores);
    setTopicErrors(s.topicErrors);
  }, []);

  // fetch target uni/program details from local data
  useEffect(() => {
    async function loadTarget() {
      if (!student) return;
      if (student.target_uni_kod) {
        const r = await fetch(`/api/universities?kod=${student.target_uni_kod}`);
        if (r.ok) {
          const j = await r.json();
          setTargetUniversity(j.university ?? null);
        }
      }
      if (student.target_program_id) {
        const r = await fetch(`/api/universities?programId=${student.target_program_id}`);
        if (r.ok) {
          const j = await r.json();
          setTargetProgram(j.program ?? null);
        }
      }
    }
    loadTarget();
  }, [student]);

  const analytics = useMemo(
    () => runAnalytics(exams, scores, topicErrors, targetProgram, student?.target_ranking ?? null),
    [exams, scores, topicErrors, targetProgram, student]
  );

  // ----- mutations ------------------------------------------------------------
  async function registerStudent(data: Omit<Student, "id" | "created_at">) {
    const supa = getSupabase();
    let row: Student;

    if (supa) {
      const { data: ins, error } = await supa
        .from("students")
        .insert({
          full_name: data.full_name,
          alan: data.alan,
          target_uni_kod: data.target_uni_kod,
          target_program_id: data.target_program_id,
          target_ranking: data.target_ranking,
        })
        .select()
        .single();
      if (error) throw error;
      row = ins as Student;
    } else {
      row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...data,
      };
    }

    setStudent(row);
    setStudentState(row);
    return row;
  }

  async function addExam(
    exam: Omit<Exam, "id">,
    sList: Omit<SubjectScore, "id">[],
    eList: Omit<TopicError, "id">[]
  ) {
    const supa = getSupabase();
    let savedExam: Exam;

    if (supa) {
      const { data: insExam, error } = await supa
        .from("exams")
        .insert({
          student_id: exam.student_id,
          exam_name: exam.exam_name,
          exam_type: exam.exam_type,
          total_net: exam.total_net,
        })
        .select()
        .single();
      if (error) throw error;
      savedExam = insExam as Exam;

      if (sList.length) {
        await supa.from("subject_scores").insert(sList.map(s => ({ ...s, exam_id: savedExam.id })));
      }
      if (eList.length) {
        await supa.from("topic_errors").insert(eList.map(e => ({ ...e, exam_id: savedExam.id, student_id: exam.student_id })));
      }
    } else {
      savedExam = { ...exam, id: crypto.randomUUID() } as Exam;
    }

    const newScores: SubjectScore[]    = sList.map(s => ({ ...s, exam_id: savedExam.id }));
    const newErrors: TopicError[]      = eList.map(e => ({ ...e, exam_id: savedExam.id, student_id: exam.student_id }));

    pushExam(savedExam, newScores, newErrors);
    setExams(p => [...p, savedExam]);
    setScores(p => [...p, ...newScores]);
    setTopicErrors(p => [...p, ...newErrors]);
  }

  async function setTarget(uni: University, program: Program | null, ranking: number | null) {
    if (!student) return;
    const updated: Student = {
      ...student,
      target_uni_kod: uni.kod,
      target_program_id: program?.id ?? null,
      target_ranking: ranking,
    };
    const supa = getSupabase();
    if (supa) {
      await supa.from("students").update({
        target_uni_kod: uni.kod,
        target_program_id: program?.id ?? null,
        target_ranking: ranking,
      }).eq("id", student.id);
    }
    setStudent(updated);
    setStudentState(updated);
    setTargetUniversity(uni);
    setTargetProgram(program);
  }

  function logout() {
    reset();
    setStudentState(null);
    setExams([]); setScores([]); setTopicErrors([]);
    setTargetUniversity(null); setTargetProgram(null);
  }

  return (
    <Ctx.Provider value={{
      student, exams, scores, topicErrors,
      targetUniversity, targetProgram, analytics,
      registerStudent, addExam, setTarget, logout,
    }}>{children}</Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
