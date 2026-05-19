import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// GET /api/exams?studentId=...  →  full payload for SSR/server-rendered dashboards
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ exams: [], scores: [], topicErrors: [] });

  const [exams, scores, errors] = await Promise.all([
    sb.from("exams").select("*").eq("student_id", studentId).order("taken_at", { ascending: true }),
    sb.from("subject_scores").select("*, exams!inner(student_id)").eq("exams.student_id", studentId),
    sb.from("topic_errors").select("*").eq("student_id", studentId),
  ]);

  return NextResponse.json({
    exams: exams.data ?? [],
    scores: scores.data ?? [],
    topicErrors: errors.data ?? [],
  });
}
