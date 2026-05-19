"use client";

import { useApp } from "@/context/AppContext";
import { simulateAdmissionScenario } from "@/lib/analytics";
import { Target, ShieldAlert, Award, BarChart3, Gauge, CalendarClock } from "lucide-react";
import { useMemo } from "react";

export default function PredictionPage() {
  const { analytics, targetUniversity, targetProgram, student } = useApp();
  const targetRanking = student?.target_ranking ?? targetProgram?.tabanSiralama ?? null;

  const scenarios = useMemo(() => {
    return [0, 3, 5, 8].map((delta) => {
      const outcome = delta === 0
        ? {
            admissionProbability: analytics.admissionProbability,
            estimatedRanking: analytics.estimatedRanking,
            rankingRange: analytics.rankingRange,
            yksScore: analytics.yksScore,
          }
        : simulateAdmissionScenario(analytics, targetProgram, targetRanking, delta);

      return {
        delta,
        label: delta === 0 ? "Mevcut" : `+${delta} net`,
        probability: outcome.admissionProbability,
        ranking: outcome.estimatedRanking,
        range: outcome.rankingRange,
        score: outcome.yksScore,
      };
    });
  }, [analytics, targetProgram, targetRanking]);

  const gapLabel = analytics.targetGapRanking === null
    ? "—"
    : `${analytics.targetGapRanking > 0 ? "+" : ""}${analytics.targetGapRanking.toLocaleString("tr")}`;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        <Target className="text-purpleCustom h-7 w-7" />
        <div>
          <h1 className="text-2xl font-bold">Üniversite Yerleşme Simülasyonu</h1>
          <p className="text-zinc-400 text-sm mt-1">TYT/AYT ağırlığı, hedef program verisi, güven aralığı ve sınava kalan süre birlikte değerlendirilir.</p>
        </div>
      </div>

      <div className="bg-card border border-zinc-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="bg-purpleCustom/10 p-3 rounded-2xl text-purpleCustom"><Target className="h-8 w-8" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-zinc-100 truncate">{targetUniversity?.isim ?? "Hedef üniversite seçilmedi"}</h2>
            <p className="text-zinc-400 text-sm truncate">{targetProgram?.isim ?? "Hedef program seçilmedi"}</p>
            {targetProgram && (
              <p className="text-xs text-zinc-500 mt-1">
                Taban sıralama: ~{targetProgram.tabanSiralama.toLocaleString("tr")} · Puan türü: {targetProgram.puanTuru} · Taban puan: {targetProgram.tabanPuan}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <Stat icon={Award} color="emerald" label="Kazanma Olasılığı" value={`%${analytics.admissionProbability}`} />
          <Stat icon={BarChart3} color="purple" label="Tahmini Sıralama" value={analytics.estimatedRanking?.toLocaleString("tr") ?? "—"} />
          <Stat icon={ShieldAlert} color={analytics.riskLevel === "DÜŞÜK" ? "emerald" : analytics.riskLevel === "ORTA" ? "amber" : "rose"} label="Risk Seviyesi" value={analytics.riskLevel} />
          <Stat icon={Gauge} color="blue" label="Tahmin Güveni" value={`%${analytics.predictionConfidence}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Gerçekçi Sıralama Aralığı" value={analytics.rankingRange?.label ?? "—"} sub="tek sayı yerine güven bandı" />
        <Metric label="Ağırlıklı TYT Neti" value={analytics.tytWeightedNet?.toFixed(2) ?? "—"} sub="/ 120" />
        <Metric label="Ağırlıklı AYT Neti" value={analytics.aytWeightedNet?.toFixed(2) ?? "—"} sub="/ 80" />
        <Metric label="Hedefe Sıralama Farkı" value={gapLabel} sub={analytics.targetGapRanking && analytics.targetGapRanking <= 0 ? "hedefin önünde" : "hedefe göre"} />
      </div>

      <div className="bg-card border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <CalendarClock className="text-purpleCustom" /> Sınava Kalan Süreye Göre Strateji
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-400">Aktif mod</div>
            <div className="text-xl font-bold text-purpleCustom-light mt-1">{analytics.strategyMode.label}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-400">Kalan süre</div>
            <div className="text-xl font-bold text-zinc-100 mt-1">{analytics.strategyMode.daysLeft} gün</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-400">Haftalık deneme hedefi</div>
            <div className="text-sm font-semibold text-zinc-100 mt-1">{analytics.strategyMode.weeklyExamTarget}</div>
          </div>
        </div>
        <p className="text-sm text-zinc-400 mt-4">{analytics.strategyMode.mainFocus}</p>
      </div>

      <div className="bg-card border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShieldAlert className="text-purpleCustom" /> Net Artışı Senaryoları
        </h2>
        <p className="text-xs text-zinc-500 mb-4">Senaryolar, hedef puan türüne göre TYT/AYT ağırlığına dağıtılır; sıralama ve güven bandı yeniden hesaplanır.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {scenarios.map((scenario, index) => (
            <div key={scenario.label} className={`border rounded-xl p-4 ${index === 0 ? "bg-zinc-900/50 border-zinc-800" : "bg-purpleCustom/5 border-purpleCustom/20"}`}>
              <div className="text-xs text-zinc-400">{scenario.label}</div>
              <div className="text-2xl font-bold mt-1 text-purpleCustom-light">%{scenario.probability.toFixed(1)}</div>
              <div className="text-[11px] text-zinc-500 mt-2">
                Sıra: {scenario.ranking?.toLocaleString("tr") ?? "—"} · Puan: {scenario.score.toFixed(1)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">Aralık: {scenario.range?.label ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border border-zinc-800 rounded-2xl p-5">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-2xl font-extrabold text-purpleCustom-light mt-1">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }: any) {
  const map: any = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    purple: "text-purpleCustom-light bg-purpleCustom/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    blue: "text-sky-400 bg-sky-500/10",
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${map[color]}`}><Icon className="h-5 w-5" /></div>
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold mt-3 ${map[color].split(" ")[0]}`}>{value}</div>
    </div>
  );
}
