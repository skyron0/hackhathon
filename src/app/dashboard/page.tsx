"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Award, BookOpen, GraduationCap, TrendingUp, TrendingDown, Sparkles,
  BrainCircuit, AlertCircle, PlusCircle, ClipboardList, CalendarClock,
} from "lucide-react";

export default function DashboardPage() {
  const { student, exams, analytics, targetUniversity, targetProgram } = useApp();
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");

  const chartData = useMemo(() => {
    const sorted = exams.slice().sort((a, b) =>
      new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
    );
    let tytIdx = 0;
    let aytIdx = 0;
    return sorted.map((exam) => {
      if (exam.exam_type === "TYT") tytIdx++;
      else aytIdx++;
      return {
        name: `${exam.exam_type} #${exam.exam_type === "TYT" ? tytIdx : aytIdx}`,
        TYT: exam.exam_type === "TYT" ? exam.total_net : null,
        AYT: exam.exam_type === "AYT" ? exam.total_net : null,
        label: exam.exam_name,
      };
    });
  }, [exams]);

  const subjectStats = analytics.subjectStats;
  const riskColor =
    analytics.riskLevel === "DÜŞÜK" ? "text-emerald-400"
    : analytics.riskLevel === "ORTA" ? "text-amber-400"
    : "text-rose-400";
  const TrendIcon = analytics.trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = analytics.trend >= 0 ? "text-emerald-400" : "text-rose-400";

  async function generateAi() {
    if (!student) return;
    setAiLoading(true);
    setAiError("");
    setAiAdvice("");
    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student,
          targetUniName: targetUniversity?.isim,
          targetProgramName: targetProgram?.isim,
          analytics,
          exams,
          topicErrors: analytics.topWeakTopics,
        }),
      });
      const j = await r.json();
      if (j.success) setAiAdvice(j.aiAdvice);
      else setAiError(j.error ?? "Bilinmeyen hata");
    } catch (e: any) {
      setAiError(e?.message ?? "API bağlantı hatası");
    } finally {
      setAiLoading(false);
    }
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400 mb-4">Önce profilini oluşturman gerekiyor.</p>
        <Link href="/onboarding" className="inline-block bg-purpleCustom px-5 py-3 rounded-xl font-semibold text-sm hover:bg-purpleCustom-dark transition">
          Profili Oluştur
        </Link>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto">
        <div className="bg-card border border-zinc-800 rounded-3xl p-10">
          <Sparkles className="h-10 w-10 text-purpleCustom-light mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Hoş geldin, {student.full_name}!</h2>
          <p className="text-zinc-400 text-sm mb-6">
            İlk deneme sonucunu girince tahmin motoru, strateji modu, görev planı ve deneme raporu çalışmaya başlayacak.
          </p>
          <Link href="/add-exam" className="inline-flex items-center gap-2 bg-purpleCustom hover:bg-purpleCustom-dark px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-purpleCustom/30">
            <PlusCircle className="h-4 w-4" /> İlk Deneme Sonucunu Ekle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purpleCustom-light to-purpleCustom bg-clip-text text-transparent flex items-center gap-3">
            YKS AI Performance Predictor <Sparkles className="text-purpleCustom-light animate-pulse" />
          </h1>
          <p className="text-zinc-400 mt-1">{student.full_name} için gerçek zamanlı sınav analiz paneli</p>
        </div>
        <div className="mt-4 md:mt-0 bg-purpleCustom/10 border border-purpleCustom/30 rounded-xl px-4 py-2 flex items-center gap-2">
          <BrainCircuit className="text-purpleCustom-light h-5 w-5" />
          <span className="text-sm font-semibold text-purpleCustom-light">{analytics.strategyMode.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          label="Son Deneme Neti"
          value={exams[exams.length - 1]?.total_net}
          suffix="net"
          icon={<TrendIcon className={`h-6 w-6 ${trendColor}`} />}
          accent={trendColor}
          sub={`Trend: ${analytics.trend >= 0 ? "+" : ""}${analytics.trend}`}
        />
        <SummaryCard
          label="Hedef Program"
          value={targetUniversity?.isim ?? "—"}
          icon={<GraduationCap className="h-6 w-6 text-zinc-300" />}
          sub={targetProgram?.isim ?? "Program seçilmedi"}
          valueClass="text-base"
        />
        <SummaryCard
          label={`${targetUniversity ? "Kazanma" : "Hedef"} İhtimali`}
          value={`%${analytics.admissionProbability}`}
          icon={<Award className="h-6 w-6 text-emerald-400" />}
          accent="text-emerald-400"
          sub={`Sıralama aralığı: ${analytics.rankingRange?.label ?? "—"}`}
        />
        <SummaryCard
          label="Tahmin Güveni"
          value={`%${analytics.predictionConfidence}`}
          icon={<BrainCircuit className={`h-6 w-6 ${riskColor}`} />}
          accent={riskColor}
          sub={`Risk: ${analytics.riskLevel}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-zinc-800 rounded-3xl p-6 card-hover">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-purpleCustom" /> Net Gelişim Trendi
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ backgroundColor: "#141417", borderColor: "#27272a", color: "#fff" }} />
                <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="TYT" name="TYT" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
                <Line type="monotone" dataKey="AYT" name="AYT" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-zinc-800 rounded-3xl p-6 card-hover">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CalendarClock className="text-purpleCustom" /> Strateji Modu
          </h2>
          <div className="text-3xl font-extrabold text-purpleCustom-light">{analytics.strategyMode.daysLeft} gün</div>
          <p className="text-sm text-zinc-400 mt-2">{analytics.strategyMode.mainFocus}</p>
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500">Haftalık deneme hedefi</div>
            <div className="text-sm font-semibold text-zinc-100 mt-1">{analytics.strategyMode.weeklyExamTarget}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-zinc-800 rounded-3xl p-6 card-hover">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ClipboardList className="text-purpleCustom" /> Deneme Sonrası Otomatik Rapor
          </h2>
          {analytics.lastExamReport ? (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="text-xs text-zinc-500">{analytics.lastExamReport.examType} · {analytics.lastExamReport.examName}</div>
                <div className="text-sm text-zinc-200 mt-1">{analytics.lastExamReport.summary}</div>
              </div>
              <ReportList title="Güçlü Sinyaller" items={analytics.lastExamReport.positives} color="emerald" />
              <ReportList title="Riskler" items={analytics.lastExamReport.risks} color="rose" />
              <ReportList title="Aksiyonlar" items={analytics.lastExamReport.actions} color="purple" />
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-8">Deneme ekleyince otomatik rapor oluşur.</p>
          )}
        </div>

        <div className="bg-card border border-zinc-800 rounded-3xl p-6 card-hover">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-400">
            <AlertCircle /> Konu Bazlı Öncelikler
          </h2>
          {analytics.topWeakTopics.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">Henüz konu hatası eklemedin.</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {analytics.topWeakTopics.map((topic, index) => (
                <div key={index} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-zinc-200">{topic.topic} <span className="text-xs text-zinc-500 font-normal">({topic.subject})</span></p>
                    <p className="text-xs text-rose-400/80 font-medium">
                      {topic.totalWrong} hata · ağırlıklı skor: {topic.weightedScore}
                    </p>
                  </div>
                  <SeverityBadge level={topic.severity} />
                </div>
              ))}
            </div>
          )}
          <Link href="/study-plan" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-purpleCustom-light hover:text-purpleCustom">
            Haftalık görev planına git →
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-br from-card to-zinc-900 border border-purpleCustom/20 rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-purpleCustom-light">
              <Sparkles /> AI Eğitim Koçu Reçetesi
            </h2>
            <p className="text-sm text-zinc-400">
              Gemini, deneme raporu ve konu önceliklerini kullanarak açıklamalı haftalık strateji üretir.
            </p>
          </div>
          <button
            onClick={generateAi}
            disabled={aiLoading}
            className="bg-purpleCustom hover:bg-purpleCustom-dark text-white font-bold px-5 py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purpleCustom/30"
          >
            {aiLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                Analiz ediliyor...
              </>
            ) : (
              <>
                <BrainCircuit className="h-5 w-5" /> AI Koçluk Stratejisi Üret
              </>
            )}
          </button>
        </div>
        {aiAdvice && (
          <div className="bg-purpleCustom/5 border border-purpleCustom/20 rounded-2xl p-5 text-sm text-zinc-300 leading-relaxed space-y-3 max-h-[320px] overflow-y-auto mt-5">
            {aiAdvice.split("\n").map((line, i) => {
              if (line.startsWith("### ")) return <h4 key={i} className="text-sm font-bold text-purpleCustom-light pt-2 border-b border-purpleCustom/20 pb-1">{line.replace(/^### /, "")}</h4>;
              if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} className="pl-3 text-zinc-300">• {line.replace(/^[-*] /, "")}</div>;
              if (line.trim().length > 0) return <p key={i}>{line}</p>;
              return null;
            })}
          </div>
        )}
        {aiError && <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2 mt-5">{aiError}</div>}
      </div>
    </div>
  );
}

function SummaryCard(props: {
  label: string; value: any; suffix?: string; icon: React.ReactNode;
  accent?: string; sub?: string; valueClass?: string;
}) {
  return (
    <div className="bg-card border border-zinc-800 rounded-2xl p-5 flex items-center justify-between card-hover">
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 font-medium">{props.label}</p>
        <h3 className={`font-bold mt-1 ${props.valueClass ?? "text-3xl"} ${props.accent ?? "text-purpleCustom-light"} truncate`}>
          {props.value}{props.suffix && <span className="text-lg font-normal text-zinc-500 ml-1">{props.suffix}</span>}
        </h3>
        {props.sub && <p className="text-[11px] text-zinc-500 mt-1 truncate">{props.sub}</p>}
      </div>
      <div className="bg-zinc-900 p-3 rounded-xl shrink-0">{props.icon}</div>
    </div>
  );
}

function ReportList({ title, items, color }: { title: string; items: string[]; color: "emerald" | "rose" | "purple" }) {
  const colorClass = color === "emerald" ? "text-emerald-400" : color === "rose" ? "text-rose-400" : "text-purpleCustom-light";
  return (
    <div>
      <div className={`text-xs font-bold mb-2 ${colorClass}`}>{title}</div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="text-sm text-zinc-300 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2">{item}</div>
        ))}
      </div>
    </div>
  );
}

function SeverityBadge({ level }: { level: "KRİTİK" | "YÜKSEK" | "ORTA" | "DÜŞÜK" }) {
  const map = {
    "KRİTİK": "bg-rose-500/10 border-rose-500/20 text-rose-400",
    "YÜKSEK": "bg-amber-500/10 border-amber-500/20 text-amber-400",
    "ORTA": "bg-blue-500/10 border-blue-500/20 text-blue-400",
    "DÜŞÜK": "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  } as const;
  return (
    <span className={`text-[10px] tracking-wider font-bold px-3 py-1 rounded-full border ${map[level]}`}>
      {level}
    </span>
  );
}
