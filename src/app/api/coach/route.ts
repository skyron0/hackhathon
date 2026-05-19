import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student, targetUniName, targetProgramName, analytics, exams, topicErrors } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        aiAdvice: buildMockCoach(student, targetUniName, targetProgramName, analytics, topicErrors),
        mocked: true,
      });
    }

    const examTxt = exams
      .slice(-8)
      .map((exam: any) => `${exam.exam_name} (${exam.exam_type}): ${exam.total_net} net`)
      .join(", ");
    const weakTxt = topicErrors
      .map((topic: any) => `${topic.subject}/${topic.topic} (${topic.totalWrong ?? topic.wrong_count ?? 1} yanlış)`)
      .join(", ");
    const taskTxt = analytics.smartStudyPlan?.tasks
      ?.map((task: any) => `${task.day}: ${task.subject}/${task.topic}, ${task.durationMinutes} dk, ${task.questionTarget || "deneme"} soru`)
      .join("; ");

    const system = `Sen YKS öğrencilerinin verilerini analiz eden profesyonel bir AI eğitim koçusun.
Aşağıdaki verileri inceleyip Türkçe, ölçülebilir ve uygulanabilir bir HAFTALIK ÇALIŞMA PLANI üret.
Tam olarak şu 5 başlığı kullan, Markdown ile formatla (### başlık, - liste öğesi):

### ÖZET
### STRATEJİ MODU
### ZAYIF ALANLAR
### EYLEM PLANI
### HAFTALIK PROGRAM

Genel motivasyon cümleleri yazma. TYT ve AYT performansını ayrı değerlendir. Deneme raporunu ve hazır görev listesini plana yedir.`;

    const user = `
Öğrenci: ${student.full_name} | Alan: ${student.alan}
Hedef: ${targetUniName ?? "—"} - ${targetProgramName ?? "—"}
Hedef sıralama: ${student.target_ranking ?? "—"}
Ağırlıklı TYT neti: ${analytics.tytWeightedNet ?? "—"} / 120
Ağırlıklı AYT neti: ${analytics.aytWeightedNet ?? "—"} / 80
Tahmini YKS puanı: ${analytics.yksScore}
Tahmini sıralama: ${analytics.estimatedRanking}
Gerçekçi sıralama aralığı: ${analytics.rankingRange?.label ?? "—"}
Kazanma olasılığı: %${analytics.admissionProbability}
Tahmin güveni: %${analytics.predictionConfidence}
Risk: ${analytics.riskLevel}
Strateji modu: ${analytics.strategyMode?.label ?? "—"} | Kalan gün: ${analytics.strategyMode?.daysLeft ?? "—"} | Deneme hedefi: ${analytics.strategyMode?.weeklyExamTarget ?? "—"}
Son deneme raporu: ${analytics.lastExamReport?.summary ?? "henüz yok"}
Son denemeler: ${examTxt || "henüz yok"}
En çok yanlış konular: ${weakTxt || "henüz yok"}
Sistem görev planı: ${taskTxt || "henüz yok"}`;

    const aiAdvice = await generateGeminiContent(system, user);

    return NextResponse.json({
      success: true,
      aiAdvice,
    });
  } catch (error: any) {
    console.error("Gemini coach error:", error);
    return NextResponse.json({ success: false, error: error.message ?? "AI üretilemedi." }, { status: 500 });
  }
}

async function generateGeminiContent(system: string, user: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: user }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        responseMimeType: "text/plain",
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Gemini API isteği başarısız oldu.");
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) throw new Error("Gemini boş yanıt döndürdü.");
  return text;
}

function buildMockCoach(
  student: any,
  uni: string | undefined,
  prog: string | undefined,
  analytics: any,
  weak: any[]
): string {
  const weakLines = (weak ?? []).slice(0, 3).map((topic: any) =>
    `- **${topic.topic}** (${topic.subject}) — ${topic.totalWrong ?? 1} hata`
  ).join("\n");
  const taskLines = analytics.smartStudyPlan?.tasks?.slice(0, 5).map((task: any) =>
    `- ${task.day}: **${task.subject} / ${task.topic}** — ${task.durationMinutes} dk, ${task.questionTarget || "tam deneme"} soru`
  ).join("\n");

  return `### ÖZET
${student?.full_name ?? "Öğrenci"} için mevcut TYT seviyesi **${analytics.tytWeightedNet ?? "—"} net**, AYT seviyesi **${analytics.aytWeightedNet ?? "—"} net**. Hedef ${uni ?? "üniversite"} ${prog ?? ""} için kazanma olasılığı **%${analytics.admissionProbability}**, tahmin güveni **%${analytics.predictionConfidence}**, sıralama aralığı **${analytics.rankingRange?.label ?? "—"}**.

### STRATEJİ MODU
- Aktif mod: **${analytics.strategyMode?.label ?? "—"}**
- Kalan süre: **${analytics.strategyMode?.daysLeft ?? "—"} gün**
- Haftalık deneme hedefi: **${analytics.strategyMode?.weeklyExamTarget ?? "—"}**
- Odak: ${analytics.strategyMode?.mainFocus ?? "Deneme ve yanlış analizi düzenli sürdürülmeli."}

### ZAYIF ALANLAR
${weakLines || "- Şu ana kadar kritik bir konu girilmedi."}

### EYLEM PLANI
- Deneme sonrası rapordaki ilk riski 48 saat içinde kapanış testine çevir.
- Yanlış defterinde tekrar eden konuları önceliklendir.
- Haftalık görev listesindeki kritik bloklar tamamlanmadan yeni konu yükü ekleme.

### HAFTALIK PROGRAM
${taskLines || "- Pazartesi: Matematik/Problemler konu tekrarı + 50 soru\n- Çarşamba: Türkçe/Paragraf hız çalışması + 30 soru\n- Cumartesi: Tam deneme + analiz"}

> Not: GEMINI_API_KEY ayarlı değil, bu mesaj demo amaçlı kalıplanmış halidir. Gerçek AI üretimi için .env.local dosyana GEMINI_API_KEY ekle.`;
}
