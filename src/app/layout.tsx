import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "YKS AI Coach — Verilerle Geleceğini İnşa Et",
  description: "Yapay zeka destekli kişiselleştirilmiş YKS hazırlık asistanı. Deneme analizi, zayıf konu tespiti, AI çalışma planı.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased bg-background text-foreground">
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-6 lg:p-10 min-w-0 overflow-x-hidden">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
