import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mac = (url.searchParams.get("mac") ?? "").trim();

        const fail = () =>
          Response.json(
            { status: "error", message: "Dispositivo inativo ou não cadastrado" },
            { status: 200 },
          );

        if (!mac || mac.length > 64) return fail();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("devices")
          .select("server_url, username, password, user_agent, validity_days, status, expires_at")
          .ilike("mac", mac)
          .maybeSingle();

        if (error || !data) return fail();
        if (data.status !== "active") return fail();
        if (new Date(data.expires_at).getTime() < Date.now()) return fail();

        return Response.json({
          status: "success",
          server: data.server_url,
          username: data.username,
          password: data.password,
          user_agent: data.user_agent,
          validity_days: data.validity_days,
        });
      },
    },
  },
});
