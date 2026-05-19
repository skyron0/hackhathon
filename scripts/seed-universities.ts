/**
 * Seed Supabase with universities and programs from src/data/universities.json
 *
 * Usage:
 *   1. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   2. Run the SQL migration in supabase/migrations/0001_init.sql in your Supabase SQL editor
 *   3. Run:  npm run seed:universities
 */
import { createClient } from "@supabase/supabase-js";
import data from "../src/data/universities.json";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌ Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  const sb = createClient(url, key);

  const universities = (data as any).universities as { kod: number; isim: string }[];
  const programs     = (data as any).programs as any[];

  console.log(`📥 Seeding ${universities.length} universities…`);
  for (let i = 0; i < universities.length; i += 200) {
    const chunk = universities.slice(i, i + 200);
    const { error } = await sb.from("universities").upsert(chunk, { onConflict: "kod" });
    if (error) { console.error("uni upsert error", error); process.exit(1); }
  }
  console.log(`✅ Universities seeded.`);

  console.log(`📥 Seeding ${programs.length} programs (batched)…`);
  const mapped = programs.map(p => ({
    kod: p.kod,
    isim: p.isim,
    fakulte: p.fakulte,
    okul_kod: p.okulKod,
    puan_turu: p.puanTuru,
    taban_siralama: p.tabanSiralama,
    taban_puan: p.tabanPuan,
    yil: 2024,
  }));
  for (let i = 0; i < mapped.length; i += 500) {
    const chunk = mapped.slice(i, i + 500);
    const { error } = await sb.from("programs").upsert(chunk, { onConflict: "kod" });
    if (error) { console.error("prog upsert error", error); process.exit(1); }
    process.stdout.write(`  ${Math.min(i + 500, mapped.length)}/${mapped.length}\r`);
  }
  console.log(`\n✅ Programs seeded.`);
}

main().catch(err => { console.error(err); process.exit(1); });
