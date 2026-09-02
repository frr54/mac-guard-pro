import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type PublicSettings = {
  support: { whatsapp: string; message: string };
  global_notice: { active: boolean; text: string; image_url: string };
};

export function GlobalSupport() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PublicSettings | null) => {
        if (!cancelled && data) setSettings(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const supportNumber = settings?.support.whatsapp?.replace(/\D/g, "") ?? "";
  const supportMessage = settings?.support.message ?? "Olá, preciso de suporte com meu acesso.";
  const notice = settings?.global_notice;
  const showNotice = !!notice?.active && noticeOpen && !!(notice.text || notice.image_url);

  function openWhatsApp() {
    if (!supportNumber) return;
    const url = `https://wa.me/${supportNumber}?text=${encodeURIComponent(supportMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {showNotice && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-lg shadow-primary/5">
            <button onClick={() => setNoticeOpen(false)} className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur transition hover:text-foreground" aria-label="Fechar aviso">
              <X className="size-4" />
            </button>
            {notice.image_url && <img src={notice.image_url} alt="Aviso global" className="max-h-80 w-full object-cover" />}
            {notice.text && <div className="px-5 py-4 text-sm font-medium text-foreground whitespace-pre-wrap">{notice.text}</div>}
          </div>
        </div>
      )}
      {supportNumber && (
        <Button onClick={openWhatsApp} size="icon" className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-500/20 hover:bg-[#20bd5a]" aria-label="Suporte via WhatsApp">
          <MessageCircle className="size-7" />
        </Button>
      )}
    </>
  );
}
