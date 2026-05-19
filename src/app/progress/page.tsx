"use client";

import { useApp } from "@/context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import type { ExamType } from "@/types/yks";

export default function ProgressPage() {
  const { exams, scores, analytics } = useApp();

  const sortedExams = useMemo(
    () => exams.slice().sort((a, b) =>
      new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
    ),
    [exams]
  );

  const trendData = useMemo(() => {
    const groups: Record<ExamType, { name: string; net: number; exam: string }[]> = {
      TYT: [],
      AYT: [],
    };

    for (const exam of sortedExams) {
      const index = groups[exam.exam_type].length + 1;
      groups[exam.exam_type].push({
        name: `${exam.exam_type} #${index}`,
        net: exam.total_net,
        exam: exam.exam_name,
      });
    }

    return groups;
  }, [sortedExams]);

  const subjectAggByType = useMemo(() => {
    const examTypeById = new Map(exams.map((e) => [e.id, e.exam_type]));
    const map = new Map<string, { subject: string; TYT: number; AYT: number }>();

    for (const score of scores) {
      const examType = examTypeById.get(score.exam_id);
      if (!examType) continue;

      const cur = map.get(score.subject) ?? { subject: score.subject, TYT: 0, AYT: 0 };
      cur[examType] += score.correct - score.wrong * 0.25;
      map.set(score.subject, cur);
    }

    return [...map.values()]
      .map((item) => ({
        subject: item.subject,
        TYT: +item.TYT.toFixed(2),
        AYT: +item.AYT.toFixed(2),
      }))
      .sort((a, b) => (b.TYT + b.AYT) - (a.TYT + a.AYT));
  }, [exams, scores]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        <BarChart3 className="text-purpleCustom h-7 w-7" />
        <div>
          <h1 className="text-2xl font-bold">Detaylı Performans Grafikleri</h1>
          <p className="text-zinc-400 text-sm mt-1">TYT ve AYT denemeleri ayrı izlenir; ders netleri sınav türüne göre karşılaştırılır.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics.examTypeStats.map((stat) => (
          <div key={stat.examType} className="bg-card border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">{stat.examType} Deneme Özeti</div>
                <div className="text-3xl font-extrabold text-purpleCustom-light mt-1">
                  {stat.weightedNet?.toFixed(2) ?? "—"}
                  <span className="text-sm font-medium text-zinc-500 ml-1">/ {stat.maxNet} net</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400">Deneme</div>
                <div className="text-xl font-bold">{stat.examCount}</div>
                <div className={stat.trend >= 0 ? "text-xs text-emerald-400" : "text-xs text-rose-400"}>
                  Trend: {stat.trend >= 0 ? "+" : ""}{stat.trend}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendCard title="TYT Net Trendi" data={trendData.TYT} stroke="#8b5cf6" />
        <TrendCard title="AYT Net Trendi" data={trendData.AYT} stroke="#10b981" />
      </div>

      <div className="bg-card border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="text-purpleCustom" /> Ders Bazlı Toplam Net: TYT / AYT</h2>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectAggByType} layout="vertical" margin={{ top: 10, right: 20, left: 92, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#71717a" fontSize={11} />
              <YAxis dataKey="subject" type="category" stroke="#71717a" fontSize={11} width={92} />
              <Tooltip contentStyle={{ backgroundColor: "#141417", borderColor: "#27272a", color: "#fff" }} />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
              <Bar dataKey="TYT" name="TYT Net" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              <Bar dataKey="AYT" name="AYT Net" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function TrendCard({ title, data, stroke }: { title: string; data: { name: string; net: number; exam: string }[]; stroke: string }) {
  return (
    <div className="bg-card border border-zinc-800 rounded-3xl p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-purpleCustom" /> {title}</h2>
      <div className="h-[320px] w-full">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            Bu sınav türünde henüz deneme yok.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#141417", borderColor: "#27272a", color: "#fff" }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.exam ?? ""}
              />
              <Line type="monotone" dataKey="net" name="Toplam Net" stroke={stroke} strokeWidth={3} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
