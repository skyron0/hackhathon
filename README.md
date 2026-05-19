# YKS AI Coach 🔮

**BTK Akademi Hackathonu** için geliştirilmiş, **yapay zeka destekli kişiselleştirilmiş YKS hazırlık asistanı**.

> Geleceğini verilerle inşa et — denemeler, eksik konular ve hedef sıralaman tek bir AI motoruna bağlı.

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| **Şifresiz Onboarding** | İsim + alan + hedef üniversite + bölüm + sıralama — 3 adım |
| **TYT / AYT Ayrımı** | Ayrı tablar, alana göre dinamik ders listesi |
| **Ders + Konu Bazlı Giriş** | Her ders için doğru/yanlış/boş, her yanlış için spesifik konu + önem ağırlığı |
| **Canlı İstatistik Motoru** | Ağırlıklı net, YKS puan tahmini, sıralama tahmini, kazanma olasılığı — anlık güncelleme |
| **Olasılık Hesabı** | Sigmoid kalibre edilmiş, hedef sıralama ile mevcut sıralama arasındaki farkı baz alır |
| **Isı Haritası** | Ağırlıklı hata skoruna göre konuları KRİTİK/YÜKSEK/ORTA/DÜŞÜK olarak sıralar |
| **"Ne olursa ne olur" Senaryoları** | +3, +5, +8 net senaryolarında olasılık değişimi |
| **AI Eğitim Koçu** | Gemini AI ile gerçek zamanlı, kişiye özel haftalık çalışma planı |
| **192 Üniversite + 10.657 Bölüm** | [hdd42/universite_bolum_listesi](https://github.com/hdd42/universite_bolum_listesi) ile entegre |
| **Supabase + LocalStorage** | Bulut DB + offline fallback (bir tanesi olmasa da çalışır) |

---

## 🚀 Kurulum

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Environment değişkenlerini ayarla
`.env.example` dosyasını `.env.local` olarak kopyala:
```bash
cp .env.example .env.local
```

`.env.local` içine aşağıdaki değerleri gir:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc.YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc.YOUR-SERVICE-ROLE-KEY
GEMINI_API_KEY=YOUR-GEMINI-API-KEY
GEMINI_MODEL=gemini-2.5-flash
```

> **Not:** Supabase ve Gemini API anahtarı olmadan da çalışır — uygulama localStorage'a yazar ve AI koç placeholder cevap döner.

### 3. Supabase'i kur (önerilen)

1. [supabase.com](https://supabase.com) → yeni proje aç (ücretsiz).
2. Sol menü → **SQL Editor** → `supabase/migrations/0001_init.sql` içeriğini yapıştır → Run.
3. Settings → API → URL ve anon key'i `.env.local`'a kopyala.
4. Üniversite verisini yükle:
   ```bash
   npm run seed:universities
   ```
   192 üniversite + 10.657 bölüm Supabase'e yüklenir.

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```
→ `http://localhost:3000`

### 5. Production build
```bash
npm run build && npm start
```

---

## 🌐 Canlı Deploy (Vercel)

En hızlı yol:

1. GitHub'a push et.
2. [vercel.com/new](https://vercel.com/new) → import et.
3. Environment Variables ekle (aynı `.env.local` değerleri).
4. Deploy → 60 saniyede canlı.

CLI ile:
```bash
npm i -g vercel
vercel
```

---

## 🧠 Mimari

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 15 App Router                                      │
│  ├─ /onboarding   (3-step shifre-free signup)               │
│  ├─ /dashboard    (live analytics)                          │
│  ├─ /add-exam     (TYT/AYT, ders+konu girişi)               │
│  ├─ /heatmap, /prediction, /progress, /study-plan           │
│  └─ /api          (universities, coach, exams, students)    │
├─────────────────────────────────────────────────────────────┤
│  React Context                                              │
│  └─ AppContext: student + exams + analytics (live)          │
├─────────────────────────────────────────────────────────────┤
│  Analytics Engine (src/lib/analytics.ts)                    │
│  ├─ weightedNet()        — exponential-weighted recent avg  │
│  ├─ estimateYksScore()   — 100-500 scale, calibrated        │
│  ├─ scoreToRanking()     — 2024 ÖSYM distribution table     │
│  └─ admissionProbability() — sigmoid over rank gap          │
├─────────────────────────────────────────────────────────────┤
│  Persistence                                                │
│  ├─ Supabase (cloud, primary)                               │
│  └─ localStorage (offline fallback)                         │
├─────────────────────────────────────────────────────────────┤
│  AI Coach                                                   │
│  └─ Gemini AI → structured weekly plan                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Olasılık Formülü

```
estimatedRanking = scoreToRanking(weightedNet → yksScore)
gap              = estimatedRanking - targetRanking
spread           = max(2000, targetRanking × 0.12)
probability      = σ(-gap / spread) × 100
```

Sigmoid eğri, hedefe yakınlıkta hassas, uzakta yumuşak — sıralaması düşük programlarda bile mantıklı sonuçlar verir.

---

## 🗂️ Klasör Yapısı

```
yks-ai-coach/
├─ src/
│  ├─ app/             Next.js routes
│  ├─ components/      Sidebar
│  ├─ context/         AppContext (state + supabase glue)
│  ├─ data/            universities.json (2 MB — bundled)
│  ├─ lib/             analytics, supabase clients, local store
│  └─ types/           TYT/AYT subject definitions, types
├─ supabase/
│  └─ migrations/      0001_init.sql
├─ scripts/
│  └─ seed-universities.ts
└─ docs/               EKSIKLIKLER_RAPORU.md, DEMO_SENARYO.md
```

---

## 🛡️ Lisans & Veri

- Üniversite/bölüm verisi: [hdd42/universite_bolum_listesi](https://github.com/hdd42/universite_bolum_listesi) — YÖK Atlas'tan derlenmiş açık veri.
- Taban sıralamalar ve puanlar **2024 ÖSYM dağılım tablolarından kalibre edilmiş tahminlerdir** ve gerçek yerleştirme garantisi değildir.

---

**Hackathon ekibi:** Emirhan & ekibi  
**BTK Akademi Hackathonu 2026**
