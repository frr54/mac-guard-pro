import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/settings")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("system_settings")
          .select("support_whatsapp, support_message, global_notice_text, global_notice_image_url, global_notice_active")
          .limit(1)
          .maybeSingle();

        if (error) {
          return Response.json(
            {
              support: { whatsapp: "", message: "Olá, preciso de suporte com meu acesso." },
              global_notice: { active: false, text: "", image_url: "" },
            },
            { status: 200 },
          );
        }

        return Response.json({
          support: {
            whatsapp: data?.support_whatsapp ?? "",
            message: data?.support_message ?? "Olá, preciso de suporte com meu acesso.",
          },
          global_notice: {
            active: data?.global_notice_active ?? false,
            text: data?.global_notice_text ?? "",
            image_url: data?.global_notice_image_url ?? "",
          },
        });
      },
    },
  },
});
