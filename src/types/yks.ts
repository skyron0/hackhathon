// ============================================================
// YKS AI Coach - shared TypeScript types
// ============================================================

export type PuanTuru = "SAY" | "EA" | "SÖZ" | "DİL" | "TYT";
export type Alan     = "SAY" | "EA" | "SÖZ" | "DİL";
export type ExamType = "TYT" | "AYT";

export interface University {
  kod: number;
  isim: string;
}

export interface Program {
  id: number;
  kod: number;
  isim: string;
  fakulte: string;
  okulKod: number;
  puanTuru: PuanTuru;
  tabanSiralama: number;
  tabanPuan: number;
}

export interface Student {
  id: string;
  full_name: string;
  alan: Alan;
  target_uni_kod: number | null;
  target_program_id: number | null;
  target_ranking: number | null;
  created_at: string;
}

export interface SubjectScore {
  id?: string;
  exam_id: string;
  subject: string;        // "Türkçe", "Matematik", "Fizik" ...
  correct: number;
  wrong: number;
  blank: number;
  net?: number;
}

export interface TopicError {
  id?: string;
  exam_id: string;
  student_id: string;
  subject: string;
  topic: string;
  wrong_count: number;
  importance: number;     // 1-10
}

export interface Exam {
  id: string;
  student_id: string;
  exam_name: string;
  exam_type: ExamType;
  taken_at: string;
  total_net: number;
}

// ----- TYT / AYT subject definitions -----------------------------------------

export interface SubjectDef {
  name: string;
  totalQuestions: number;
  topics: string[];      // canonical topic list (Turkish, abbreviated)
}

export const TYT_SUBJECTS: SubjectDef[] = [
  {
    name: "Türkçe",
    totalQuestions: 40,
    topics: [
      "Sözcükte Anlam","Cümlede Anlam","Paragrafta Anlam",
      "Ses Bilgisi","Yazım Kuralları","Noktalama","Sözcükte Yapı",
      "Sözcük Türleri","Cümlenin Ögeleri","Cümle Türleri","Anlatım Bozuklukları",
    ],
  },
  {
    name: "Sosyal Bilimler",
    totalQuestions: 20,
    topics: [
      "Tarih - İlk Çağ","Tarih - Osmanlı","Tarih - İnkılap",
      "Coğrafya - Doğal Sistemler","Coğrafya - Beşeri Sistemler",
      "Felsefe","Din Kültürü",
    ],
  },
  {
    name: "Temel Matematik",
    totalQuestions: 40,
    topics: [
      "Temel Kavramlar","Sayı Basamakları","Bölme - Bölünebilme",
      "EBOB - EKOK","Rasyonel Sayılar","Basit Eşitsizlikler","Mutlak Değer",
      "Üslü-Köklü Sayılar","Çarpanlara Ayırma","Oran Orantı","Denklem Çözme",
      "Problemler","Kümeler","Fonksiyonlar","Permütasyon-Kombinasyon","Olasılık",
      "Veri-İstatistik","Geometri - Üçgenler","Geometri - Çokgenler","Geometri - Çember","Analitik Geometri",
    ],
  },
  {
    name: "Fen Bilimleri",
    totalQuestions: 20,
    topics: [
      "Fizik - Hareket","Fizik - Kuvvet","Fizik - Enerji","Fizik - Optik","Fizik - Elektrik",
      "Kimya - Atom","Kimya - Periyodik","Kimya - Bileşikler","Kimya - Asit-Baz",
      "Biyoloji - Hücre","Biyoloji - Kalıtım","Biyoloji - Ekosistem",
    ],
  },
];

export const AYT_SUBJECTS_BY_ALAN: Record<Alan, SubjectDef[]> = {
  SAY: [
    {
      name: "Matematik",
      totalQuestions: 40,
      topics: [
        "Polinomlar","İkinci Dereceden Denklemler","Karmaşık Sayılar","Logaritma",
        "Trigonometri","Diziler","Limit","Türev","İntegral","Geometri - Katı Cisimler",
      ],
    },
    {
      name: "Fizik",
      totalQuestions: 14,
      topics: ["Vektörler","Kuvvet-Tork","Atışlar","Elektrik","Manyetizma","Dalga Mekaniği","Atom Fiziği","Modern Fizik"],
    },
    {
      name: "Kimya",
      totalQuestions: 13,
      topics: ["Modern Atom","Gazlar","Sıvı Çözeltiler","Kimya ve Enerji","Tepkimelerde Hız","Denge","Karbon Kimyası","Organik Bileşikler"],
    },
    {
      name: "Biyoloji",
      totalQuestions: 13,
      topics: ["Sinir Sistemi","Endokrin","Duyu Organları","Üreme","Komünite","Popülasyon","Genden Proteine"],
    },
  ],
  EA: [
    {
      name: "Matematik",
      totalQuestions: 40,
      topics: ["Polinomlar","İkinci Derece","Logaritma","Diziler","Limit","Türev","İntegral","Trigonometri"],
    },
    {
      name: "Türk Dili ve Edebiyatı",
      totalQuestions: 24,
      topics: ["Anlam Bilgisi","Şiir Bilgisi","Edebi Akımlar","Divan Edebiyatı","Tanzimat","Servet-i Fünun","Cumhuriyet Dönemi","Roman İncelemesi"],
    },
    {
      name: "Tarih-1 / Coğrafya-1",
      totalQuestions: 16,
      topics: ["İnkılap Tarihi","Atatürkçülük","Coğrafya - Beşeri","Coğrafya - Türkiye"],
    },
  ],
  SÖZ: [
    {
      name: "Türk Dili ve Edebiyatı",
      totalQuestions: 24,
      topics: ["Şiir Bilgisi","Halk Edebiyatı","Divan Edebiyatı","Tanzimat","Cumhuriyet Dönemi","Roman İncelemesi","Hikaye İncelemesi","Edebi Akımlar"],
    },
    {
      name: "Tarih-2",
      totalQuestions: 11,
      topics: ["İslam Tarihi","Türk-İslam Devletleri","Osmanlı","Yakın Çağ"],
    },
    {
      name: "Coğrafya-2",
      totalQuestions: 11,
      topics: ["Beşeri Coğrafya","Ekonomik Coğrafya","Çevre","Küresel Sorunlar"],
    },
    {
      name: "Felsefe Grubu",
      totalQuestions: 12,
      topics: ["Felsefe Tarihi","Mantık","Sosyoloji","Psikoloji"],
    },
    {
      name: "Din Kültürü",
      totalQuestions: 6,
      topics: ["İnanç","İbadet","Ahlak","İslam Düşüncesi"],
    },
  ],
  DİL: [
    {
      name: "Yabancı Dil",
      totalQuestions: 80,
      topics: ["Kelime Bilgisi","Dil Bilgisi","Cloze Test","Reading","Translation","Paragraph Completion","Restatement","Dialogue"],
    },
  ],
};
