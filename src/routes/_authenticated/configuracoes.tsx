import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImagePlus, MessageCircle, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/configuracoes")({ component: SettingsPage });

type Settings = {
  id: string;
  support_whatsapp: string;
  support_message: string;
  global_notice_text: string;
  global_notice_image_url: string;
  global_notice_active: boolean;
};

function SettingsPage() {
  const { access, loading: accessLoading } = useAccess();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("Olá, preciso de suporte com meu acesso.");
  const [noticeText, setNoticeText] = useState("");
  const [noticeImageUrl, setNoticeImageUrl] = useState("");
  const [noticePreview, setNoticePreview] = useState("");
  const [noticeActive, setNoticeActive] = useState(false);
  const [savingSupport, setSavingSupport] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!access?.isMaster) return;
    void loadSettings();
  }, [access?.isMaster]);

  async function loadSettings() {
    const { data, error } = await supabase.from("system_settings").select("*").limit(1).maybeSingle();
    if (error) {
      toast.error("Não foi possível carregar as configurações.");
      return;
    }
    if (!data) return;
    const row = data as Settings;
    setSettings(row);
    setWhatsapp(row.support_whatsapp ?? "");
    setMessage(row.support_message ?? "Olá, preciso de suporte com meu acesso.");
    setNoticeText(row.global_notice_text ?? "");
    setNoticeImageUrl(row.global_notice_image_url ?? "");
    setNoticeActive(!!row.global_notice_active);
  }

  async function saveSupport() {
    if (!settings) return;
    setSavingSupport(true);
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const { error } = await supabase.from("system_settings").update({ support_whatsapp: cleanWhatsapp, support_message: message.trim() }).eq("id", settings.id);
    setSavingSupport(false);
    if (error) {
      toast.error("Erro ao salvar o suporte.");
      return;
    }
    setWhatsapp(cleanWhatsapp);
    toast.success("Suporte via WhatsApp salvo com sucesso.");
  }

  async function uploadNoticeImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `global/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("notices").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error("Falha no upload da imagem.");
      return;
    }
    setNoticeImageUrl(path);
    await refreshPreview(path);
    setUploading(false);
    toast.success("Imagem carregada. Clique em Publicar Aviso Geral para salvar.");
  }

  async function publishNotice() {
    if (!settings) return;
    setPublishing(true);
    const { error } = await supabase.from("system_settings").update({ global_notice_text: noticeText.trim(), global_notice_image_url: noticeImageUrl, global_notice_active: noticeActive }).eq("id", settings.id);
    setPublishing(false);
    if (error) {
      toast.error("Erro ao publicar o aviso geral.");
      return;
    }
    toast.success(noticeActive ? "Aviso geral publicado." : "Aviso geral desativado.");
  }

  if (accessLoading) return <div className="py-12 text-center text-muted-foreground">Carregando…</div>;
  if (!access?.isMaster) return <div className="py-12 text-center text-sm text-muted-foreground">Acesso restrito ao Master Admin.</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Configurações</p>
        <h1 className="text-3xl font-bold tracking-tight">Avisos Globais</h1>
        <p className="mt-1 text-muted-foreground">Controle o suporte e os comunicados exibidos em todo o painel.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="size-5 text-emerald-400" /> Suporte via WhatsApp</CardTitle>
          <CardDescription>O botão flutuante usa estes dados para abrir uma conversa de suporte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="support-whatsapp">WhatsApp de Suporte</Label>
            <Input id="support-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999999999" inputMode="numeric" />
            <p className="text-xs text-muted-foreground">Informe somente o número com DDD e código do país, sem +, espaços ou símbolos.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-message">Mensagem Padrão</Label>
            <Textarea id="support-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>
          <Button onClick={saveSupport} disabled={savingSupport}><Save className="mr-2 size-4" />{savingSupport ? "Salvando…" : "Salvar Suporte"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImagePlus className="size-5 text-primary" /> Comunicados Globais</CardTitle>
          <CardDescription>Publique uma mensagem e uma imagem para todos os revendedores logados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-4">
            <div><p className="font-medium">Ativar Aviso Global</p><p className="text-xs text-muted-foreground">Exibe o comunicado no topo do painel.</p></div>
            <Switch checked={noticeActive} onCheckedChange={setNoticeActive} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notice-text">Texto do Comunicado</Label>
            <Textarea id="notice-text" value={noticeText} onChange={(e) => setNoticeText(e.target.value)} rows={5} placeholder="Manutenção programada às 23:00." />
          </div>
          <div className="space-y-3">
            <Label>Imagem do Aviso</Label>
            <label
              className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition ${dragging ? "border-primary bg-primary/10" : "border-border/80 bg-muted/10 hover:border-primary/60 hover:bg-muted/20"}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) void uploadNoticeImage(file); }}
            >
              <Upload className="size-7 text-muted-foreground" />
              <span className="text-sm font-medium">Arraste ou selecione uma imagem</span>
              <span className="text-xs text-muted-foreground">PNG, JPG, WEBP · máximo 5 MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void uploadNoticeImage(e.target.files[0])} disabled={uploading} />
            </label>
            {uploading && <p className="text-xs text-muted-foreground">Enviando imagem…</p>}
            {noticeImageUrl && (
              <div className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                <img src={noticeImageUrl} alt="Prévia do aviso" className="max-h-72 w-full object-cover" />
                <Button type="button" variant="secondary" size="icon" className="absolute right-2 top-2" onClick={() => setNoticeImageUrl("")}><X className="size-4" /></Button>
              </div>
            )}
          </div>
          <Button onClick={publishNotice} disabled={publishing || uploading}><Save className="mr-2 size-4" />{publishing ? "Publicando…" : "Publicar Aviso Geral"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
