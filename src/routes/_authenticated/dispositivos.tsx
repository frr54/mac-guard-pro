import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Plus, ClipboardCopy, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, isExpired, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/dispositivos")({
  head: () => ({
    meta: [
      { title: "Dispositivos | MAC Manager" },
      {
        name: "description",
        content: "Gerencie ativações por MAC address e credenciais Xtream.",
      },
      { property: "og:title", content: "Dispositivos | MAC Manager" },
      {
        property: "og:description",
        content: "Gerencie ativações por MAC address e credenciais Xtream.",
      },
    ],
  }),
  component: Devices,
});

const DEFAULT_FORM = {
  mac: "",
  server_url: "http://jogar.nexusppmaster.eu:80",
  username: "",
  password: "",
  user_agent: "IPTVSmarters",
  validity_days: 30,
  status: "active" as "active" | "inactive",
};

function Devices() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return devices.filter((d) => {
      const matchTerm =
        !term || d.mac.toLowerCase().includes(term) || d.username.toLowerCase().includes(term);
      const matchFilter = filter === "all" || d.status === filter;
      return matchTerm && matchFilter;
    });
  }, [devices, search, filter]);

  const createDevice = useMutation({
    mutationFn: async () => {
      const userId = session?.user.id;
      if (!userId) throw new Error("Sessão expirada");
      const days = Number(form.validity_days) || 30;
      const expires = new Date(Date.now() + days * 86400000).toISOString();
      const { error } = await supabase.from("devices").insert({
        user_id: userId,
        mac: form.mac.trim().toUpperCase(),
        server_url: form.server_url.trim(),
        username: form.username.trim(),
        password: form.password,
        user_agent: form.user_agent.trim(),
        validity_days: days,
        expires_at: expires,
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dispositivo cadastrado");
      setOpen(false);
      setForm(DEFAULT_FORM);
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async (device: { id: string; status: string }) => {
      const { error } = await supabase
        .from("devices")
        .update({ status: device.status === "active" ? "inactive" : "active" })
        .eq("id", device.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dispositivo removido");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function copyData(d: (typeof devices)[number]) {
    const text = `📱 Seus Dados de Acesso - RFlow Cine
━━━━━━━━━━━━━━━━━━━━━━
MAC: ${d.mac}
Usuário: ${d.username}
Senha: ${d.password}
Servidor: ${d.server_url}
Validade: ${formatDate(d.expires_at)}
━━━━━━━━━━━━━━━━━━━━━━
Status: ${d.status === "active" && !isExpired(d.expires_at) ? "Ativo ✅" : "Inativo ❌"}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Dados copiados para o WhatsApp");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const filters = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
    { key: "inactive", label: "Inativos" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dispositivos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie ativações por MAC address e credenciais Xtream.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Novo dispositivo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por MAC ou usuário..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card p-5">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum dispositivo encontrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-medium">MAC</th>
                <th className="pb-3 font-medium">Servidor</th>
                <th className="pb-3 font-medium">Usuário</th>
                <th className="pb-3 font-medium">Senha</th>
                <th className="pb-3 font-medium">Validade</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t border-border/60">
                  <td className="py-3 font-mono text-foreground">{d.mac}</td>
                  <td className="max-w-52 truncate py-3 text-muted-foreground">{d.server_url}</td>
                  <td className="py-3 text-muted-foreground">{d.username}</td>
                  <td className="py-3 text-muted-foreground">{d.password}</td>
                  <td className="py-3 text-muted-foreground">{formatDate(d.expires_at)}</td>
                  <td className="py-3">
                    <StatusBadge active={d.status === "active" && !isExpired(d.expires_at)} />
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Copiar dados" onClick={() => copyData(d)}>
                        <ClipboardCopy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ativar/Desativar"
                        onClick={() => toggleStatus.mutate(d)}
                      >
                        <Power className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remover"
                        onClick={() => removeDevice.mutate(d.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo dispositivo</DialogTitle>
            <DialogDescription>
              Informe o MAC e as credenciais Xtream utilizadas na ativação.
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              createDevice.mutate();
            }}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mac">MAC Address</Label>
              <Input
                id="mac"
                required
                maxLength={64}
                placeholder="00:1A:79:XX:XX:XX"
                value={form.mac}
                onChange={(e) => setForm({ ...form, mac: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="server">URL do Servidor</Label>
              <Input
                id="server"
                required
                maxLength={255}
                value={form.server_url}
                onChange={(e) => setForm({ ...form, server_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                required
                maxLength={120}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                required
                maxLength={120}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ua">User Agent</Label>
              <Input
                id="ua"
                maxLength={120}
                value={form.user_agent}
                onChange={(e) => setForm({ ...form, user_agent: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="days">Dias de validade</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={3650}
                value={form.validity_days}
                onChange={(e) => setForm({ ...form, validity_days: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Status inicial</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createDevice.isPending}>
                {createDevice.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
