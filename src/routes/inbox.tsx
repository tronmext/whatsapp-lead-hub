import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sendText,
  findChats,
  findMessages,
  checkIsWhatsapp,
  markMessageAsRead,
} from "@/lib/evolution.functions";
import { getActiveInstance } from "@/components/evolution/InstancesPanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Send, Paperclip, Smile, Sparkles, Phone, Plus, Info,
  CheckCheck, Loader2, MessageSquare, Settings as SettingsIcon, RefreshCw,
} from "lucide-react";
import { TextSmall, TextMono } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Leadflow" },
      { name: "description", content: "Conversas reais via Evolution API." },
    ],
  }),
  component: InboxPage,
});

/* ----------------------------- Helpers / Types ---------------------------- */

type Chat = {
  remoteJid: string;
  pushName?: string;
  profilePicUrl?: string | null;
  unreadCount?: number;
  lastMessage?: {
    key?: { id?: string; fromMe?: boolean; remoteJid?: string };
    message?: any;
    messageTimestamp?: number;
    pushName?: string;
  };
  updatedAt?: string;
};

type Msg = {
  id?: string;
  key: { id: string; remoteJid: string; fromMe: boolean };
  message?: any;
  messageType?: string;
  messageTimestamp?: number | string;
  pushName?: string;
};

function jidToPhone(jid: string): string {
  return jid.split("@")[0]?.replace(/\D+/g, "") ?? "";
}
function phoneToJid(phone: string): string {
  const d = phone.replace(/\D+/g, "");
  return `${d}@s.whatsapp.net`;
}
function initialsFrom(name?: string, jid?: string): string {
  const src = (name || jidToPhone(jid || "") || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function formatPhone(jid: string): string {
  const d = jidToPhone(jid);
  if (!d) return jid;
  if (d.length >= 12) {
    const cc = d.slice(0, 2);
    const ar = d.slice(2, 4);
    const a = d.slice(4, d.length - 4);
    const b = d.slice(-4);
    return `+${cc} ${ar} ${a}-${b}`;
  }
  return `+${d}`;
}
function tsToDate(ts?: number | string): Date | null {
  if (ts == null) return null;
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  // seconds vs ms
  return new Date(ts < 1e12 ? ts * 1000 : ts);
}
function formatTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatRelative(d: Date | null): string {
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}
function extractText(message: any): string {
  if (!message) return "";
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.documentMessage?.fileName ||
    (message.audioMessage ? "[áudio]" : "") ||
    (message.imageMessage ? "[imagem]" : "") ||
    (message.videoMessage ? "[vídeo]" : "") ||
    (message.stickerMessage ? "[figurinha]" : "") ||
    (message.locationMessage ? "[localização]" : "") ||
    (message.contactMessage ? "[contato]" : "") ||
    ""
  );
}

/* -------------------------------- Hooks ---------------------------------- */

function useActiveInstance(): string | null {
  const [name, setName] = useState<string | null>(() => getActiveInstance());
  useEffect(() => {
    const onStorage = () => setName(getActiveInstance());
    window.addEventListener("storage", onStorage);
    const i = setInterval(onStorage, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(i);
    };
  }, []);
  return name;
}

/* ------------------------------ Main Page -------------------------------- */

function InboxPage() {
  const instance = useActiveInstance();
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);

  const findChatsFn = useServerFn(findChats);

  const chatsQ = useQuery({
    queryKey: ["evo", "chats", instance],
    queryFn: async () => {
      const data = await findChatsFn({ data: { instanceName: instance! } });
      const arr: any[] = Array.isArray(data) ? data : (data as any)?.chats ?? [];
      return arr.map<Chat>((c: any) => ({
        remoteJid: c.remoteJid ?? c.id ?? c.jid,
        pushName: c.pushName ?? c.name ?? c.lastMessage?.pushName,
        profilePicUrl: c.profilePicUrl ?? c.profilePictureUrl ?? null,
        unreadCount: c.unreadCount ?? c.unreadMessages ?? 0,
        lastMessage: c.lastMessage,
        updatedAt: c.updatedAt ?? c.updated_at,
      })).filter((c) => c.remoteJid && !c.remoteJid.endsWith("@g.us"));
    },
    enabled: !!instance,
    refetchInterval: 8000,
  });

  const chats = chatsQ.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      (c.pushName ?? "").toLowerCase().includes(q) ||
      jidToPhone(c.remoteJid).includes(q.replace(/\D+/g, ""))
    );
  }, [chats, query]);

  // Auto-select first chat
  useEffect(() => {
    if (!selectedJid && filtered.length > 0) setSelectedJid(filtered[0].remoteJid);
  }, [filtered, selectedJid]);

  const selected = chats.find((c) => c.remoteJid === selectedJid) ?? null;

  if (!instance) {
    return <NoInstanceState />;
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-void animate-in fade-in duration-500 overflow-hidden relative">
      {/* Sidebar */}
      <section className="w-full md:w-[340px] shrink-0 border-b md:border-b-0 md:border-r border-border/10 flex flex-col bg-void relative z-10 h-1/3 md:h-full">
        <div className="p-4 border-b border-border/10 space-y-3 bg-void/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TextSmall className="text-[10px]">Conversas</TextSmall>
              <TextMono className="text-[9px] opacity-40 px-2 py-0.5 rounded-full border border-border/10">
                {instance}
              </TextMono>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => chatsQ.refetch()}
                className="size-7 rounded-lg border border-border/10 grid place-items-center hover:bg-white/5 transition-all active:scale-90 text-muted-foreground hover:text-foreground"
                title="Atualizar"
              >
                <RefreshCw className={cn("size-3", chatsQ.isFetching && "animate-spin")} />
              </button>
              <button
                onClick={() => setNewChatOpen(true)}
                className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center hover:opacity-90 transition-all active:scale-90"
                title="Nova conversa"
              >
                <Plus className="size-3" strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="relative group">
            <Search className="size-3 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nome ou telefone..."
              className="w-full bg-muted border border-border/10 rounded-xl pl-8 pr-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/30 transition-all font-mono"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-border/10 scrollbar-hide">
          {chatsQ.isLoading && (
            <li className="p-8 text-center">
              <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
              <TextSmall className="text-[10px] mt-3">Carregando conversas...</TextSmall>
            </li>
          )}
          {chatsQ.isError && (
            <li className="p-6 text-center">
              <TextSmall className="text-[11px] text-destructive">
                {(chatsQ.error as Error).message}
              </TextSmall>
            </li>
          )}
          {!chatsQ.isLoading && filtered.length === 0 && (
            <li className="p-8 text-center">
              <MessageSquare className="size-6 mx-auto text-muted-foreground/40 mb-3" />
              <TextSmall className="text-[11px]">Nenhuma conversa encontrada</TextSmall>
            </li>
          )}
          {filtered.map((c) => {
            const active = c.remoteJid === selectedJid;
            const name = c.pushName || formatPhone(c.remoteJid);
            const last = extractText(c.lastMessage?.message);
            const when = formatRelative(
              tsToDate(c.lastMessage?.messageTimestamp ?? c.updatedAt),
            );
            return (
              <li key={c.remoteJid}>
                <button
                  onClick={() => setSelectedJid(c.remoteJid)}
                  className={cn(
                    "w-full text-left px-5 py-4 flex gap-4 transition-all duration-200 relative group",
                    active ? "bg-white/[0.03]" : "hover:bg-white/[0.015]",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-primary rounded-full" />
                  )}
                  <div className="relative shrink-0">
                    {c.profilePicUrl ? (
                      <img
                        src={c.profilePicUrl}
                        alt={name}
                        className="size-10 rounded-full object-cover border border-white/5"
                      />
                    ) : (
                      <div className="size-10 rounded-full grid place-items-center text-[12px] font-bold bg-muted border border-white/5 text-foreground">
                        {initialsFrom(c.pushName, c.remoteJid)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span
                        className={cn(
                          "text-[13px] font-bold truncate tracking-tight",
                          active ? "text-foreground" : "text-foreground/80",
                        )}
                      >
                        {name}
                      </span>
                      <TextMono className="text-[9px] uppercase tracking-wider opacity-40 shrink-0">
                        {when}
                      </TextMono>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] truncate opacity-50 max-w-[180px]">
                        {last || "—"}
                      </span>
                      {!!c.unreadCount && c.unreadCount > 0 && (
                        <span className="size-4 rounded-full bg-primary text-primary-foreground text-[8px] font-black grid place-items-center shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Center */}
      <section className="flex-1 flex flex-col min-w-0 bg-void relative overflow-hidden h-full">
        {selected ? (
          <ChatPane instance={instance} chat={selected} />
        ) : (
          <div className="flex-1 grid place-items-center">
            <div className="text-center opacity-60">
              <MessageSquare className="size-10 mx-auto text-muted-foreground/40 mb-4" />
              <TextSmall className="text-[11px]">Selecione uma conversa</TextSmall>
            </div>
          </div>
        )}
      </section>

      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        instance={instance}
        onCreated={(jid) => {
          setSelectedJid(jid);
          chatsQ.refetch();
        }}
      />
    </div>
  );
}

/* ------------------------------ Chat Pane -------------------------------- */

function ChatPane({ instance, chat }: { instance: string; chat: Chat }) {
  const findMessagesFn = useServerFn(findMessages);
  const markReadFn = useServerFn(markMessageAsRead);
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQ = useQuery({
    queryKey: ["evo", "messages", instance, chat.remoteJid],
    queryFn: async () => {
      const data = await findMessagesFn({
        data: { instanceName: instance, remoteJid: chat.remoteJid, limit: 80 },
      });
      // Evolution returns various shapes; normalize.
      const records: any[] =
        (data as any)?.messages?.records ??
        (data as any)?.messages ??
        (Array.isArray(data) ? data : []);
      return records as Msg[];
    },
    enabled: !!instance && !!chat.remoteJid,
    refetchInterval: 4000,
  });

  const messages = useMemo(() => {
    const arr = messagesQ.data ?? [];
    return [...arr].sort((a, b) => {
      const ta = tsToDate(a.messageTimestamp)?.getTime() ?? 0;
      const tb = tsToDate(b.messageTimestamp)?.getTime() ?? 0;
      return ta - tb;
    });
  }, [messagesQ.data]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, chat.remoteJid]);

  // Mark as read when opening chat
  useEffect(() => {
    if (!chat.unreadCount) return;
    const unread = messages
      .filter((m) => !m.key.fromMe)
      .slice(-Math.max(chat.unreadCount, 1))
      .map((m) => ({ remoteJid: m.key.remoteJid, fromMe: m.key.fromMe, id: m.key.id }));
    if (unread.length === 0) return;
    markReadFn({ data: { instanceName: instance, readMessages: unread } }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.remoteJid, messages.length]);

  const phone = jidToPhone(chat.remoteJid);
  const name = chat.pushName || formatPhone(chat.remoteJid);

  return (
    <>
      <div className="px-6 py-3 border-b border-border/10 flex items-center justify-between bg-void/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {chat.profilePicUrl ? (
            <img
              src={chat.profilePicUrl}
              alt={name}
              className="size-9 rounded-full object-cover border border-white/5"
            />
          ) : (
            <div className="size-9 rounded-full grid place-items-center text-[12px] font-bold bg-muted border border-white/5 text-foreground">
              {initialsFrom(chat.pushName, chat.remoteJid)}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[14px] font-bold tracking-tight truncate leading-none mb-0.5 block text-foreground">
              {name}
            </span>
            <TextMono className="text-[10px] font-bold opacity-50">
              {formatPhone(chat.remoteJid)}
            </TextMono>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={`tel:+${phone}`}
            className="size-8 rounded-lg border border-border/10 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Phone className="size-3.5" />
          </a>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-full border-primary/20 text-primary hover:bg-primary/5"
          >
            <Sparkles className="mr-2 size-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Qualificar</span>
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 space-y-3 scrollbar-hide relative z-10"
      >
        {messagesQ.isLoading && (
          <div className="text-center py-10">
            <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}
        {messagesQ.isError && (
          <div className="text-center py-6">
            <TextSmall className="text-[11px] text-destructive">
              {(messagesQ.error as Error).message}
            </TextSmall>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.key.fromMe;
          const text = extractText(m.message);
          const time = formatTime(tsToDate(m.messageTimestamp));
          return (
            <div
              key={m.key.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div className={cn("flex flex-col max-w-[65%]", isMe ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-[18px] text-[14px] leading-snug shadow-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                      : "bg-card border border-border/10 text-foreground rounded-tl-none",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{text || "—"}</p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1.5 mt-1 px-1 opacity-50",
                    isMe ? "flex-row" : "flex-row-reverse",
                  )}
                >
                  <TextMono className="text-[9px] font-bold uppercase tracking-widest">
                    {time}
                  </TextMono>
                  {isMe && <CheckCheck className="size-2.5 text-primary" strokeWidth={3} />}
                </div>
              </div>
            </div>
          );
        })}
        {!messagesQ.isLoading && messages.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <TextSmall className="text-[11px]">Nenhuma mensagem ainda</TextSmall>
          </div>
        )}
      </div>

      <ChatComposer
        instance={instance}
        jid={chat.remoteJid}
        onSent={() => {
          qc.invalidateQueries({ queryKey: ["evo", "messages", instance, chat.remoteJid] });
          qc.invalidateQueries({ queryKey: ["evo", "chats", instance] });
        }}
      />
    </>
  );
}

/* ----------------------------- Chat Composer ----------------------------- */

function ChatComposer({
  instance,
  jid,
  onSent,
}: {
  instance: string;
  jid: string;
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const sendTextFn = useServerFn(sendText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMut = useMutation({
    mutationFn: async (body: string) =>
      sendTextFn({ data: { instanceName: instance, number: jidToPhone(jid), text: body } }),
    onSuccess: () => {
      setText("");
      onSent();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  function handleSend() {
    const body = text.trim();
    if (!body || sendMut.isPending) return;
    sendMut.mutate(body);
  }

  return (
    <div className="border-t border-border/10 p-4 md:p-6 bg-void relative z-20 mt-auto">
      <div className="max-w-3xl mx-auto">
        <div className="border border-border/10 rounded-2xl bg-muted p-1 transition-all focus-within:border-primary/30 shadow-2xl">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Mensagem..."
            className="w-full bg-transparent border-none outline-none resize-none px-4 py-2 text-[14px] min-h-[40px] max-h-32 scrollbar-hide text-foreground placeholder:text-muted-foreground/40 leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-0.5">
              <button
                disabled
                className="size-8 rounded-lg grid place-items-center text-muted-foreground/40 hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-40"
                title="Em breve"
              >
                <Smile className="size-4" />
              </button>
              <button
                disabled
                className="size-8 rounded-lg grid place-items-center text-muted-foreground/40 hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-40"
                title="Em breve"
              >
                <Paperclip className="size-4" />
              </button>
            </div>
            <button
              disabled={!text.trim() || sendMut.isPending}
              onClick={handleSend}
              className={cn(
                "size-9 rounded-lg grid place-items-center transition-all active:scale-90",
                text.trim() && !sendMut.isPending
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50",
              )}
            >
              {sendMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
        <div className="text-center mt-3 opacity-40">
          <TextSmall className="text-[10px] flex items-center justify-center gap-2">
            <Info className="size-3" /> Conexão via Evolution API
          </TextSmall>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- New Chat Dialog --------------------------- */

function NewChatDialog({
  open,
  onOpenChange,
  instance,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instance: string;
  onCreated: (jid: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const checkFn = useServerFn(checkIsWhatsapp);
  const sendTextFn = useServerFn(sendText);

  const startMut = useMutation({
    mutationFn: async () => {
      const digits = phone.replace(/\D+/g, "");
      if (digits.length < 10) throw new Error("Informe um número válido com DDI e DDD.");
      const check = await checkFn({ data: { instanceName: instance, numbers: [digits] } });
      const first = Array.isArray(check) ? check[0] : null;
      if (!first?.exists) throw new Error("Número não está no WhatsApp.");
      const jid = first.jid;
      if (message.trim()) {
        await sendTextFn({
          data: { instanceName: instance, number: digits, text: message.trim() },
        });
      }
      return jid;
    },
    onSuccess: (jid) => {
      toast.success("Conversa iniciada");
      onCreated(jid);
      onOpenChange(false);
      setPhone("");
      setMessage("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/20 text-foreground">
        <DialogHeader>
          <DialogTitle>Nova conversa</DialogTitle>
          <DialogDescription>
            Verifique o número no WhatsApp e envie uma primeira mensagem opcional.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Telefone (com DDI e DDD)
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="55 11 91234-5678"
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Primeira mensagem (opcional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá! Tudo bem?"
              rows={3}
              className="bg-muted text-foreground"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={startMut.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => startMut.mutate()} disabled={startMut.isPending || !phone.trim()}>
            {startMut.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Iniciando...
              </>
            ) : (
              "Iniciar conversa"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Empty States ------------------------------ */

function NoInstanceState() {
  return (
    <div className="h-full grid place-items-center bg-void p-8">
      <div className="text-center max-w-md">
        <div className="size-14 rounded-2xl bg-muted border border-border/10 grid place-items-center mx-auto mb-6">
          <SettingsIcon className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-[18px] font-bold text-foreground mb-2">
          Nenhuma instância ativa
        </h2>
        <TextSmall className="text-[12px] mb-6 block">
          Para receber e enviar mensagens, conecte uma instância do WhatsApp em Configurações
          e marque-a como ativa.
        </TextSmall>
        <Button asChild>
          <Link to="/settings">Ir para Configurações</Link>
        </Button>
      </div>
    </div>
  );
}
