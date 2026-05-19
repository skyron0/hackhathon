"use client";

import { useApp } from "@/context/AppContext";
import { Flame } from "lucide-react";

export default function HeatmapPage() {
  const { analytics } = useApp();
  const topics = analytics.topWeakTopics;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        <Flame className="text-purpleCustom h-7 w-7" />
        <div>
          <h1 className="text-2xl font-bold">Konu Eksikliği Isı Haritası</h1>
          <p className="text-zinc-400 text-sm mt-1">Tüm denemelerden derlenmiş, ağırlıklı hata skoruna göre sıralanmış konu listesi.</p>
        </div>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-12">Henüz konu hatası eklemedin. Yeni bir deneme ekleyince burası dolar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t, i) => {
            const style =
              t.severity === "KRİTİK" ? { bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-400" } :
              t.severity === "YÜKSEK" ? { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" } :
              t.severity === "ORTA"   ? { bg: "bg-blue-500/10 border-blue-500/30",  text: "text-blue-400"  } :
                                        { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" };
            return (
              <div key={i} className={`border rounded-2xl p-5 flex flex-col justify-between ${style.bg}`}>
                <div>
                  <span className={`text-[10px] font-bold tracking-widest ${style.text}`}>{t.severity}</span>
                  <h3 className="text-base font-bold mt-2 text-zinc-100">{t.topic}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.subject}</p>
                </div>
                <div className="flex justify-between items-center mt-5 pt-3 border-t border-zinc-800/40">
                  <span className="text-xs text-zinc-500">Toplam yanlış</span>
                  <span className={`font-bold ${style.text}`}>{t.totalWrong}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-zinc-500">Ağırlıklı skor</span>
                  <span className={`font-semibold ${style.text}`}>{t.weightedScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
