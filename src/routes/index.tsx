import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "MAC Manager | Ativação IPTV por MAC" },
      {
        name: "description",
        content:
          "Painel para ativar e gerenciar dispositivos IPTV por MAC address com credenciais Xtream.",
      },
      { property: "og:title", content: "MAC Manager | Ativação IPTV por MAC" },
      {
        property: "og:description",
        content: "Gerencie ativações por MAC address e credenciais Xtream em um só painel.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/dashboard" : "/auth", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary">
          <Radio className="size-5 text-primary-foreground" />
        </span>
        <h1 className="text-sm font-medium">MAC Manager — carregando…</h1>
      </div>
    </div>
  );
}
