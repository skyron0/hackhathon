# YKS AI Coach — Eksiklik Analizi & Yapılanlar Raporu

> Tarih: 18 Mayıs 2026
> Kaynak: `yks-ai-coch (2).zip` (kullanıcı tarafından sağlanan ilk hali)
> Hedef: BTK Akademi Hackathonu için yarışmaya hazır profesyonel teslim

---

## 1. Önceki sürümün tespit edilen eksiklikleri

### A. Login & Kullanıcı Profili
| Sorun | Detay |
|---|---|
| ❌ Şifre alanı vardı | Hackathonda gereksiz, kullanıcı deneyimini yavaşlatıyor |
| ❌ İsim/soyisim sorulmuyordu | Dashboard'da "Ayşe K." hard-coded |
| ❌ Hedef üniversite/bölüm yok | Profil verisi yokken kazanma olasılığı dummy |
| ❌ Hedef sıralama girişi yok | Olasılık hesabı için kritik |

### B. Deneme Ekleme
| Sorun | Detay |
|---|---|
| ❌ Tek input vardı (total net + opsiyonel 1 konu) | Gerçek YKS hazırlığı için yetersiz |
| ❌ TYT/AYT ayrımı yok | Aday kafasında ayrı, sistem tek tek tutamıyor |
| ❌ Ders bazlı doğru/yanlış/boş girişi yok | Net hesabı dışarıdan yapılıyor |
| ❌ Konu bazlı çoklu hata girişi yok | "En zayıf konu" tek alan, tek seferlik |
| ❌ Önem ağırlığı sabit | Bir hatanın YKS'deki önemi konuya göre değişir |

### C. Database & State
| Sorun | Detay |
|---|---|
| ❌ Database yoktu | `src/app/lib/db.ts` içinde `mockDashboardData` constant |
| ❌ Express backend boş | `backend/` klasörü vardı, ama package.json boş, schema yok, DB bağlantısı yok |
| ❌ AddExam → Dashboard akışı kopuk | `addExam` fonksiyonu çağrılıyor ama dashboard `mockDashboardData`'yı state olarak alıyor (context'i kullanmıyor) |
| ❌ LocalStorage yok | Sayfa yenilenince her şey gidiyor |

### D. Üniversite & Olasılık
| Sorun | Detay |
|---|---|
| ❌ Tek üniversite (ODTÜ Bilgisayar) hard-coded | Aslında her aday farklı yere bakıyor |
| ❌ Sıralama tabanı yok | Sadece "82.5 baraj net" var, gerçek olasılık üretmiyor |
| ❌ Olasılık formülü çok kaba | `+/- 5 net farkı` üzerinden lineer, sınır vakalarda saçma |

### E. AI Koç
| Sorun | Detay |
|---|---|
| ⚠️ Çalışıyordu ama | API key client'a sızdırılabilirdi (`.env` versiyon kontrolünde) |
| ⚠️ Mock fallback yoktu | Anahtar yoksa hiç çalışmıyor |
| ⚠️ Prompt'a konu detayı geçilmiyor | "Top 3 yanlış" değil "1 konu" gidiyor |

### F. Kod Kalitesi & UX
| Sorun | Detay |
|---|---|
| ❌ `next.config.ts` boş | Production ayarları yok |
| ❌ Dashboard duplicate var | `src/app/dashboard/page.tsx` + `src/app/lib/dashboard/page.tsx` aynı içerikle iki yerde |
| ❌ MetricCard.tsx boş | Component import edilmiyor ama dosya duruyor |
| ❌ README placeholder | Default `create-next-app` README |
| ❌ Loading/Empty states yok | Yeni kullanıcı için hiçbir yönlendirme yok |
| ❌ Mobile sidebar yok | `hidden lg:flex` bile değil, tüm ekranlarda görünüyor |

---

## 2. Bu sürümde yapılan değişiklikler

### Yeniden yazılan / yeni eklenen dosyalar

#### Schema & Tipler
- `supabase/migrations/0001_init.sql` — 6 tablo + 3 view + index'ler (139 satır)
- `src/types/yks.ts` — TYT (4 ders) + AYT (alana göre dinamik) konu listesi, 190 satır

#### Persistence
- `src/lib/supabase-client.ts` — browser client
- `src/lib/supabase-admin.ts` — server-only service role
- `src/lib/local-store.ts` — offline fallback (her tablo için aynı şekil)
- `src/context/AppContext.tsx` — student + exams + scores + analytics + targetUni/program tek yerden

#### Analytics motoru (sıfırdan yazıldı)
- `src/lib/analytics.ts` — 196 satır
  - `weightedNet()`: üstel ağırlıklı son denemeler ortalaması
  - `estimateYksScore()`: 100-500 ölçeği, kalibre
  - `scoreToRanking()`: 2024 ÖSYM dağılım tablosundan lineer interpolasyon
  - `admissionProbability()`: sigmoid eğri (yumuşak, üst/alt sınırda doygunluk)
  - `rankWeakTopics()`: KRİTİK/YÜKSEK/ORTA/DÜŞÜK severity hesabı

#### Sayfalar
- `/onboarding` — 3 adımlı şifresiz kayıt (isim → alan → uni → bölüm + sıralama)
- `/add-exam` — TYT/AYT tab, ders tablosu, konu form'u (önem 1-10)
- `/dashboard` — tamamen live data, empty-state, AI coach inline
- `/heatmap` — severity-renkli kartlar, ağırlıklı skor
- `/prediction` — "ne olursa ne olur" senaryoları (+3, +5, +8 net)
- `/progress` — kronolojik trend + ders bazlı bar chart
- `/study-plan` — dedicated AI plan sayfası

#### API
- `/api/universities` — list, by-kod, by-program-id, by-okulKod (alan filtresi ile)
- `/api/coach` — Gemini AI + mock fallback
- `/api/exams` — server-side full payload (SSR)
- `/api/students` — server-side upsert

#### Veri
- `src/data/universities.json` — 192 üniversite + 10.657 lisans bölümü (puan türü, taban sıralama, taban puan, fakülte) — [hdd42/universite_bolum_listesi](https://github.com/hdd42/universite_bolum_listesi) repo'sundan çıkarıldı, YGS-LYS → YKS modern puan türlerine map'lendi

#### Script
- `scripts/seed-universities.ts` — Supabase'e batch upsert (200/500 kayıt chunks)

#### Yapılandırma
- `package.json` — Next 15, React 19, Supabase, Gemini REST API, Recharts, Lucide
- `.env.example` — tüm gerekli değişkenlerle
- `.gitignore` — `.env*`, `.next`, `node_modules`
- `tsconfig.json` — modern target, strict, alias `@/*`

---

## 3. Mimari kararlar (neden böyle?)

### Neden Supabase + LocalStorage çift katman?
- Jüri makinesinde Supabase açmadan da uygulama çalışmalı — LocalStorage fallback ile demo her zaman yürür.
- Gerçek kullanım için Supabase açıldığında tüm veri buluta yazılır, RLS açılıp multi-tenant'a geçilebilir.

### Neden universities.json bundled?
- 2 MB JSON, ilk yüklemede hızlı (Vercel edge cache).
- Offline çalışmayı garanti eder.
- Supabase'e seed ile yüklenebilir — orada filter/sort/search SQL'le çok daha hızlı (production için tercih).

### Neden sigmoid olasılık?
- Lineer formül "-5 net altı = %5" gibi kesik sonuçlar veriyordu.
- Sigmoid yumuşak: 0-100 aralığında doğal doygunluk, hedef yakınlığında hassas.
- Spread parametresi hedef sıralamaya göre ölçekleniyor → Tıp (rank ~3k) ve daha az popüler bölüm (rank ~200k) için ayrı ayrı mantıklı.

### Neden 3-step onboarding?
- Tek formda 5 alan zorlayıcı, kullanıcı yarıda bırakır.
- Adım adım progress bar + auto-focus = profesyonel görünüm.
- Üniversite seçilmese bile devam edebilir (opsiyonel) — esneklik.

---

## 4. Yarışma için "kazandırıcı" detaylar

1. **Empty-state CTA** — "İlk denemeni ekle" → jüriye yeni kullanıcı akışı net.
2. **AI mock fallback** — Demo sırasında internet kopsa bile AI kart cevap döner (placeholder ama gerçek yapıdadır).
3. **Senaryo simülasyonu** — "+3 net çalışırsam %45 → %72'ye çıkar" jüriyi etkileyen interaktif feature.
4. **Custom scrollbar + animation** — küçük detaylar ama "polishing" puanı taşır.
5. **Markdown-rendered AI yanıtı** — `### başlık` ve `- liste`ler düzgün render edilir.
6. **Severity badge'ler** — tek bakışta hangi konu acil belli.
7. **Live trend hesabı** — son deneme vs. eski ortalama = up/down ikonu.

---

## 5. Production öncesi yapılması gerekenler

| Durum | Görev |
|---|---|
| 🟡 | RLS politikaları aktive etmek (production'da multi-user) |
| 🟡 | Supabase auth ile telegram/email magic-link login |
| 🟡 | Taban sıralama verisini her yıl güncel yokatlas API'sinden çekmek |
| 🟡 | AI prompt'una hata kitabı (history) bağlama (multi-week memory) |
| 🟢 | Tüm temel akış demo-ready, jüri için hazır |

---

**Sonuç:** Önceki versiyon konsept doğrulamasıydı (proof of concept). Bu sürüm **demo edilebilir, deploy edilebilir, satılabilir bir MVP**.
