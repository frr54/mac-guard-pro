import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HardDrive, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, isExpired } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | MAC Manager" },
      { name: "description", content: "Resumo das ativações IPTV: dispositivos ativos, inativos e expirados." },
      { property: "og:title", content: "Dashboard | MAC Manager" },
      { property: "og:description", content: "Resumo das ativações IPTV por MAC address." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const expired = devices.filter((d) => isExpired(d.expires_at)).length;
  const active = devices.filter((d) => d.status === "active" && !isExpired(d.expires_at)).length;
  const inactive = devices.filter((d) => d.status === "inactive").length;

  const cards = [
    { label: "Total de dispositivos", value: devices.length, Icon: HardDrive, color: "text-muted-foreground" },
    { label: "Ativos", value: active, Icon: CheckCircle2, color: "text-success" },
    { label: "Inativos", value: inactive, Icon: XCircle, color: "text-muted-foreground" },
    { label: "Expirados", value: expired, Icon: Clock, color: "text-warning" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral das suas ativações.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="flex items-start justify-between rounded-2xl border border-border/70 bg-card p-5"
          >
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
            </div>
            <Icon className={cn("size-5", color)} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Últimos cadastros</h2>
          <Link to="/dispositivos" className="text-sm text-primary hover:underline">
            Ver todos →
          </Link>
        </div>

        {devices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum dispositivo cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-medium">MAC</th>
                  <th className="pb-3 font-medium">Usuário</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Validade</th>
                </tr>
              </thead>
              <tbody>
                {devices.slice(0, 5).map((d) => (
                  <tr key={d.id} className="border-t border-border/60">
                    <td className="py-3 font-mono text-foreground">{d.mac}</td>
                    <td className="py-3 text-muted-foreground">{d.username}</td>
                    <td className="py-3">
                      <StatusBadge active={d.status === "active" && !isExpired(d.expires_at)} />
                    </td>
                    <td className="py-3 text-muted-foreground">{formatDate(d.expires_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
