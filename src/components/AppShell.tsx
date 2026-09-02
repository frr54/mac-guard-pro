import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Radio, LogOut, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GlobalSupport } from "@/components/GlobalSupport";
import type { ReactNode } from "react";

type Props = { children: ReactNode; canSeeResellers: boolean; isMaster?: boolean };

export function AppShell({ children, canSeeResellers, isMaster = false }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/dispositivos", label: "Dispositivos" },
    ...(canSeeResellers ? [{ to: "/revendedores", label: "Revendedores" }] : []),
    ...(isMaster ? [{ to: "/configuracoes", label: "Configurações" }] : []),
  ];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary">
              <Radio className="size-5 text-primary-foreground" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">MAC Manager</span>
              <span className="block text-xs text-muted-foreground">Ativação IPTV</span>
            </span>
          </div>

          <nav className="ml-auto flex items-center gap-1 rounded-full border border-border/70 bg-card p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  pathname === tab.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.to === "/configuracoes" && <Settings className="mr-1.5 inline-block size-3.5" />}
                {tab.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </header>

      <GlobalSupport />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
