import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MASTER_EMAIL = "retaseu080@gmail.com";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export type Access = {
  userId: string | null;
  email: string | null;
  isMaster: boolean;
  canCreateResellers: boolean;
  name: string;
};

export function useAccess() {
  const { session, loading } = useSession();
  const userId = session?.user.id ?? null;
  const email = session?.user.email ?? null;

  const query = useQuery({
    queryKey: ["access", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Access> => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, can_create_resellers")
        .eq("id", userId!)
        .maybeSingle();
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);

      const isMaster =
        email?.toLowerCase() === MASTER_EMAIL ||
        (roles ?? []).some((r) => r.role === "master");

      return {
        userId,
        email,
        isMaster,
        canCreateResellers: isMaster || !!profile?.can_create_resellers,
        name: profile?.name ?? email?.split("@")[0] ?? "",
      };
    },
  });

  return { access: query.data ?? null, loading: loading || query.isLoading, session };
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function isExpired(value: string) {
  return new Date(value).getTime() < Date.now();
}
