"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Sparkles, GraduationCap, Target, User, ArrowRight } from "lucide-react";
import type { Alan, University, Program } from "@/types/yks";

const ALANLAR: { code: Alan; label: string; desc: string }[] = [
  { code: "SAY", label: "Sayısal",       desc: "Matematik · Fizik · Kimya · Biyoloji" },
  { code: "EA",  label: "Eşit Ağırlık",  desc: "Matematik · Edebiyat · Tarih · Coğrafya" },
  { code: "SÖZ", label: "Sözel",         desc: "Edebiyat · Tarih · Coğrafya · Felsefe" },
  { code: "DİL", label: "Dil",           desc: "Yabancı Dil ağırlıklı" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { registerStudent, setTarget } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // step 1 fields
  const [fullName, setFullName]     = useState("");
  const [alan, setAlan]             = useState<Alan>("SAY");

  // step 2/3 fields
  const [unis, setUnis]             = useState<University[]>([]);
  const [uniQuery, setUniQuery]     = useState("");
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [programs, setPrograms]     = useState<Program[]>([]);
  const [progQuery, setProgQuery]   = useState("");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [targetRanking, setTargetRanking]     = useState<string>("");
  const [loading, setLoading]       = useState(false);

  // ----- load uni list on step-2 enter ---------------------------------------
  useEffect(() => {
    if (step !== 2 || unis.length) return;
    fetch("/api/universities?list=1")
      .then(r => r.json())
      .then(j => setUnis(j.universities ?? []));
  }, [step, unis.length]);

  // ----- load programs when uni picked ---------------------------------------
  useEffect(() => {
    if (!selectedUni) return;
    fetch(`/api/universities?okulKod=${selectedUni.kod}&alan=${alan}`)
      .then(r => r.json())
      .then(j => setPrograms(j.programs ?? []));
  }, [selectedUni, alan]);

  const filteredUnis = useMemo(
    () => unis.filter(u => u.isim.toLocaleLowerCase("tr").includes(uniQuery.toLocaleLowerCase("tr"))).slice(0, 12),
    [unis, uniQuery]
  );
  const filteredProgs = useMemo(
    () => programs.filter(p => p.isim.toLocaleLowerCase("tr").includes(progQuery.toLocaleLowerCase("tr"))).slice(0, 20),
    [programs, progQuery]
  );

  async function handleFinish() {
    if (!fullName.trim()) return;
    setLoading(true);
    try {
      const student = await registerStudent({
        full_name: fullName.trim(),
        alan,
        target_uni_kod: selectedUni?.kod ?? null,
        target_program_id: selectedProgram?.id ?? null,
        target_ranking: targetRanking ? +targetRanking : (selectedProgram?.tabanSiralama ?? null),
      });
      if (selectedUni) {
        await setTarget(selectedUni, selectedProgram, targetRanking ? +targetRanking : (selectedProgram?.tabanSiralama ?? null));
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        {/* header */}
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-purpleCustom-light h-7 w-7 animate-pulse" />
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white via-purpleCustom-light to-purpleCustom bg-clip-text text-transparent">
            YKS AI Coach
          </h2>
        </div>
        <p className="text-zinc-400 text-sm mb-6">Geleceğini verilerle inşa et — 3 adımda başla.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${step >= n ? "bg-purpleCustom" : "bg-zinc-800"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <User className="text-purpleCustom h-5 w-5" />
              <h3 className="font-bold text-zinc-100">Kim olduğunu söyle</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">İsim Soyisim *</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Örn: Ayşe Kara"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purpleCustom"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Hangi alandasın?</label>
              <div className="grid grid-cols-2 gap-2">
                {ALANLAR.map(a => (
                  <button
                    key={a.code}
                    onClick={() => setAlan(a.code)}
                    className={`text-left p-4 rounded-xl border transition ${
                      alan === a.code
                        ? "bg-purpleCustom/15 border-purpleCustom/50"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-bold text-zinc-100">{a.label}</div>
                    <div className="text-xs text-zinc-500 mt-1">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={!fullName.trim()}
              onClick={() => setStep(2)}
              className="w-full bg-purpleCustom hover:bg-purpleCustom-dark disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              Devam <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="text-purpleCustom h-5 w-5" />
              <h3 className="font-bold text-zinc-100">Hedef üniversite</h3>
            </div>
            <input
              value={uniQuery}
              onChange={e => setUniQuery(e.target.value)}
              placeholder="Ara: Boğaziçi, ODTÜ, İTÜ…"
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purpleCustom"
            />
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {filteredUnis.map(u => (
                <button
                  key={u.kod}
                  onClick={() => { setSelectedUni(u); setStep(3); setProgQuery(""); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                    selectedUni?.kod === u.kod
                      ? "bg-purpleCustom/15 border-purpleCustom/50"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-sm text-zinc-100">{u.isim}</span>
                </button>
              ))}
              {filteredUnis.length === 0 && unis.length > 0 && (
                <p className="text-xs text-zinc-500 px-3 py-4 text-center">Eşleşen üniversite yok.</p>
              )}
              {unis.length === 0 && <p className="text-xs text-zinc-500 px-3 py-4 text-center">Yükleniyor…</p>}
            </div>
            <div className="flex justify-between gap-2">
              <button onClick={() => setStep(1)} className="text-zinc-400 hover:text-zinc-200 text-sm">← Geri</button>
              <button
                onClick={() => { setSelectedUni(null); handleFinish(); }}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Üniversite seçmeden devam et
              </button>
            </div>
          </div>
        )}

        {step === 3 && selectedUni && (
          <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-purpleCustom h-5 w-5" />
              <h3 className="font-bold text-zinc-100">Hedef bölüm & sıralama</h3>
            </div>
            <div className="text-xs text-zinc-400 mb-1">
              <span className="text-purpleCustom-light">{selectedUni.isim}</span>
            </div>
            <input
              value={progQuery}
              onChange={e => setProgQuery(e.target.value)}
              placeholder="Bölüm ara: Bilgisayar, Tıp, Hukuk…"
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purpleCustom"
            />
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredProgs.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProgram(p); setTargetRanking(String(p.tabanSiralama)); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                    selectedProgram?.id === p.id
                      ? "bg-purpleCustom/15 border-purpleCustom/50"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-100">{p.isim}</span>
                    <span className="text-xs text-zinc-500">{p.puanTuru} · ~{p.tabanSiralama.toLocaleString("tr")} sıralama</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{p.fakulte}</div>
                </button>
              ))}
              {filteredProgs.length === 0 && (
                <p className="text-xs text-zinc-500 px-3 py-4 text-center">Eşleşen bölüm yok.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Hedef sıralaman</label>
              <input
                type="number"
                value={targetRanking}
                onChange={e => setTargetRanking(e.target.value)}
                placeholder="Örn: 5000"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purpleCustom"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                Bölüm seçince taban sıralama otomatik dolar — istersen değiştirebilirsin.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <button onClick={() => setStep(2)} className="text-zinc-400 hover:text-zinc-200 text-sm">← Geri</button>
              <button
                disabled={loading}
                onClick={handleFinish}
                className="bg-purpleCustom hover:bg-purpleCustom-dark disabled:opacity-50 font-bold px-6 py-3 rounded-xl transition text-sm flex items-center gap-2"
              >
                {loading ? "Kaydediliyor…" : "Panele Git"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
