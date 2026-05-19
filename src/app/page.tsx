"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  const { student } = useApp();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(student ? "/dashboard" : "/onboarding");
    }, 600);
    return () => clearTimeout(t);
  }, [student, router]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="h-10 w-10 text-purpleCustom-light animate-pulse" />
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-purpleCustom bg-clip-text text-transparent">
          YKS AI Coach
        </h1>
      </div>
      <p className="text-zinc-400">Yapay zeka motoru başlatılıyor…</p>
    </div>
  );
}
