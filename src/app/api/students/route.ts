import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// POST /api/students  →  upsert student (used by server when client doesn't have anon key)
export async function POST(req: Request) {
  const body = await req.json();
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await sb.from("students").insert({
    full_name: body.full_name,
    alan: body.alan,
    target_uni_kod: body.target_uni_kod,
    target_program_id: body.target_program_id,
    target_ranking: body.target_ranking,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data });
}
