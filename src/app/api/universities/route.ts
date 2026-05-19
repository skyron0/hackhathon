import { NextResponse } from "next/server";
import data from "@/data/universities.json";

type Uni = { kod: number; isim: string };
type Prog = {
  id: number; kod: number; isim: string; fakulte: string;
  okulKod: number; puanTuru: string; tabanSiralama: number; tabanPuan: number;
};
const universities = data.universities as Uni[];
const programs     = data.programs as Prog[];

// Map student.alan → acceptable program puan_turu values
const ALAN_PT: Record<string, string[]> = {
  SAY: ["SAY", "TYT"],
  EA:  ["EA", "TYT"],
  SÖZ: ["SÖZ", "TYT"],
  DİL: ["DİL", "TYT"],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("list") === "1") {
    return NextResponse.json({ universities });
  }

  const kod = searchParams.get("kod");
  if (kod) {
    const u = universities.find(x => x.kod === +kod);
    return NextResponse.json({ university: u ?? null });
  }

  const programId = searchParams.get("programId");
  if (programId) {
    const p = programs.find(x => x.id === +programId);
    return NextResponse.json({ program: p ?? null });
  }

  const okulKod = searchParams.get("okulKod");
  if (okulKod) {
    const alan = searchParams.get("alan") || "SAY";
    const allowed = ALAN_PT[alan] ?? ["SAY"];
    const list = programs
      .filter(p => p.okulKod === +okulKod && allowed.includes(p.puanTuru))
      .sort((a, b) => a.tabanSiralama - b.tabanSiralama);
    return NextResponse.json({ programs: list });
  }

  return NextResponse.json({ universities, count: universities.length });
}
