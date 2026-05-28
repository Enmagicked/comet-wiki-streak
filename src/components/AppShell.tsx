"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stars } from "./Stars";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/read",      label: "Read" },
  { href: "/commute",   label: "Commute" },
  { href: "/settings",  label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-midnight)_0%,_var(--color-night)_80%)]" />
        <div className="absolute inset-0 opacity-60"><Stars density={100} /></div>
      </div>
      <header className="border-b border-cloud-deep/20 backdrop-blur-md bg-night/50 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-lg tracking-tight">wiki streak</Link>
          <nav className="flex items-center gap-1">
            {tabs.map((t) => {
              const active = path === t.href || path.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href} href={t.href}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${active ? "bg-star/10 text-star" : "text-cloud-deep hover:text-cloud"}`}
                >
                  {t.label}
                </Link>
              );
            })}
            <button onClick={signOut} className="ml-2 text-xs text-cloud-deep hover:text-cloud px-3 py-1.5">sign out</button>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
