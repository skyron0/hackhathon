"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  TYT_SUBJECTS,
  AYT_SUBJECTS_BY_ALAN,
  type SubjectDef,
  type ExamType,
} from "@/types/yks";
import { PlusCircle, FlaskConical, Save, AlertTriangle } from "lucide-react";

interface SubjectInput {
  subject: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  blank: number;
}

interface TopicInput {
  subject: string;
  topic: string;
  wrong: number;
  importance: number;
}

export default function AddExamPage() {
  const router = useRouter();
  const { student, addExam } = useApp();

  const [examType, setExamType] = useState<ExamType>("TYT");
  const [examName, setExamName] = useState("");

  // Per exam-type subject definitions
  const subjectDefs = useMemo<SubjectDef[]>(() => {
    if (examType === "TYT") return TYT_SUBJECTS;
    return AYT_SUBJECTS_BY_ALAN[(student?.alan ?? "SAY") as keyof typeof AYT_SUBJECTS_BY_ALAN];
  }, [examType, student?.alan]);

  // State: per-subject net entry
  const [subjectInputs, setSubjectInputs] = useState<SubjectInput[]>([]);
  // Per-topic mistakes
  const [topicInputs, setTopicInputs] = useState<TopicInput[]>([]);
  // For "add topic" form
  const [topicForm, setTopicForm] = useState<{ subject: string; topic: string; wrong: number; importance: number }>({
    subject: subjectDefs[0]?.name ?? "",
    topic: subjectDefs[0]?.topics[0] ?? "",
    wrong: 1,
    importance: 7,
  });

  // re-init subject inputs whenever exam type changes
  useEffect(() => {
    setSubjectInputs(subjectDefs.map(d => ({
      subject: d.name, totalQuestions: d.totalQuestions, correct: 0, wrong: 0, blank: d.totalQuestions,
    })));
    setTopicInputs([]);
    setTopicForm({
      subject: subjectDefs[0]?.name ?? "",
      topic: subjectDefs[0]?.topics[0] ?? "",
      wrong: 1, importance: 7,
    });
  }, [subjectDefs]);

  // Sync topic dropdown options when subject changes
  const currentTopics = useMemo(() => {
    return subjectDefs.find(s => s.name === topicForm.subject)?.topics ?? [];
  }, [subjectDefs, topicForm.subject]);

  // Per-subject derived net
  const totalNet = useMemo(() => {
    return +subjectInputs.reduce((acc, s) => acc + (s.correct - s.wrong * 0.25), 0).toFixed(2);
  }, [subjectInputs]);

  function setSubjectField(i: number, field: "correct" | "wrong" | "blank", value: number) {
    setSubjectInputs(prev => {
      const next = [...prev];
      const cur = { ...next[i] };
      cur[field] = Math.max(0, Math.min(cur.totalQuestions, value || 0));
      const sum = cur.correct + cur.wrong + cur.blank;
      if (sum > cur.totalQuestions) {
        // adjust blank down
        const overflow = sum - cur.totalQuestions;
        if (field !== "blank") cur.blank = Math.max(0, cur.blank - overflow);
      }
      next[i] = cur;
      return next;
    });
  }

  function addTopic() {
    if (!topicForm.subject || !topicForm.topic || topicForm.wrong < 1) return;
    setTopicInputs(prev => [
      ...prev,
      { subject: topicForm.subject, topic: topicForm.topic, wrong: topicForm.wrong, importance: topicForm.importance },
    ]);
    setTopicForm({ ...topicForm, wrong: 1 });
  }

  function removeTopic(i: number) {
    setTopicInputs(prev => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!student) { router.push("/onboarding"); return; }
    if (!examName.trim()) return alert("Lütfen denemenin adını gir.");

    await addExam(
      {
        student_id: student.id,
        exam_name: examName.trim(),
        exam_type: examType,
        taken_at: new Date().toISOString(),
        total_net: totalNet,
      },
      subjectInputs.map(s => ({
        exam_id: "",
        subject: s.subject,
        correct: s.correct,
        wrong: s.wrong,
        blank: s.blank,
      })),
      topicInputs.map(t => ({
        exam_id: "", student_id: student.id,
        subject: t.subject, topic: t.topic,
        wrong_count: t.wrong, importance: t.importance,
      }))
    );

    router.push("/dashboard");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle className="text-purpleCustom" /> Yeni Deneme Sonucu
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Ders ve konu bazlı veri gir — algoritma anında günceller.</p>
        </div>
        <div className="bg-card border border-zinc-800 rounded-xl px-4 py-2 text-right">
          <div className="text-xs text-zinc-400">Toplam Net</div>
          <div className="text-2xl font-extrabold text-purpleCustom-light">{totalNet}</div>
        </div>
      </div>

      {/* TYT / AYT tabs */}
      <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
        {(["TYT", "AYT"] as ExamType[]).map(t => (
          <button
            key={t}
            onClick={() => setExamType(t)}
            className={`py-2.5 rounded-lg font-semibold text-sm transition ${
              examType === t
                ? "bg-purpleCustom text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t === "TYT" ? "TYT (Temel Yeterlilik)" : `AYT (${student?.alan ?? "SAY"})`}
          </button>
        ))}
      </div>

      {/* Exam name */}
      <div className="bg-card border border-zinc-800 rounded-2xl p-5">
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Deneme Sınavı Adı *</label>
        <input
          value={examName}
          onChange={e => setExamName(e.target.value)}
          placeholder="Örn: Özdebir TYT Türkiye Geneli 4"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purpleCustom"
        />
      </div>

      {/* Per-subject entry */}
      <div className="bg-card border border-zinc-800 rounded-2xl p-5">
        <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <FlaskConical className="text-purpleCustom h-5 w-5" />
          Ders Bazlı Net
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 uppercase tracking-wide">
              <tr>
                <th className="text-left py-2 pr-3">Ders</th>
                <th className="py-2 px-3 text-center">Soru</th>
                <th className="py-2 px-3 text-center">Doğru</th>
                <th className="py-2 px-3 text-center">Yanlış</th>
                <th className="py-2 px-3 text-center">Boş</th>
                <th className="py-2 pl-3 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {subjectInputs.map((s, i) => {
                const net = +(s.correct - s.wrong * 0.25).toFixed(2);
                return (
                  <tr key={s.subject} className="border-t border-zinc-800">
                    <td className="py-3 pr-3 font-medium text-zinc-200">{s.subject}</td>
                    <td className="py-3 px-3 text-center text-zinc-500">{s.totalQuestions}</td>
                    <td className="py-3 px-2 text-center">
                      <input type="number" min={0} max={s.totalQuestions} value={s.correct}
                        onChange={e => setSubjectField(i, "correct", +e.target.value)}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-center text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"/>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input type="number" min={0} max={s.totalQuestions} value={s.wrong}
                        onChange={e => setSubjectField(i, "wrong", +e.target.value)}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-center text-rose-400 font-semibold focus:outline-none focus:border-rose-500"/>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input type="number" min={0} max={s.totalQuestions} value={s.blank}
                        onChange={e => setSubjectField(i, "blank", +e.target.value)}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-center text-zinc-300 focus:outline-none focus:border-zinc-500"/>
                    </td>
                    <td className="py-3 pl-3 text-right font-bold text-purpleCustom-light">{net}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-topic mistakes */}
      <div className="bg-card border border-zinc-800 rounded-2xl p-5">
        <h3 className="font-bold text-zinc-100 mb-1 flex items-center gap-2">
          <AlertTriangle className="text-amber-400 h-5 w-5" />
          Konu Bazlı Yanlışlar
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          Hangi konularda yanlış yaptığını gir — AI koç bu listeyi temel alarak haftalık plan hazırlar.
        </p>

        {/* Add-topic form */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
          <select
            value={topicForm.subject}
            onChange={e => {
              const subj = e.target.value;
              const topics = subjectDefs.find(s => s.name === subj)?.topics ?? [];
              setTopicForm({ ...topicForm, subject: subj, topic: topics[0] ?? "" });
            }}
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purpleCustom"
          >
            {subjectDefs.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <select
            value={topicForm.topic}
            onChange={e => setTopicForm({ ...topicForm, topic: e.target.value })}
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purpleCustom"
          >
            {currentTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={addTopic} className="bg-purpleCustom hover:bg-purpleCustom-dark font-semibold px-4 py-2 rounded-xl text-sm">
            + Ekle
          </button>
          <div className="md:col-span-3 flex gap-2 items-center">
            <label className="text-xs text-zinc-500 w-20">Yanlış sayısı</label>
            <input type="number" min={1} max={40} value={topicForm.wrong}
              onChange={e => setTopicForm({ ...topicForm, wrong: +e.target.value })}
              className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-rose-400 font-semibold focus:outline-none focus:border-rose-500"/>
            <label className="text-xs text-zinc-500 w-32 ml-3">Önem (1-10)</label>
            <input type="number" min={1} max={10} value={topicForm.importance}
              onChange={e => setTopicForm({ ...topicForm, importance: +e.target.value })}
              className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500"/>
          </div>
        </div>

        {topicInputs.length === 0 ? (
          <p className="text-xs text-zinc-600 italic text-center py-4">Henüz konu eklemedin.</p>
        ) : (
          <div className="space-y-2">
            {topicInputs.map((t, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
                <div>
                  <div className="text-sm text-zinc-100 font-medium">{t.topic}</div>
                  <div className="text-xs text-zinc-500">{t.subject} · {t.wrong} yanlış · önem {t.importance}/10</div>
                </div>
                <button onClick={() => removeTopic(i)} className="text-rose-400 hover:text-rose-300 text-xs">Sil</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 sticky bottom-4">
        <button onClick={() => router.back()} className="px-5 py-3 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800/50">
          İptal
        </button>
        <button
          onClick={submit}
          disabled={!examName.trim()}
          className="bg-purpleCustom hover:bg-purpleCustom-dark disabled:opacity-40 disabled:cursor-not-allowed font-bold px-6 py-3 rounded-xl transition text-sm flex items-center gap-2 shadow-lg shadow-purpleCustom/30"
        >
          <Save className="h-4 w-4" /> Denemeyi Kaydet
        </button>
      </div>
    </div>
  );
}
