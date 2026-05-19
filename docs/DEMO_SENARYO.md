# YKS AI Coach — Demo Sunum Senaryosu

> 3-5 dakikalık jüri sunumu için ekran akışı. Pitch deck slaytlarıyla senkron.

---

## 0. Hazırlık (sunum öncesi 30 sn)

- `npm run dev` çalışıyor olsun
- Tarayıcı `localhost:3000` açık, **incognito** (state temiz)
- Mikrofon test, ekran paylaşımı tarayıcı sekmesinde
- Jüri ekranını `1920×1080` zoom %110

---

## 1. Açılış (15 sn)

> "Merhaba, biz **YKS AI Coach** ekibi. Türkiye'de her yıl **3 milyon öğrenci** YKS'ye giriyor. Her birinin elinde defter dolusu deneme sonucu var ama **kimsenin elinde 'sen şu hafta bunu çalış' diyen bir akıllı asistan yok**. Biz onu yaptık."

**Ekran:** İncognito tarayıcı → `localhost:3000` → 600ms splash → onboarding'e yönlendirme.

---

## 2. Onboarding — 3 adım, şifresiz (35 sn)

> "Şifre yok. İsmini söyle, alanını seç, hedef üniversiteni gir — bitti."

### Adım 1: İsim + Alan
**Yap:**
- İsim: `Ayşe Kara`
- Alan: `Sayısal` seç

> "Alana göre AYT ders listemiz **dinamik** değişiyor. Sözel seçen Felsefe-Tarih-Coğrafya görüyor, biz Matematik-Fizik-Kimya-Biyoloji görüyoruz."

### Adım 2: Hedef Üniversite
**Yap:** Arama kutusuna `Orta` yaz → `Orta Doğu Teknik Üniversitesi` seç.

> "GitHub açık kaynak [hdd42/universite_bolum_listesi] reposundan **192 üniversite, 10.657 lisans bölümü** çektik."

### Adım 3: Hedef Bölüm + Sıralama
**Yap:** Arama kutusuna `Bilgisayar` yaz → `Bilgisayar Mühendisliği` seç → taban sıralama `4500` otomatik dolar → "Panele Git"

> "Bölümü seçince taban sıralama 2024 verisiyle otomatik gelir, istersen değiştir."

---

## 3. Empty Dashboard (10 sn)

> "İlk girişte boş bir panel görüyor. Çünkü daha veri yok."

**Ekran:** Dashboard empty state → "İlk Deneme Sonucunu Ekle" butonu.

**Yap:** Butona tıkla.

---

## 4. Deneme Ekleme — TYT/AYT (50 sn)

> "İşte burası farkımız. **TYT ve AYT ayrı sekmeler** — gerçek YKS hazırlığı böyle çalışır."

**Ekran:** TYT tab default seçili.

### TYT denemesi gir
**Yap:**
- Deneme adı: `Özdebir TYT Türkiye Geneli 4`
- Türkçe: 32 doğru, 6 yanlış, 2 boş
- Sosyal: 14 doğru, 4 yanlış, 2 boş
- Temel Matematik: 25 doğru, 12 yanlış, 3 boş
- Fen: 10 doğru, 8 yanlış, 2 boş

> "Sağ üstte **Toplam Net** anlık güncelleniyor. 0.25 yanlış cezası ÖSYM formülüyle aynı."

### Konu bazlı yanlış ekle
> "Şimdi kritik kısım. Sadece 'matematik kötü' değil — **hangi konu, kaç tane, ne kadar önemli**."

**Yap:**
- Ders: Temel Matematik → Konu: Problemler → 5 yanlış, önem 9
- Ders: Türkçe → Konu: Paragrafta Anlam → 3 yanlış, önem 8
- Ders: Fen → Konu: Fizik - Optik → 2 yanlış, önem 7

> "Önem skoru YKS'de o konunun **kaç soru gelme ortalamasıdır**. AI bu skoru kullanarak ağırlıklı hata hesabı yapıyor."

**Yap:** "Denemeyi Kaydet" → Dashboard'a yönlendirme.

---

## 5. Live Dashboard (60 sn)

> "Veri girer girmez **algoritma motoru çalıştı**."

**Göster (üst kartlar):**
- Son Deneme Neti: ~73 net
- Hedef Program: ODTÜ Bilgisayar Mühendisliği
- Kazanma İhtimali: %48
- AI YKS Puanı: ~440

> "%48 düşük çünkü tek deneme. AI'ya 6 deneme verirsek bu çok netleşecek."

**Göster (alt kartlar):**
- Net Gelişim Trendi grafiği
- Ders dağılımı: Matematik en zayıf → progress bar kırmızıya yakın

**Göster (Kritik Konular kartı):**
- Problemler — KRİTİK badge (skor 45)
- Paragrafta Anlam — KRİTİK badge (skor 24)
- Fizik-Optik — YÜKSEK badge (skor 14)

> "Severity'ler ağırlıklı skora göre otomatik."

### AI Koç tetikleme
**Yap:** "AI Koçluk Stratejisi Üret" butonuna bas.

> "Şimdi yapay zeka tüm bu veriyi alıp **Gemini AI**'ya göndererek sana özel haftalık plan üretiyor."

**Beklenti:** 4-6 saniyede markdown başlıklı plan akar:
- ÖZET
- ZAYIF ALANLAR
- EYLEM PLANI
- HAFTALIK PROGRAM (Pazartesi-Pazar gün gün)

> "Klişe değil — adı geçen Ayşe'nin spesifik Problemler ve Paragraf hatalarına atıf yapıyor."

---

## 6. Senaryo Simülasyonu (25 sn)

**Yap:** Sol menüden "Hedef Tahmini" sayfasına geç.

> "Şu kart bence en yıkıcı feature. Şu anki olasılık %48. Eğer **+3 net çalışırsam %62, +5 net %75, +8 net %88**."

**Göster:** 4 kart yan yana, mevcut vs. +3 vs. +5 vs. +8.

> "Aday tam olarak ne kadar çalışması gerektiğini sayısal görüyor. Motivasyon = somut hedef."

---

## 7. Isı Haritası (15 sn)

**Yap:** Sol menüden "Isı Haritası" sayfasına geç.

> "Tüm denemelerin birikimi. Her konu severity rengiyle. Kırmızılar = bu hafta dokunulacak."

---

## 8. Teknoloji & Kapanış (40 sn)

> "Teknoloji stack'imiz:
> - **Next.js 15 + React 19** — App Router, Server Actions
> - **Supabase Postgres** — 6 tablo + 3 view + RLS hazır
> - **Gemini AI** — AI koç
> - **Recharts + Tailwind v4** — UI
> - **192 üniversite verisi** — açık kaynaktan çekilmiş, modern YKS puan türlerine map'lenmiş
>
> Tüm kod GitHub'da, MIT lisanslı. Bir öğrenci kendi bilgisayarında 60 saniyede çalıştırabilir.
>
> 3 milyon adaya hizmet edebilecek altyapı, bir hafta sonu içinde MVP."

> "Sorularınız?"

---

## Yedek senaryo: AI down olursa

API çağrısı 500 dönerse:
- Mesajın altında **otomatik fallback** mock plan görünür ("GEMINI_API_KEY ayarlı değil, demo amaçlı kalıplanmış halidir").
- Jürinin bunu görmemesi için demo öncesi `.env.local` test et.

## Yedek senaryo: Yavaş ağ

- AI cevabı geç geliyorsa `Yapay zeka analiz ediyor…` spinner zaten 5+ saniye dayanır.
- 10sn üstü → "Önceden ürettiğimiz bir örneği göstereyim" diyerek `/study-plan` sayfasındaki cached plana geç.

---

**Toplam sunum:** ~4 dakika anlatım + 1 dakika Q&A buffer.
