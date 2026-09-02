import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createReseller, listResellers, updateReseller } from "@/lib/resellers.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/revendedores")({
  head: () => ({
    meta: [
      { title: "Revendedores | MAC Manager" },
      { name: "description", content: "Gerencie contas de revendedores e suas permissões." },
      { property: "og:title", content: "Revendedores | MAC Manager" },
      { property: "og:description", content: "Gerencie contas de revendedores e suas permissões." },
    ],
  }),
  component: Resellers,
});

function Resellers() {
  const queryClient = useQueryClient();
  const list = useServerFn(listResellers);
  const create = useServerFn(createReseller);
  const update = useServerFn(updateReseller);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", can: false });

  const { data: resellers = [] } = useQuery({
    queryKey: ["resellers"],
    queryFn: () => list({ data: undefined }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          name: form.name,
          email: form.email,
          password: form.password,
          canCreateResellers: form.can,
        },
      }),
    onSuccess: () => {
      toast.success("Revendedor criado");
      setOpen(false);
      setForm({ name: "", email: "", password: "", can: false });
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (input: { resellerId: string; canCreateResellers?: boolean; isBlocked?: boolean }) =>
      update({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resellers"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Revendedores</h1>
          <p className="text-sm text-muted-foreground">
            Crie contas de acesso e defina permissões dos seus parceiros.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Novo revendedor
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card p-5">
        {resellers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum revendedor cadastrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">E-mail</th>
                <th className="pb-3 font-medium">MACs</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Pode criar revendedores</th>
                <th className="pb-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="py-3 text-foreground">{r.name}</td>
                  <td className="py-3 text-muted-foreground">{r.email}</td>
                  <td className="py-3 text-muted-foreground">{r.devices}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        r.is_blocked
                          ? "bg-destructive/15 text-destructive"
                          : "bg-success/15 text-success",
                      )}
                    >
                      {r.is_blocked ? "Bloqueado" : "Ativo"}
                    </span>
                  </td>
                  <td className="py-3">
                    <Switch
                      checked={r.can_create_resellers}
                      onCheckedChange={(v) =>
                        updateMut.mutate({ resellerId: r.id, canCreateResellers: v })
                      }
                    />
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateMut.mutate({ resellerId: r.id, isBlocked: !r.is_blocked })}
                    >
                      {r.is_blocked ? (
                        <>
                          <CheckCircle2 className="size-4" /> Reativar
                        </>
                      ) : (
                        <>
                          <Ban className="size-4" /> Bloquear
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo revendedor</DialogTitle>
            <DialogDescription>
              Crie o login e a senha de acesso do parceiro.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-email">E-mail</Label>
              <Input
                id="r-email"
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-pass">Senha</Label>
              <Input
                id="r-pass"
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
              <Label htmlFor="r-can">Pode criar revendedores</Label>
              <Switch
                id="r-can"
                checked={form.can}
                onCheckedChange={(v) => setForm({ ...form, can: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
