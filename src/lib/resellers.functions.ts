import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  name: z.string().trim().min(1).max(100),
  canCreateResellers: z.boolean().default(false),
});

async function assertCanCreate(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("can_create_resellers", { _user_id: userId });
  if (error || !data) throw new Error("Forbidden");
}

export const createReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertCanCreate(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, created_by: context.userId },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar revendedor");

    await supabaseAdmin
      .from("profiles")
      .update({
        name: data.name,
        created_by: context.userId,
        can_create_resellers: data.canCreateResellers,
      })
      .eq("id", created.user.id);

    return { ok: true, id: created.user.id };
  });

const updateSchema = z.object({
  resellerId: z.string().uuid(),
  canCreateResellers: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
});

export const updateReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertCanCreate(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: isMaster } = await context.supabase.rpc("is_master", {
      _user_id: context.userId,
    });
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("id, created_by")
      .eq("id", data.resellerId)
      .maybeSingle();
    if (!target) throw new Error("Revendedor não encontrado");
    if (!isMaster && target.created_by !== context.userId) throw new Error("Forbidden");

    const patch: Record<string, boolean> = {};
    if (data.canCreateResellers !== undefined)
      patch['can_create_resellers'] = data.canCreateResellers;
    if (data.isBlocked !== undefined) patch['is_blocked'] = data.isBlocked;

    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(patch)
        .eq("id", data.resellerId);
      if (error) throw new Error(error.message);
    }

    if (data.isBlocked !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(data.resellerId, {
        ban_duration: data.isBlocked ? "876000h" : "none",
      });
    }

    return { ok: true };
  });

export const listResellers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCanCreate(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isMaster } = await context.supabase.rpc("is_master", {
      _user_id: context.userId,
    });

    let query = supabaseAdmin
      .from("profiles")
      .select("id, name, email, can_create_resellers, is_blocked, created_at")
      .order("created_at", { ascending: false });
    if (!isMaster) query = query.eq("created_by", context.userId);

    const { data: profiles, error } = await query;
    if (error) throw new Error(error.message);

    const { data: devices } = await supabaseAdmin.from("devices").select("user_id");
    const counts = new Map<string, number>();
    for (const d of devices ?? []) counts.set(d.user_id, (counts.get(d.user_id) ?? 0) + 1);

    return (profiles ?? [])
      .filter((p) => p.email.toLowerCase() !== "retaseu080@gmail.com")
      .map((p) => ({ ...p, devices: counts.get(p.id) ?? 0 }));
  });
