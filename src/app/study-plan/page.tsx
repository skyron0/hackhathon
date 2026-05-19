"use client";

import { useApp } from "@/context/AppContext";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles, BrainCircuit, RefreshCw, Calendar, CheckCircle2, Circle,
  Clock, ListChecks, Target, Zap,
} from "lucide-react";

type TaskState = Record<string, boolean>;

export default function StudyPlanPage() {
  const { student, exams, analytics, targetUniversity, targetProgram } = useApp();
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<TaskState>({});

  const storageKey = useMemo(
    () => `yks-ai-coach:weekly-tasks/${student?.id ?? "anon"}`,
    [student?.id]
  );

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(storageKey) ?? "{}"));
    } catch {
      setDone({});
    }
  }, [storageKey]);

  const tasks = analytics.smartStudyPlan.tasks;
  const completedCount = tasks.filter((task) => done[task.id]).length;
  const completion = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  function toggleTask(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  async function generate() {
    if (!student) return;
    setLoading(true);
    setError("");
    setPlan("");
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
      if (j.success) setPlan(j.aiAdvice);
      else setError(j.error ?? "Bir sorun oluştu");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        <Sparkles className="text-purpleCustom h-7 w-7 animate-pulse" />
        <div>
          <h1 className="text-2xl font-bold">Akıllı Çalışma Planı</h1>
          <p className="text-zinc-400 text-sm mt-1">Konu hataları, deneme trendi ve sınava kalan süreye göre otomatik görev planı.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <InfoCard icon={Zap} label="Strateji Modu" value={analytics.strategyMode.label} sub={analytics.strategyMode.mainFocus} />
        <InfoCard icon={Calendar} label="Sınava Kalan" value={`${analytics.strategyMode.daysLeft} gün`} sub={analytics.strategyMode.weeklyExamTarget} />
        <InfoCard icon={Clock} label="Haftalık Yük" value={`${analytics.smartStudyPlan.workloadHours} saat`} sub={analytics.smartStudyPlan.weeklyFocus} />
        <InfoCard icon={ListChecks} label="Görev Tamamlama" value={`%${completion}`} sub={`${completedCount}/${tasks.length} görev tamamlandı`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="font-bold flex items-center gap-2 text-purpleCustom-light">
              <Target className="h-5 w-5" /> Haftalık Görev Takibi
            </h2>
            <div className="w-36 bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const checked = !!done[task.id];
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full text-left border rounded-2xl p-4 transition ${
                    checked
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-zinc-900/70 border-zinc-800 hover:border-purpleCustom/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {checked ? <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" /> : <Circle className="h-5 w-5 text-zinc-500 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500">{task.day}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityClass(task.priority)}`}>{task.priority}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-purpleCustom/25 text-purpleCustom-light">{task.examType}</span>
                      </div>
                      <div className={`font-semibold mt-1 ${checked ? "text-zinc-400 line-through" : "text-zinc-100"}`}>{task.title}</div>
                      <div className="text-xs text-zinc-500 mt-1">{task.subject} · {task.durationMinutes} dk · {task.questionTarget ? `${task.questionTarget} soru` : "tam deneme"}</div>
                      <div className="text-xs text-zinc-400 mt-2">{task.rationale}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-zinc-800 rounded-3xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-purpleCustom-light">
            <BrainCircuit className="h-5 w-5" /> Konu Dağılımı
          </h2>
          <div className="space-y-4">
            {analytics.smartStudyPlan.topicDistribution.map((item) => (
              <div key={item.subject}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-300 font-medium">{item.subject}</span>
                  <span className="text-zinc-500">{item.minutes} dk</span>
                </div>
                <div className="text-xs text-zinc-500 mb-2">{item.questionTarget ? `${item.questionTarget} soru hedefi` : "deneme analizi"}</div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purpleCustom"
                    style={{ width: `${Math.min(100, (item.minutes / Math.max(1, analytics.smartStudyPlan.workloadHours * 60)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-purpleCustom/20 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold flex items-center gap-2 text-purpleCustom-light">
              <Sparkles className="h-5 w-5" /> Gemini AI Koç Yorumu
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Deterministik görev planını AI açıklamasıyla genişlet.</p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="bg-purpleCustom hover:bg-purpleCustom-dark disabled:opacity-50 font-bold px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-purpleCustom/30"
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
            {loading ? "AI Plan Üretiliyor..." : plan ? "Yeniden Üret" : "AI Yorumu Üret"}
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {plan && (
          <div className="prose prose-invert text-sm leading-relaxed space-y-3 mt-5">
            {plan.split("\n").map((line, i) => {
              if (line.startsWith("### ")) return <h3 key={i} className="text-base font-bold text-purpleCustom-light pt-3 border-b border-purpleCustom/20 pb-1">{line.replace(/^### /, "")}</h3>;
              if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} className="pl-4 text-zinc-300">• {line.replace(/^[-*] /, "")}</div>;
              if (line.trim().length > 0) return <p key={i} className="text-zinc-300">{line}</p>;
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="bg-card border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Icon className="h-4 w-4 text-purpleCustom-light" /> {label}
      </div>
      <div className="text-xl font-extrabold text-zinc-100 mt-2">{value}</div>
      <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{sub}</div>
    </div>
  );
}

function priorityClass(priority: "KRITIK" | "YUKSEK" | "ORTA") {
  if (priority === "KRITIK") return "border-rose-500/30 bg-rose-500/10 text-rose-400";
  if (priority === "YUKSEK") return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  return "border-sky-500/30 bg-sky-500/10 text-sky-400";
}
