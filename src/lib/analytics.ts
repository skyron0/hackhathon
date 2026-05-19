import type { Exam, ExamType, Program, PuanTuru, SubjectScore, TopicError } from "@/types/yks";

export interface SubjectStat {
  subject: string;
  net: number;
  successRate: number;
  totalQuestions: number;
}

export interface ExamTypeStat {
  examType: ExamType;
  examCount: number;
  latestNet: number | null;
  weightedNet: number | null;
  maxNet: number;
  trend: number;
}

export interface RankingRange {
  best: number;
  expected: number;
  worst: number;
  label: string;
}

export interface StrategyMode {
  mode: "TEMEL_INSA" | "NET_ARTIRMA" | "DENEME_KAMPI" | "SON_TEKRAR";
  label: string;
  daysLeft: number;
  examDate: string;
  weeklyExamTarget: string;
  mainFocus: string;
  intensity: "DENGELI" | "YUKSEK" | "COK_YUKSEK";
}

export interface ExamAnalysisReport {
  examName: string;
  examType: ExamType;
  totalNet: number;
  previousNet: number | null;
  deltaNet: number | null;
  summary: string;
  positives: string[];
  risks: string[];
  actions: string[];
}

export interface StudyPlanTask {
  id: string;
  day: string;
  title: string;
  subject: string;
  topic: string;
  examType: ExamType;
  durationMinutes: number;
  questionTarget: number;
  priority: "KRITIK" | "YUKSEK" | "ORTA";
  rationale: string;
}

export interface SmartStudyPlan {
  weeklyFocus: string;
  workloadHours: number;
  tasks: StudyPlanTask[];
  topicDistribution: { subject: string; minutes: number; questionTarget: number }[];
}

export interface AnalyticsResult {
  performanceScore: number;
  yksScore: number;
  trend: number;
  riskLevel: "DÜŞÜK" | "ORTA" | "YÜKSEK";
  admissionProbability: number;
  estimatedRanking: number | null;
  rankingRange: RankingRange | null;
  predictionConfidence: number;
  targetGapRanking: number | null;
  tytWeightedNet: number | null;
  aytWeightedNet: number | null;
  examTypeStats: ExamTypeStat[];
  strategyMode: StrategyMode;
  lastExamReport: ExamAnalysisReport | null;
  smartStudyPlan: SmartStudyPlan;
  topWeakTopics: WeakTopic[];
  subjectStats: SubjectStat[];
}

export interface WeakTopic {
  subject: string;
  topic: string;
  totalWrong: number;
  weightedScore: number;
  severity: "KRİTİK" | "YÜKSEK" | "ORTA" | "DÜŞÜK";
}

interface OutcomeInput {
  tytNet: number | null;
  aytNet: number | null;
  tytExamCount: number;
  aytExamCount: number;
  targetProgram: Program | null;
  targetRanking: number | null;
  trend: number;
}

interface Outcome {
  performanceScore: number;
  yksScore: number;
  estimatedRanking: number | null;
  rankingRange: RankingRange | null;
  admissionProbability: number;
  predictionConfidence: number;
  targetGapRanking: number | null;
  riskLevel: AnalyticsResult["riskLevel"];
}

const TYT_MAX_NET = 120;
const AYT_MAX_NET = 80;

export function weightedNet(exams: Exam[]): number {
  if (!exams.length) return 0;
  const sorted = [...exams].sort((a, b) =>
    new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
  );
  let sum = 0;
  let w = 0;
  sorted.forEach((exam, index) => {
    const weight = Math.pow(2, (index + 1) / sorted.length);
    sum += exam.total_net * weight;
    w += weight;
  });
  return +(sum / w).toFixed(2);
}

export function examTypeStats(exams: Exam[]): ExamTypeStat[] {
  return (["TYT", "AYT"] as ExamType[]).map((examType) => {
    const items = exams
      .filter((exam) => exam.exam_type === examType)
      .sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime());
    const latest = items.at(-1)?.total_net ?? null;
    const prior = items.length >= 2
      ? items.slice(0, -1).reduce((acc, exam) => acc + exam.total_net, 0) / (items.length - 1)
      : null;
    return {
      examType,
      examCount: items.length,
      latestNet: latest,
      weightedNet: items.length ? weightedNet(items) : null,
      maxNet: examType === "TYT" ? TYT_MAX_NET : AYT_MAX_NET,
      trend: latest !== null && prior !== null ? +(latest - prior).toFixed(2) : 0,
    };
  });
}

export function subjectStats(scores: SubjectScore[]): SubjectStat[] {
  const map = new Map<string, { c: number; w: number; b: number }>();
  for (const score of scores) {
    const cur = map.get(score.subject) ?? { c: 0, w: 0, b: 0 };
    cur.c += score.correct;
    cur.w += score.wrong;
    cur.b += score.blank;
    map.set(score.subject, cur);
  }

  return [...map.entries()].map(([subject, value]) => {
    const total = value.c + value.w + value.b;
    const net = +(value.c - value.w * 0.25).toFixed(2);
    const successRate = total ? Math.round((value.c / total) * 100) : 0;
    return { subject, net, successRate, totalQuestions: total };
  });
}

export function rankWeakTopics(errors: TopicError[]): WeakTopic[] {
  const map = new Map<string, WeakTopic>();
  for (const error of errors) {
    const key = `${error.subject}::${error.topic}`;
    const cur = map.get(key) ?? {
      subject: error.subject,
      topic: error.topic,
      totalWrong: 0,
      weightedScore: 0,
      severity: "DÜŞÜK" as WeakTopic["severity"],
    };
    cur.totalWrong += error.wrong_count;
    cur.weightedScore += error.wrong_count * error.importance;
    map.set(key, cur);
  }

  const items = [...map.values()].sort((a, b) => b.weightedScore - a.weightedScore);
  for (const item of items) {
    if (item.weightedScore >= 40) item.severity = "KRİTİK";
    else if (item.weightedScore >= 20) item.severity = "YÜKSEK";
    else if (item.weightedScore >= 10) item.severity = "ORTA";
    else item.severity = "DÜŞÜK";
  }
  return items;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isTytOnly(program: Program | null): boolean {
  return String(program?.puanTuru ?? "").toUpperCase() === "TYT";
}

function normalizePuanTuru(puanTuru: PuanTuru | undefined): string {
  const raw = String(puanTuru ?? "SAY").toUpperCase();
  if (raw === "TYT") return "TYT";
  if (raw === "EA") return "EA";
  if (raw === "SAY") return "SAY";
  if (raw.includes("D")) return "DIL";
  if (raw.startsWith("S")) return "SOZ";
  return "SAY";
}

function readinessFromNets(input: OutcomeInput): number {
  const hasTyt = input.tytNet !== null;
  const hasAyt = input.aytNet !== null;
  if (!hasTyt && !hasAyt) return 0;

  const tytObserved = hasTyt ? clamp((input.tytNet ?? 0) / TYT_MAX_NET, 0, 1) : null;
  const aytObserved = hasAyt ? clamp((input.aytNet ?? 0) / AYT_MAX_NET, 0, 1) : null;
  const tytRate = tytObserved ?? clamp((aytObserved ?? 0) * 1.08 + 0.04, 0, 1);
  const aytRate = aytObserved ?? clamp((tytObserved ?? 0) * 0.72 - 0.03, 0, 1);

  if (isTytOnly(input.targetProgram)) return tytRate;
  return 0.4 * tytRate + 0.6 * aytRate;
}

function predictionConfidence(input: OutcomeInput): number {
  if (!input.tytExamCount && !input.aytExamCount) return 0;

  let confidence = 0.34;
  if (input.tytExamCount) confidence += 0.16 + Math.min(input.tytExamCount, 5) * 0.035;

  if (isTytOnly(input.targetProgram)) {
    confidence += input.tytExamCount ? 0.12 : 0;
  } else if (input.aytExamCount) {
    confidence += 0.2 + Math.min(input.aytExamCount, 5) * 0.04;
  } else {
    confidence -= 0.16;
  }

  if (Math.abs(input.trend) <= 5) confidence += 0.04;
  return +clamp(confidence, 0.25, 0.92).toFixed(2);
}

export function estimateYksScore(weightedNet: number): number {
  const readiness = clamp(weightedNet / TYT_MAX_NET, 0, 1);
  return scoreFromReadiness(readiness);
}

function scoreFromReadiness(readiness: number): number {
  const curved = 0.1 * Math.sqrt(readiness) + 0.9 * Math.pow(readiness, 1.06);
  return +(100 + curved * 400).toFixed(1);
}

const RANKING_TABLES: Record<string, [number, number][]> = {
  SAY: [
    [560, 100], [545, 500], [530, 2500], [515, 9000], [500, 25000],
    [490, 50000], [475, 85000], [468, 120000], [455, 200000],
    [440, 300000], [430, 400000], [410, 700000], [390, 1000000],
    [350, 1700000], [250, 2600000], [100, 3200000],
  ],
  EA: [
    [540, 100], [520, 1000], [500, 8000], [485, 25000], [475, 50000],
    [468, 85000], [455, 150000], [440, 260000], [430, 400000],
    [410, 700000], [380, 1100000], [300, 1800000], [100, 2600000],
  ],
  SOZ: [
    [520, 100], [500, 1000], [485, 8000], [470, 30000], [455, 80000],
    [440, 180000], [430, 400000], [405, 750000], [370, 1200000],
    [280, 1900000], [100, 2600000],
  ],
  DIL: [
    [520, 100], [500, 1000], [485, 5000], [470, 15000], [455, 40000],
    [440, 85000], [430, 150000], [400, 300000], [350, 550000],
    [250, 900000], [100, 1200000],
  ],
  TYT: [
    [500, 1000], [480, 10000], [460, 50000], [440, 120000],
    [420, 250000], [400, 450000], [380, 750000], [350, 1200000],
    [300, 1800000], [250, 2400000], [100, 3200000],
  ],
};

export function scoreToRanking(score: number, puanTuru?: PuanTuru, targetProgram?: Program | null): number {
  const key = normalizePuanTuru(puanTuru);
  const raw = interpolateRanking(score, RANKING_TABLES[key] ?? RANKING_TABLES.SAY);

  if (targetProgram?.tabanPuan && targetProgram?.tabanSiralama) {
    const anchorRaw = interpolateRanking(
      targetProgram.tabanPuan,
      RANKING_TABLES[normalizePuanTuru(targetProgram.puanTuru)] ?? RANKING_TABLES.SAY
    );
    const scaled = raw * (targetProgram.tabanSiralama / Math.max(1, anchorRaw));
    return Math.round(clamp(scaled, 1, 3200000));
  }

  return raw;
}

function interpolateRanking(score: number, table: [number, number][]): number {
  for (let i = 0; i < table.length - 1; i++) {
    const [s1, r1] = table[i];
    const [s2, r2] = table[i + 1];
    if (score <= s1 && score >= s2) {
      const t = (s1 - score) / (s1 - s2);
      return Math.round(r1 + (r2 - r1) * t);
    }
  }
  if (score > table[0][0]) return table[0][1];
  return table[table.length - 1][1];
}

export function admissionProbability(
  estimatedRanking: number,
  targetRanking: number,
  confidence = 0.75,
  score?: number,
  targetScore?: number,
  trend = 0
): number {
  const rankLogGap = Math.log(Math.max(1, estimatedRanking) / Math.max(1, targetRanking));
  const rankSpread = 0.34 + (1 - confidence) * 0.36;
  const rankProbability = 1 / (1 + Math.exp(rankLogGap / rankSpread));

  let probability = rankProbability;
  if (score !== undefined && targetScore !== undefined) {
    const scoreProbability = 1 / (1 + Math.exp(-(score - targetScore) / 8));
    probability = rankProbability * 0.68 + scoreProbability * 0.32;
  }

  probability = probability * confidence + 0.5 * (1 - confidence);
  probability += clamp(trend, -10, 10) * 0.005;
  return +clamp(probability * 100, 1, 99).toFixed(1);
}

function buildRankingRange(ranking: number | null, confidencePercent: number): RankingRange | null {
  if (!ranking) return null;
  const confidence = clamp(confidencePercent / 100, 0.25, 0.92);
  const spread = 0.08 + (1 - confidence) * 0.38;
  const best = Math.max(1, Math.round(ranking * (1 - spread)));
  const worst = Math.round(ranking * (1 + spread));
  return {
    best,
    expected: ranking,
    worst,
    label: `${best.toLocaleString("tr")} - ${worst.toLocaleString("tr")}`,
  };
}

function estimateOutcome(input: OutcomeInput): Outcome {
  const readiness = readinessFromNets(input);
  const confidence = predictionConfidence(input);
  const confidencePercent = Math.round(confidence * 100);
  const score = scoreFromReadiness(readiness);
  const target = input.targetRanking ?? input.targetProgram?.tabanSiralama ?? null;
  const ranking = scoreToRanking(score, input.targetProgram?.puanTuru, input.targetProgram);
  const probability = target
    ? admissionProbability(ranking, target, confidence, score, input.targetProgram?.tabanPuan, input.trend)
    : 0;

  let risk: AnalyticsResult["riskLevel"] = "ORTA";
  if (target && probability >= 72) risk = "DÜŞÜK";
  else if (target && probability < 38) risk = "YÜKSEK";

  return {
    performanceScore: +(readiness * TYT_MAX_NET).toFixed(2),
    yksScore: score,
    estimatedRanking: ranking,
    rankingRange: buildRankingRange(ranking, confidencePercent),
    admissionProbability: probability,
    predictionConfidence: confidencePercent,
    targetGapRanking: target ? ranking - target : null,
    riskLevel: risk,
  };
}

export function simulateAdmissionScenario(
  analytics: AnalyticsResult,
  targetProgram: Program | null,
  targetRanking: number | null,
  deltaNet: number
): Pick<Outcome, "admissionProbability" | "estimatedRanking" | "rankingRange" | "yksScore"> {
  const tytShare = isTytOnly(targetProgram) ? 1 : 0.4;
  const aytShare = isTytOnly(targetProgram) ? 0 : 0.6;
  const tytNet = analytics.tytWeightedNet === null
    ? null
    : clamp(analytics.tytWeightedNet + deltaNet * tytShare, 0, TYT_MAX_NET);
  const aytNet = analytics.aytWeightedNet === null
    ? null
    : clamp(analytics.aytWeightedNet + deltaNet * aytShare, 0, AYT_MAX_NET);
  const outcome = estimateOutcome({
    tytNet,
    aytNet,
    tytExamCount: analytics.examTypeStats.find((stat) => stat.examType === "TYT")?.examCount ?? 0,
    aytExamCount: analytics.examTypeStats.find((stat) => stat.examType === "AYT")?.examCount ?? 0,
    targetProgram,
    targetRanking,
    trend: analytics.trend,
  });
  return {
    admissionProbability: outcome.admissionProbability,
    estimatedRanking: outcome.estimatedRanking,
    rankingRange: outcome.rankingRange,
    yksScore: outcome.yksScore,
  };
}

function nextYksDate(referenceDate = new Date()): Date {
  const year = referenceDate.getMonth() > 6 ? referenceDate.getFullYear() + 1 : referenceDate.getFullYear();
  const juneFirst = new Date(year, 5, 1);
  const firstSaturdayOffset = (6 - juneFirst.getDay() + 7) % 7;
  const thirdSaturday = 1 + firstSaturdayOffset + 14;
  return new Date(year, 5, thirdSaturday);
}

function buildStrategyMode(exams: Exam[], targetProgram: Program | null): StrategyMode {
  const examDate = nextYksDate();
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / 86400000));
  const hasAytTarget = !isTytOnly(targetProgram);
  const hasEnoughData = exams.length >= 4;

  if (daysLeft <= 30) {
    return {
      mode: "SON_TEKRAR",
      label: "Son Tekrar Modu",
      daysLeft,
      examDate: examDate.toISOString(),
      weeklyExamTarget: hasAytTarget ? "2 TYT + 2 AYT tam deneme" : "3 TYT tam deneme",
      mainFocus: "Yeni konu yükünü azalt, yanlış defteri ve deneme ritmini öne al.",
      intensity: "COK_YUKSEK",
    };
  }

  if (daysLeft <= 90) {
    return {
      mode: "DENEME_KAMPI",
      label: "Deneme Kampı Modu",
      daysLeft,
      examDate: examDate.toISOString(),
      weeklyExamTarget: hasAytTarget ? "2 TYT + 1 AYT deneme" : "2 TYT deneme",
      mainFocus: "Net dalgalanmasını azalt, her denemeden sonra konu bazlı kapanış yap.",
      intensity: "YUKSEK",
    };
  }

  if (daysLeft <= 180 || hasEnoughData) {
    return {
      mode: "NET_ARTIRMA",
      label: "Net Artırma Modu",
      daysLeft,
      examDate: examDate.toISOString(),
      weeklyExamTarget: hasAytTarget ? "1 TYT + 1 AYT deneme" : "1 TYT deneme",
      mainFocus: "Yüksek getirili konularda net artışı hedefle.",
      intensity: "YUKSEK",
    };
  }

  return {
    mode: "TEMEL_INSA",
    label: "Temel İnşa Modu",
    daysLeft,
    examDate: examDate.toISOString(),
    weeklyExamTarget: "Haftada 1 seviye tespit denemesi",
    mainFocus: "Temel eksikleri kapat, konu anlatımı ve kısa testlerle düzen kur.",
    intensity: "DENGELI",
  };
}

function inferExamTypeFromSubject(subject: string): ExamType {
  const aytSignals = ["Fizik", "Kimya", "Biyoloji", "Türev", "İntegral", "Edebiyat", "Tarih-1", "Coğrafya-1", "Yabancı Dil"];
  return aytSignals.some((signal) => subject.includes(signal)) ? "AYT" : "TYT";
}

function taskId(...parts: string[]) {
  return parts.join("-").toLocaleLowerCase("tr").replace(/[^a-z0-9ığüşöçİĞÜŞÖÇ]+/gi, "-").replace(/^-|-$/g, "");
}

function buildSmartStudyPlan(
  weakTopics: WeakTopic[],
  strategy: StrategyMode,
  targetProgram: Program | null,
  tytWeightedNet: number | null,
  aytWeightedNet: number | null
): SmartStudyPlan {
  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const fallback: WeakTopic[] = [
    { subject: "Temel Matematik", topic: "Problemler", totalWrong: 0, weightedScore: 12, severity: "ORTA" },
    { subject: "Türkçe", topic: "Paragraf", totalWrong: 0, weightedScore: 10, severity: "ORTA" },
    { subject: isTytOnly(targetProgram) ? "Fen Bilimleri" : "Matematik", topic: isTytOnly(targetProgram) ? "Karma test" : "Türev", totalWrong: 0, weightedScore: 10, severity: "ORTA" },
  ];
  const source = (weakTopics.length ? weakTopics : fallback).slice(0, 5);
  const needsAyt = !isTytOnly(targetProgram);
  const tytWeak = tytWeightedNet === null || tytWeightedNet < 70;
  const aytWeak = needsAyt && (aytWeightedNet === null || aytWeightedNet < 42);
  const baseMinutes = strategy.mode === "SON_TEKRAR" ? 55 : strategy.mode === "DENEME_KAMPI" ? 70 : 80;

  const tasks: StudyPlanTask[] = source.map((topic, index) => {
    const examType = inferExamTypeFromSubject(topic.subject);
    const priority = topic.severity === "KRİTİK" || topic.severity === "YÜKSEK" ? "KRITIK" : index < 2 ? "YUKSEK" : "ORTA";
    const questionTarget = priority === "KRITIK" ? 70 : priority === "YUKSEK" ? 50 : 35;
    return {
      id: taskId(topic.subject, topic.topic, String(index)),
      day: days[index],
      title: `${topic.topic} kapanış bloğu`,
      subject: topic.subject,
      topic: topic.topic,
      examType,
      durationMinutes: baseMinutes + (priority === "KRITIK" ? 25 : 0),
      questionTarget,
      priority,
      rationale: topic.totalWrong
        ? `${topic.totalWrong} tekrar eden hata ve ${topic.weightedScore} ağırlıklı risk puanı var.`
        : "Veri az olduğu için yüksek getirili varsayılan konu olarak eklendi.",
    };
  });

  tasks.push({
    id: "deneme-analiz-bloku",
    day: "Cumartesi",
    title: strategy.weeklyExamTarget,
    subject: needsAyt && aytWeak ? "AYT Genel" : "TYT Genel",
    topic: "Tam deneme + yanlış analizi",
    examType: needsAyt && aytWeak ? "AYT" : "TYT",
    durationMinutes: strategy.mode === "SON_TEKRAR" ? 180 : 150,
    questionTarget: 0,
    priority: "YUKSEK",
    rationale: "Deneme ritmi ve yanlış defteri tahmin güvenini doğrudan artırır.",
  });

  tasks.push({
    id: "haftalik-kapanis",
    day: "Pazar",
    title: "Haftalık kapanış ve tekrar",
    subject: tytWeak ? "TYT Genel" : "AYT Genel",
    topic: "Yanlış defteri + mini karma test",
    examType: tytWeak ? "TYT" : "AYT",
    durationMinutes: 75,
    questionTarget: 30,
    priority: "ORTA",
    rationale: "Hafta içi çalışılan konuların kalıcılığını ölçer.",
  });

  const distribution = new Map<string, { subject: string; minutes: number; questionTarget: number }>();
  for (const task of tasks) {
    const cur = distribution.get(task.subject) ?? { subject: task.subject, minutes: 0, questionTarget: 0 };
    cur.minutes += task.durationMinutes;
    cur.questionTarget += task.questionTarget;
    distribution.set(task.subject, cur);
  }

  const primary = tasks[0];
  return {
    weeklyFocus: primary
      ? `${strategy.label}: öncelik ${primary.subject} / ${primary.topic}.`
      : `${strategy.label}: düzenli deneme ve tekrar.`,
    workloadHours: +(tasks.reduce((acc, task) => acc + task.durationMinutes, 0) / 60).toFixed(1),
    tasks,
    topicDistribution: [...distribution.values()].sort((a, b) => b.minutes - a.minutes),
  };
}

function buildLastExamReport(exams: Exam[], scores: SubjectScore[], weakTopics: WeakTopic[]): ExamAnalysisReport | null {
  const sorted = [...exams].sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime());
  const last = sorted.at(-1);
  if (!last) return null;

  const sameTypePrior = sorted.filter((exam) => exam.exam_type === last.exam_type && exam.id !== last.id).at(-1) ?? null;
  const delta = sameTypePrior ? +(last.total_net - sameTypePrior.total_net).toFixed(2) : null;
  const lastScores = scores.filter((score) => score.exam_id === last.id).map((score) => ({
    subject: score.subject,
    net: +(score.correct - score.wrong * 0.25).toFixed(2),
    wrong: score.wrong,
    blank: score.blank,
  }));
  const best = [...lastScores].sort((a, b) => b.net - a.net)[0];
  const weakest = [...lastScores].sort((a, b) => (b.wrong + b.blank) - (a.wrong + a.blank))[0];
  const topWeak = weakTopics[0];
  const trendText = delta === null
    ? "Bu sınav türünde kıyas için önceki deneme yok."
    : delta >= 3
      ? `${delta} net artış var; bu ivme korunmalı.`
      : delta <= -3
        ? `${Math.abs(delta)} net düşüş var; sebebi konu mu süre mi ayrıştırılmalı.`
        : `${delta >= 0 ? "+" : ""}${delta} net değişim var; performans yatay.`;

  return {
    examName: last.exam_name,
    examType: last.exam_type,
    totalNet: last.total_net,
    previousNet: sameTypePrior?.total_net ?? null,
    deltaNet: delta,
    summary: `${last.exam_type} ${last.exam_name}: ${last.total_net} net. ${trendText}`,
    positives: [
      best ? `${best.subject} tarafında ${best.net} net ile haftanın güçlü alanı öne çıktı.` : "Ders bazlı veri girildiğinde güçlü alan analizi netleşir.",
      delta !== null && delta > 0 ? "Aynı sınav türünde önceki denemeye göre yükseliş var." : "Rapor deneme ritmi oluşunca daha hassas hale gelir.",
    ],
    risks: [
      weakest ? `${weakest.subject} dersinde ${weakest.wrong} yanlış ve ${weakest.blank} boş takip edilmeli.` : "Ders detayları girilmediği için risk kırılımı sınırlı.",
      topWeak ? `${topWeak.subject} / ${topWeak.topic} konusu tekrar eden hata listesinde üst sırada.` : "Konu bazlı yanlış girişi yapılmadı.",
    ],
    actions: [
      weakest ? `${weakest.subject} için 48 saat içinde 30 soruluk kapanış testi çöz.` : "Son denemenin ders kırılımını ekle.",
      topWeak ? `${topWeak.topic} için kısa konu tekrarı + yanlış defteri kontrolü yap.` : "En az 3 konu hatası ekleyerek planı kişiselleştir.",
      "Bir sonraki denemede aynı sınav türünü tekrar çözerek trendi doğrula.",
    ],
  };
}

export function runAnalytics(
  exams: Exam[],
  scores: SubjectScore[],
  errors: TopicError[],
  targetProgram: Program | null,
  targetRanking: number | null
): AnalyticsResult {
  const stats = examTypeStats(exams);
  const tyt = stats.find((stat) => stat.examType === "TYT")!;
  const ayt = stats.find((stat) => stat.examType === "AYT")!;
  const trend = isTytOnly(targetProgram)
    ? tyt.trend
    : +((tyt.trend * 0.4) + (ayt.trend * 0.6)).toFixed(2);
  const outcome = estimateOutcome({
    tytNet: tyt.weightedNet,
    aytNet: ayt.weightedNet,
    tytExamCount: tyt.examCount,
    aytExamCount: ayt.examCount,
    targetProgram,
    targetRanking,
    trend,
  });
  const topWeakTopics = rankWeakTopics(errors).slice(0, 6);
  const strategyMode = buildStrategyMode(exams, targetProgram);

  return {
    ...outcome,
    trend,
    tytWeightedNet: tyt.weightedNet,
    aytWeightedNet: ayt.weightedNet,
    examTypeStats: stats,
    strategyMode,
    lastExamReport: buildLastExamReport(exams, scores, topWeakTopics),
    smartStudyPlan: buildSmartStudyPlan(topWeakTopics, strategyMode, targetProgram, tyt.weightedNet, ayt.weightedNet),
    topWeakTopics,
    subjectStats: subjectStats(scores),
  };
}
