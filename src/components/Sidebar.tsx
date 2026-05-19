"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard, PlusCircle, Flame, GraduationCap, BarChart3,
  Sparkles, LogOut,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { student, logout } = useApp();
  if (pathname === "/" || pathname === "/onboarding" || !student) return null;

  const links = [
    { name: "Özet Panel", href: "/dashboard", icon: LayoutDashboard },
    { name: "Deneme Ekle", href: "/add-exam", icon: PlusCircle },
    { name: "Isı Haritası", href: "/heatmap", icon: Flame },
    { name: "Hedef Tahmini", href: "/prediction", icon: GraduationCap },
    { name: "Detaylı Grafikler", href: "/progress", icon: BarChart3 },
    { name: "Akıllı Plan", href: "/study-plan", icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-card border-r border-zinc-800 h-screen fixed left-0 top-0 p-6 hidden lg:flex flex-col justify-between z-30">
      <div className="space-y-8">
        <div className="flex items-center gap-2 px-2">
          <div className="h-3 w-3 rounded-full bg-purpleCustom animate-pulse" />
          <span className="font-bold text-lg tracking-wider text-purpleCustom-light">YKS AI COACH</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5">
          <div className="text-xs text-zinc-500">Aktif kullanıcı</div>
          <div className="text-sm font-semibold text-zinc-100 truncate">{student.full_name}</div>
          <div className="text-[10px] text-purpleCustom-light/80 tracking-wider mt-0.5">{student.alan} Alanı</div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-purpleCustom/15 text-purpleCustom-light border border-purpleCustom/30"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
      >
        <LogOut className="h-4 w-4" /> Çıkış Yap
      </button>
    </aside>
  );
}
