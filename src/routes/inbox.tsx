import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sendText,
  findChats,
  findMessages,
  listInstances,
  checkIsWhatsapp,
  markMessageAsRead,
  getMediaData,
} from "@/lib/evolution.functions";
import { getActiveInstance } from "@/components/evolution/InstancesPanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Sparkles,
  Phone,
  Plus,
  Info,
  CheckCheck,
  Loader2,
  MessageSquare,
  Settings as SettingsIcon,
  RefreshCw,
  Building2,
  MapPin,
  Users2,
  Users,
  FileText,
  Tag as TagIcon,
  ArrowRight,
  Clock,
  X,
  Save,
  Edit3,
  Trash2,
  MoreHorizontal,
  Download,
  ChevronDown,
  Funnel,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import {
  ensureContact,
  getContact,
  updateContact,
  getLeadsLite,
  getInstances,
  getPrompts,
  requalifyLead,
  getConversationCategorySettings,
} from "@/lib/server-functions";
import { setActiveInstance } from "@/components/evolution/InstancesPanel";

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
  leadCategory?: string;
  leadStatus?: "novo" | "negociacao" | "qualificado" | "perdido";
  isGroup?: boolean;
  groupName?: string;
  lastSenderName?: string;
  lastMessage?: {
    key?: { id?: string; fromMe?: boolean; remoteJid?: string };
    message?: any;
    messageTimestamp?: number | string;
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
function normalizeChatJid(jid: string): string {
  let n = jid.split("@")[0].replace(/\D/g, "");
  if (n.startsWith("55") && n.length > 11) n = n.substring(2);
  return n;
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
function parseMetadataSafe(raw: unknown): Record<string, any> {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeLeadCategory(raw?: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase();
}

function toFilterCategory(raw?: string): string {
  const v = normalizeLeadCategory(raw);
  if (v === "personal" || v === "business") return "lead";
  return v || "lead";
}

function getLeadCategoryLabel(raw?: string): string {
  const v = normalizeLeadCategory(raw);
  if (v === "group") return "GRUPO";
  if (v === "lead") return "LEAD";
  if (v === "personal") return "PESSOAL";
  if (v === "business") return "EMPRESA";
  if (!v) return "LEAD";
  return v.toUpperCase();
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
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(getActiveInstance());
  }, []);

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

function getQuickFilterStorageKey(instance: string): string {
  return `inbox:quick-category-filter:${instance}`;
}

/* ------------------------------ Main Page -------------------------------- */

function InboxPage() {
  const instance = useActiveInstance();
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [seenByChat, setSeenByChat] = useState<Record<string, number>>({});
  const [quickFilterCategories, setQuickFilterCategories] = useState<string[] | null>(null);

  const findChatsFn = useServerFn(findChats);
  const getLeadsLiteFn = useServerFn(getLeadsLite);
  const getInstancesFn = useServerFn(getInstances);
  const listInstancesFn = useServerFn(listInstances);
  const getConversationCategorySettingsFn = useServerFn(getConversationCategorySettings);

  const dbInstancesQ = useQuery({
    queryKey: ["instances", "aliases"],
    queryFn: () => getInstancesFn(),
    staleTime: 15000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });
  const evoInstancesQ = useQuery({
    queryKey: ["evolution", "instance-names", "inbox"],
    queryFn: () => listInstancesFn(),
    staleTime: 10000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const categorySettingsQ = useQuery({
    queryKey: ["inbox", "conversation-categories"],
    queryFn: () => getConversationCategorySettingsFn(),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!instance || typeof window === "undefined") {
      setSeenByChat({});
      return;
    }
    try {
      const raw = window.localStorage.getItem(`inbox:seen:${instance}`);
      setSeenByChat(raw ? JSON.parse(raw) : {});
    } catch {
      setSeenByChat({});
    }
  }, [instance]);

  useEffect(() => {
    if (!instance || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`inbox:seen:${instance}`, JSON.stringify(seenByChat));
    } catch {
      // Ignore storage failures (private mode/quota)
    }
  }, [instance, seenByChat]);

  const aliasMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (dbInstancesQ.data) {
      dbInstancesQ.data.forEach((inst: any) => {
        map[inst.name] = inst.alias ?? inst.name;
      });
    }
    return map;
  }, [dbInstancesQ.data]);

  const realInstanceNames = useMemo(() => {
    const arr = (evoInstancesQ.data?.instances ?? []) as Array<{
      instanceName?: string;
      name?: string;
      instance?: { instanceName?: string };
    }>;
    return arr
      .map((i) => i.instanceName ?? i.instance?.instanceName ?? i.name ?? "")
      .filter(Boolean);
  }, [evoInstancesQ.data]);

  useEffect(() => {
    if (!realInstanceNames.length) return;
    if (instance && realInstanceNames.includes(instance)) return;
    setActiveInstance(realInstanceNames[0]);
    setSelectedJid(null);
  }, [instance, realInstanceNames]);

  const chatsQ = useQuery({
    queryKey: ["evo", "chats", instance],
    queryFn: async () => {
      const [evoData, localLeads] = await Promise.all([
        findChatsFn({ data: { instanceName: instance! } }),
        getLeadsLiteFn({ data: { instanceId: instance ?? undefined } }),
      ]);

      const evoArr: any[] = Array.isArray(evoData) ? evoData : ((evoData as any)?.chats ?? []);
      const evoMap = new Map<string, Chat>();
      const leadsByNorm = new Map<
        string,
        {
          status?: "novo" | "negociacao" | "qualificado" | "perdido";
          name?: string;
          jid: string;
          category?: string;
        }
      >();

      (localLeads as any[]).forEach((l) => {
        if (typeof l.jid === "string" && l.jid.endsWith("@lid")) return;
        leadsByNorm.set(normalizeChatJid(l.jid), {
          status: l.status,
          name: l.name,
          jid: l.jid,
          category: normalizeLeadCategory((l as any).category || "lead"),
        });
      });

      // 1. Process Evolution Chats
      evoArr.forEach((c: any) => {
        const rawJid = c.remoteJid ?? c.id ?? c.jid;
        const altJid = c?.lastMessage?.key?.remoteJidAlt ?? c?.remoteJidAlt;
        const rawIsLid = typeof rawJid === "string" && rawJid.endsWith("@lid");
        const jid = rawIsLid ? altJid : rawJid;
        if (rawIsLid && !altJid) return;
        if (!jid) return;
        const norm = normalizeChatJid(jid);
        const isGroup = jid.endsWith("@g.us");

        let pName: string | undefined;
        let lastSenderName: string | undefined;

        if (isGroup) {
          // For groups: name is ALWAYS the group subject (c.name), NOT pushName
          // pushName for groups = name of the last sender
          pName = c.name;
          // capture last sender name from pushName or lastMessage.pushName
          if (c.pushName) {
            lastSenderName = c.pushName;
          }
          if (c.lastMessage && !c.lastMessage.key?.fromMe && c.lastMessage.pushName) {
            lastSenderName = c.lastMessage.pushName;
          }
        } else {
          // For individuals: pushName is the contact name
          pName = c.pushName ?? c.name;
          if (!pName && c.lastMessage && !c.lastMessage.key?.fromMe) {
            pName = c.lastMessage.pushName;
          }
        }

        const unreadRaw = c.unreadCount ?? c.unreadMessages ?? c.unread ?? c.countUnread ?? 0;
        const unreadNum =
          typeof unreadRaw === "number"
            ? unreadRaw
            : typeof unreadRaw === "string"
              ? Number(unreadRaw)
              : 0;

        evoMap.set(norm, {
          remoteJid: jid,
          pushName: pName,
          profilePicUrl: c.profilePicUrl ?? c.profilePictureUrl ?? null,
          unreadCount: Number.isFinite(unreadNum) && unreadNum > 0 ? unreadNum : 0,
          isGroup,
          groupName: isGroup ? pName : undefined,
          lastSenderName,
          leadCategory: leadsByNorm.get(norm)?.category ?? (isGroup ? "group" : "lead"),
          leadStatus: leadsByNorm.get(norm)?.status ?? "novo",
          lastMessage: c.lastMessage,
          updatedAt: c.updatedAt ?? c.updated_at,
        });
      });

      // 2. Merge with Local Leads
      localLeads.forEach((l: any) => {
        if (typeof l.jid === "string" && l.jid.endsWith("@lid")) return;
        const norm = normalizeChatJid(l.jid);
        if (evoMap.has(norm)) {
          // Enhance existing chat with local name if missing or if it's just the phone number
          const chat = evoMap.get(norm)!;
          if (
            !chat.pushName ||
            chat.pushName.includes("@") ||
            chat.pushName === "Você" ||
            /^\d+$/.test(chat.pushName)
          ) {
            chat.pushName = l.name;
          }
          if (l.status) {
            chat.leadStatus = l.status;
          }
          if ((l as any).category) {
            chat.leadCategory = normalizeLeadCategory((l as any).category);
          }
        } else {
          // Add as a new "Local" chat
          evoMap.set(norm, {
            remoteJid: l.jid,
            pushName: l.name,
            unreadCount: 0,
            leadCategory: normalizeLeadCategory(
              (l as any).category || (l.jid.endsWith("@g.us") ? "group" : "lead"),
            ),
            leadStatus: l.status ?? "novo",
            updatedAt: l.updated_at,
          });
        }
      });

      return Array.from(evoMap.values()).sort((a, b) => {
        const da = new Date(a.updatedAt || 0).getTime();
        const db = new Date(b.updatedAt || 0).getTime();
        return db - da;
      });
    },
    enabled: !!instance,
    staleTime: 10000,
    refetchInterval: 8000,
    refetchOnWindowFocus: false,
  });

  const chats = useMemo(() => {
    const base = (chatsQ.data ?? []) as Chat[];
    return base.map((chat) => {
      const unreadNum =
        typeof chat.unreadCount === "number"
          ? chat.unreadCount
          : typeof chat.unreadCount === "string"
            ? Number(chat.unreadCount)
            : 0;

      if (Number.isFinite(unreadNum) && unreadNum > 0) {
        return { ...chat, unreadCount: unreadNum };
      }

      // Evolution can return unreadCount null. Fallback to "new unseen inbound message".
      const inbound = chat.lastMessage?.key?.fromMe === false;
      const lastTs = tsToDate(chat.lastMessage?.messageTimestamp ?? chat.updatedAt)?.getTime() ?? 0;
      const seenTs = seenByChat[normalizeChatJid(chat.remoteJid)] ?? 0;
      const inferredUnread = inbound && lastTs > seenTs ? 1 : 0;

      return { ...chat, unreadCount: inferredUnread };
    });
  }, [chatsQ.data, seenByChat]);

  const visibleCategories = useMemo(() => {
    const fromServer = (categorySettingsQ.data as any)?.visibleCategories;
    if (Array.isArray(fromServer) && fromServer.length > 0) {
      return new Set(fromServer.map((c: string) => toFilterCategory(c)));
    }
    return new Set(["lead", "group"]);
  }, [categorySettingsQ.data]);

  useEffect(() => {
    if (!instance || typeof window === "undefined") {
      setQuickFilterCategories(null);
      return;
    }
    try {
      const raw = window.localStorage.getItem(getQuickFilterStorageKey(instance));
      if (!raw) {
        setQuickFilterCategories(null);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setQuickFilterCategories(null);
        return;
      }
      const normalized = Array.from(
        new Set(
          parsed
            .map((c: unknown) => toFilterCategory(String(c || "")))
            .filter((c: string) => !!c && visibleCategories.has(c)),
        ),
      );
      setQuickFilterCategories(normalized.length > 0 ? normalized : null);
    } catch {
      setQuickFilterCategories(null);
    }
  }, [instance, visibleCategories]);

  useEffect(() => {
    if (!instance || typeof window === "undefined") return;
    try {
      const key = getQuickFilterStorageKey(instance);
      if (!quickFilterCategories || quickFilterCategories.length === 0) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(key, JSON.stringify(quickFilterCategories));
    } catch {
      // Ignore storage failures.
    }
  }, [instance, quickFilterCategories]);

  const availableQuickFilterCategories = useMemo(
    () => Array.from(visibleCategories.values()).sort((a, b) => a.localeCompare(b)),
    [visibleCategories],
  );

  const effectiveVisibleCategories = useMemo(() => {
    if (!quickFilterCategories || quickFilterCategories.length === 0) return visibleCategories;
    return new Set(quickFilterCategories.filter((c) => visibleCategories.has(c)));
  }, [quickFilterCategories, visibleCategories]);

  const quickFilterActive = useMemo(() => {
    if (!quickFilterCategories || quickFilterCategories.length === 0) return false;
    return quickFilterCategories.length !== availableQuickFilterCategories.length;
  }, [quickFilterCategories, availableQuickFilterCategories.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byCategory = chats.filter((c) => {
      const cat = toFilterCategory(
        c.leadCategory || (c.remoteJid.endsWith("@g.us") ? "group" : "lead"),
      );
      return effectiveVisibleCategories.has(cat);
    });

    if (!q) return byCategory;
    // Normalize query for phone search (remove non-digits)
    const phoneQuery = q.replace(/\D+/g, "");
    return byCategory.filter((c) => {
      const name = (c.pushName ?? "").toLowerCase();
      const phone = jidToPhone(c.remoteJid);
      // Search by name (partial match)
      if (name.includes(q)) return true;
      // Search by phone (digits only, partial match)
      if (phoneQuery && phone.includes(phoneQuery)) return true;
      // Also try formatted phone match
      const formattedPhone = formatPhone(c.remoteJid).toLowerCase();
      if (formattedPhone.includes(q)) return true;
      return false;
    });
  }, [chats, query, effectiveVisibleCategories]);

  // Auto-select first chat
  useEffect(() => {
    if (!selectedJid && filtered.length > 0) setSelectedJid(filtered[0].remoteJid);
  }, [filtered, selectedJid]);

  const selected = filtered.find((c) => c.remoteJid === selectedJid) ?? null;

  useEffect(() => {
    if (!selected) return;
    const norm = normalizeChatJid(selected.remoteJid);
    const lastTs = tsToDate(
      selected.lastMessage?.messageTimestamp ?? selected.updatedAt,
    )?.getTime();
    if (!lastTs) return;

    setSeenByChat((prev) => {
      if ((prev[norm] ?? 0) >= lastTs) return prev;
      return { ...prev, [norm]: lastTs };
    });
  }, [selected]);

  const toggleQuickFilterCategory = (cat: string, checked: boolean) => {
    setQuickFilterCategories((prev) => {
      const current =
        Array.isArray(prev) && prev.length > 0 ? prev : availableQuickFilterCategories;
      if (checked) return Array.from(new Set([...current, cat]));
      const next = current.filter((c) => c !== cat);
      return next.length > 0 ? next : [];
    });
  };

  if (!instance) {
    return <NoInstanceState />;
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-void animate-in fade-in duration-500 overflow-hidden relative">
      {/* Atmospheric background */}
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />
      <div
        className="absolute top-[5%] right-[5%] size-[500px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "oklch(0.74 0.18 45 / 0.05)" }}
      />
      <div
        className="absolute bottom-[15%] left-[5%] size-[350px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "oklch(0.68 0.18 245 / 0.05)" }}
      />
      <div
        className="absolute top-[35%] left-[15%] size-[250px] rounded-full blur-[60px] pointer-events-none"
        style={{ background: "oklch(0.88 0.22 155 / 0.04)" }}
      />

      {/* Sidebar */}
      <section className="w-full md:w-[340px] shrink-0 border-b md:border-b-0 md:border-r border-border/10 flex flex-col bg-card z-10 h-1/3 md:h-full">
        <div className="p-4 border-b border-border/10 space-y-3 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TextSmall className="text-[10px]">Conversas</TextSmall>
              <TextMono className="text-[9px] opacity-40 px-2 py-0.5 rounded-full border border-border/10">
                {aliasMap[instance] ?? instance}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "size-7 rounded-lg border border-border/10 grid place-items-center hover:bg-white/5 transition-all active:scale-90 text-muted-foreground hover:text-foreground relative",
                      quickFilterActive && "text-primary border-primary/30 bg-primary/10",
                    )}
                    title="Filtrar categorias"
                  >
                    <Funnel className="size-3" />
                    {quickFilterActive && (
                      <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[220px] bg-card border-border/20">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Filtro de categoria
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableQuickFilterCategories.map((cat) => {
                    const current =
                      quickFilterCategories && quickFilterCategories.length > 0
                        ? quickFilterCategories
                        : availableQuickFilterCategories;
                    const checked = current.includes(cat);
                    return (
                      <DropdownMenuCheckboxItem
                        key={cat}
                        checked={checked}
                        onCheckedChange={(v) => toggleQuickFilterCategory(cat, Boolean(v))}
                        className="text-[11px] font-semibold"
                      >
                        {getLeadCategoryLabel(cat)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setQuickFilterCategories(null)}
                    className="text-[11px] font-semibold"
                  >
                    Mostrar todas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

          {/* Instance filter pills */}
          {realInstanceNames.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {realInstanceNames.map((instName) => {
                const isActive = instName === instance;
                const alias = aliasMap[instName] ?? instName;
                return (
                  <button
                    key={instName}
                    onClick={() => {
                      setActiveInstance(instName);
                      setSelectedJid(null);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-white/5 border border-border/10",
                    )}
                  >
                    {alias}
                  </button>
                );
              })}
            </div>
          )}
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
            // For groups: use groupName (stable), for individuals: use pushName
            const displayName = c.isGroup
              ? c.groupName || c.pushName || "Grupo"
              : c.pushName || formatPhone(c.remoteJid);
            const last = extractText(c.lastMessage?.message);
            const when = formatRelative(tsToDate(c.lastMessage?.messageTimestamp ?? c.updatedAt));
            // For groups: show sender name before message
            const lastMessageDisplay =
              c.isGroup && c.lastSenderName ? `${c.lastSenderName}: ${last || "—"}` : last || "—";
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-primary shadow-[0_0_8px_rgba(255,128,31,0.4)]" />
                  )}
                  <div className="relative shrink-0">
                    {c.profilePicUrl ? (
                      <img
                        src={c.profilePicUrl}
                        alt={displayName}
                        className={cn(
                          "size-10 object-cover border border-white/5",
                          c.isGroup ? "rounded-lg" : "rounded-full",
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "size-10 grid place-items-center text-[12px] font-bold bg-muted border border-white/5 text-foreground",
                          c.isGroup ? "rounded-lg" : "rounded-full",
                        )}
                      >
                        {c.isGroup ? (
                          <Users className="size-5 opacity-60" />
                        ) : (
                          initialsFrom(c.pushName, c.remoteJid)
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "text-[13px] font-bold truncate tracking-tight",
                            active ? "text-foreground" : "text-foreground/80",
                          )}
                        >
                          {displayName}
                        </span>
                        {c.isGroup && (
                          <span className="px-1.5 py-0.5 rounded border border-purple-10/40 bg-purple-10/10 text-purple-10 text-[8px] font-black uppercase tracking-wider shrink-0">
                            Grupo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <TextMono className="text-[9px] px-1.5 py-0.5 rounded border border-border/10 bg-white/[0.02]">
                          {aliasMap[instance] ?? instance}
                        </TextMono>
                        <TextMono className="text-[9px] uppercase tracking-wider opacity-40">
                          {when}
                        </TextMono>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] truncate opacity-50 max-w-[180px]">
                        {lastMessageDisplay}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.leadStatus === "novo" && !c.isGroup && (
                          <span className="px-1.5 py-0.5 rounded-full border border-blue-10/40 bg-blue-10/10 text-blue-10 text-[8px] font-black uppercase tracking-wider">
                            Novo
                          </span>
                        )}
                        {!!c.unreadCount && c.unreadCount > 0 && (
                          <span className="size-4 rounded-full bg-primary text-primary-foreground text-[8px] font-black grid place-items-center">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Center */}
      <section className="flex-1 flex flex-col min-w-0 relative overflow-hidden h-full">
        {selected ? (
          <div className="flex-1 flex flex-row overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
              <ChatPane
                instance={instance}
                chat={selected}
                onToggleInsights={() => setShowInsights(!showInsights)}
              />
            </div>
            {showInsights && (
              <ContactDetailsPanel jid={selected.remoteJid} instance={instance} chat={selected} />
            )}
          </div>
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

/* ----------------------------- Contact Details Panel -------------------------- */
/* Complete implementation matching original LeadCard functionality */

function ContactDetailsPanel({
  jid,
  instance,
  chat,
}: {
  jid: string;
  instance?: string;
  chat: Chat;
}) {
  const getContactFn = useServerFn(getContact);
  const ensureContactFn = useServerFn(ensureContact);
  const updateContactFn = useServerFn(updateContact);
  const getConversationCategorySettingsFn = useServerFn(getConversationCategorySettings);
  const qc = useQueryClient();

  const contactQ = useQuery({
    queryKey: ["contact", jid],
    queryFn: () => getContactFn({ data: jid }),
    enabled: !!jid,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const categorySettingsQ = useQuery({
    queryKey: ["inbox", "conversation-categories"],
    queryFn: () => getConversationCategorySettingsFn(),
    staleTime: 30000,
  });

  // Mutation for updating contact (including metadata fields)
  const updateMut = useMutation({
    mutationFn: (updates: Record<string, any>) =>
      updateContactFn({ data: { jid, instanceId: instance, updates } }),
    onSuccess: (result: any) => {
      if (result?.success === false || result?.ok === false) {
        toast.error(result?.error || "Falha ao salvar alterações");
        return;
      }
      qc.invalidateQueries({ queryKey: ["contact", jid] });
      qc.invalidateQueries({ queryKey: ["evo", "chats", instance] });
      toast.success("Atualizado com sucesso");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // Local editing state
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [metadataDraft, setMetadataDraft] = useState<Record<string, any>>({});
  const [briefingDraft, setBriefingDraft] = useState({
    company: "",
    role: "",
    city: "",
    source: "",
  });
  const [nameDraft, setNameDraft] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const contact = contactQ.data || {
    jid,
    instance_id: instance || "default",
    name: undefined,
    phone: undefined,
    score: 0,
    metadata: "{}",
    ai_enabled: 0,
    status: "novo" as const,
    type: "lead" as const,
  };

  const metadata = parseMetadataSafe(contact.metadata);
  const aiEnabled = contact.ai_enabled === 1;
  // For groups: use groupName (stable), for individuals: use saved name or pushName
  const isGroup = jid.endsWith("@g.us");
  const name = isGroup
    ? chat.groupName || chat.pushName || "Grupo"
    : (contact as any).name || chat.pushName || formatPhone(jid);
  const initials = initialsFrom(
    isGroup ? chat.groupName || chat.pushName : (contact as any).name || chat.pushName,
    jid,
  );
  const baseCategory = isGroup ? "group" : "lead";
  const categoryOptions = useMemo(() => {
    const fromSettings = (categorySettingsQ.data as any)?.categories;
    const defaults = ["lead", "group", "amigo", "familia", "marketing"];
    const raw = Array.isArray(fromSettings) && fromSettings.length > 0 ? fromSettings : defaults;
    const current = normalizeLeadCategory(
      metadataDraft.lead_category || (contact as any).type || baseCategory,
    );
    return Array.from(
      new Set([...raw, current].map((c: string) => normalizeLeadCategory(c)).filter(Boolean)),
    );
  }, [baseCategory, categorySettingsQ.data, contact, metadataDraft.lead_category]);
  const contactCategory = normalizeLeadCategory(
    metadataDraft.lead_category || (contact as any).type || baseCategory,
  );

  useEffect(() => {
    setMetadataDraft(metadata);
    setBriefingDraft({
      company: metadata.company || "",
      role: metadata.role || "",
      city: metadata.city || "",
      source: metadata.source || "",
    });
    setNameDraft((contact as any).name || chat.pushName || "");
  }, [contact.metadata, (contact as any).name, chat.pushName, jid]);

  // Data from metadata (editable)
  const tags: string[] = Array.isArray(metadataDraft.tags) ? metadataDraft.tags : [];
  const notes: Array<{ id: string; text: string; at: string }> = Array.isArray(metadataDraft.notes)
    ? metadataDraft.notes
    : [];

  const STATUS_LABELS: Record<string, string> = {
    novo: "Novo",
    negociacao: "Em Negociação",
    qualificado: "Qualificado",
    perdido: "Perdido",
  };

  // Handlers
  const handleToggleAi = () => {
    updateMut.mutate({ ai_enabled: aiEnabled ? 0 : 1 });
  };

  const handleStatusChange = (status: string) => {
    updateMut.mutate({ status });
  };

  const handleCategoryChange = (category: string) => {
    if (isUpdating) return;
    persistMetadata({ ...metadataDraft, lead_category: normalizeLeadCategory(category) });
  };

  const handleSaveName = () => {
    if (!nameDraft.trim() || isUpdating) return;
    updateMut.mutate({ name: nameDraft.trim() });
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setNameDraft((contact as any).name || chat.pushName || "");
    setIsEditingName(false);
  };

  const persistMetadata = (nextMetadata: Record<string, any>) => {
    setMetadataDraft(nextMetadata);
    updateMut.mutate({
      metadata: JSON.stringify(nextMetadata),
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (isUpdating) return;
    if (tags.includes(newTag.trim())) {
      setNewTag("");
      return;
    }
    persistMetadata({ ...metadataDraft, tags: [...tags, newTag.trim()] });
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    if (isUpdating) return;
    persistMetadata({ ...metadataDraft, tags: tags.filter((t) => t !== tag) });
  };

  const handleSaveBriefing = () => {
    if (isUpdating) return;
    persistMetadata({
      ...metadataDraft,
      company: briefingDraft.company.trim(),
      role: briefingDraft.role.trim(),
      city: briefingDraft.city.trim(),
      source: briefingDraft.source.trim(),
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    if (isUpdating) return;
    const note = {
      id: `note_${Date.now()}`,
      text: newNote.trim(),
      at: new Date().toLocaleString(),
    };
    persistMetadata({ ...metadataDraft, notes: [...notes, note] });
    setNewNote("");
  };

  const handleDeleteNote = (id: string) => {
    if (isUpdating) return;
    persistMetadata({ ...metadataDraft, notes: notes.filter((n) => n.id !== id) });
  };

  const isUpdating = updateMut.isPending;
  const briefingDirty =
    briefingDraft.company !== (metadataDraft.company || "") ||
    briefingDraft.role !== (metadataDraft.role || "") ||
    briefingDraft.city !== (metadataDraft.city || "") ||
    briefingDraft.source !== (metadataDraft.source || "");

  useEffect(() => {
    if (!instance || !jid) return;
    ensureContactFn({
      data: {
        jid,
        instanceId: instance,
        name: chat.pushName || jid.split("@")[0],
        phone: jidToPhone(jid),
      },
    }).then((result: any) => {
      if (result?.ok) {
        qc.invalidateQueries({ queryKey: ["contact", jid] });
      }
    });
  }, [chat.pushName, ensureContactFn, instance, jid, qc]);

  if (contactQ.isLoading)
    return (
      <aside className="w-80 shrink-0 border-l border-border/10 bg-white/[0.005] backdrop-blur-3xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-500">
        <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
      </aside>
    );

  return (
    <aside className="w-80 shrink-0 border-l border-border/10 bg-white/[0.005] backdrop-blur-3xl flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto scrollbar-hide">
      {/* ===== PROFILE HEADER ===== */}
      <div className="p-6 border-b border-border/10">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            {chat.profilePicUrl ? (
              <img
                src={chat.profilePicUrl}
                alt={name}
                className={cn(
                  "size-16 object-cover border border-white/10",
                  isGroup ? "rounded-lg" : "rounded-full",
                )}
              />
            ) : (
              <div
                className={cn(
                  "size-16 grid place-items-center text-[20px] font-bold bg-muted border border-white/10 text-foreground",
                  isGroup ? "rounded-lg" : "rounded-full",
                )}
              >
                {isGroup ? <Users className="size-8 opacity-60" /> : initials}
              </div>
            )}
          </div>

          {/* Editable Name */}
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-[200px]">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={isUpdating}
                autoFocus
                className="flex-1 bg-muted border border-primary/30 rounded-lg px-3 py-1 text-[14px] font-bold text-center outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") handleCancelEditName();
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={isUpdating || !nameDraft.trim()}
                className="size-7 rounded-lg bg-primary grid place-items-center"
              >
                {isUpdating ? (
                  <Loader2 className="size-3 animate-spin text-primary-foreground" />
                ) : (
                  <Save className="size-3 text-primary-foreground" />
                )}
              </button>
              <button
                onClick={handleCancelEditName}
                disabled={isUpdating}
                className="size-7 rounded-lg bg-muted border border-border/10 grid place-items-center"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <span className="text-[16px] font-bold tracking-tight text-foreground mb-1">
                {name}
              </span>
              <button
                onClick={() => setIsEditingName(true)}
                className="size-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center hover:bg-white/5"
              >
                <Edit3 className="size-3 text-muted-foreground" />
              </button>
            </div>
          )}

          <TextMono className="text-[11px] opacity-50 flex items-center gap-1.5 justify-center">
            <Phone className="size-3" /> {formatPhone(jid)}
          </TextMono>

          {/* Status & Type - clickable dropdowns */}
          <div className="flex items-center gap-2 justify-center mt-4">
            {/* For groups: show fixed GROUP badge instead of status */}
            {isGroup ? (
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border border-purple-10/40 bg-purple-10/10 text-purple-10">
                Grupo
              </span>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isUpdating}
                    className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border flex items-center gap-1.5 transition-all hover:opacity-80",
                      contact.status === "qualificado"
                        ? "border-green-4/40 text-green-4 bg-green-4/10"
                        : contact.status === "negociacao"
                          ? "border-yellow-9/40 text-yellow-9 bg-yellow-9/10"
                          : contact.status === "perdido"
                            ? "border-red-5/40 text-red-5 bg-red-5/10"
                            : "border-blue-10/40 text-blue-10 bg-blue-10/10",
                      isUpdating && "opacity-50 cursor-wait",
                    )}
                  >
                    {STATUS_LABELS[contact.status]}
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="min-w-[140px] bg-card border-border/20"
                >
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("novo")}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-10 focus:bg-blue-10/10 focus:text-blue-10"
                  >
                    Novo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("negociacao")}
                    className="text-[10px] font-black uppercase tracking-widest text-yellow-9 focus:bg-yellow-9/10 focus:text-yellow-9"
                  >
                    Em Negociação
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("qualificado")}
                    className="text-[10px] font-black uppercase tracking-widest text-green-4 focus:bg-green-4/10 focus:text-green-4"
                  >
                    Qualificado
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("perdido")}
                    className="text-[10px] font-black uppercase tracking-widest text-red-5 focus:bg-red-5/10 focus:text-red-5"
                  >
                    Perdido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isUpdating}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border border-border/20 bg-muted/50 text-muted-foreground flex items-center gap-1.5 transition-all hover:opacity-80",
                    isUpdating && "opacity-50 cursor-wait",
                  )}
                >
                  {getLeadCategoryLabel(contactCategory)}
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="min-w-[150px] bg-card border-border/20"
              >
                {categoryOptions.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className="text-[10px] font-black uppercase tracking-widest"
                  >
                    {getLeadCategoryLabel(cat)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ===== AI QUALIFICATION (only for leads, not groups) ===== */}
      {!isGroup && (
        <div className="p-6 border-b border-border/10">
          <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
            Qualificação IA
          </TextSmall>
          <div className="p-4 rounded-2xl border border-border/10 bg-white/[0.02] relative overflow-hidden">
            <div className="absolute top-[-10px] right-[-10px] size-32 opacity-[0.04] blur-[40px] pointer-events-none">
              <Sparkles className="size-full" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-end gap-1">
                <span className="text-[36px] font-display leading-none">{contact.score}</span>
                <span className="text-[14px] opacity-40 mb-1">/100</span>
              </div>
              <div className="size-12 relative flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(contact.score / 100) * 100} 100`}
                  />
                </svg>
                <TextMono className="absolute text-[11px] font-black text-primary">
                  {contact.score}%
                </TextMono>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${contact.score}%` }}
              />
            </div>
            <TextSmall className="text-[11px] opacity-60">
              {contact.score > 70
                ? "Lead quente. Alta propensão de fechamento."
                : contact.score > 30
                  ? "Interessado, requer nutrição."
                  : "Lead frio ou desqualificado."}
            </TextSmall>
          </div>
        </div>
      )}

      {/* ===== AI AUTOMATION TOGGLE (only for leads, not groups) ===== */}
      {!isGroup && (
        <div className="p-6 border-b border-border/10">
          <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
            Automação IA
          </TextSmall>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/10 bg-white/[0.02]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-bold">{aiEnabled ? "Ativa" : "Desativada"}</span>
              <span className="text-[10px] opacity-40">Modo agente</span>
            </div>
            <button
              onClick={handleToggleAi}
              disabled={isUpdating}
              className={cn(
                "w-10 h-5 rounded-full relative transition-all duration-300",
                aiEnabled ? "bg-primary" : "bg-muted",
                isUpdating && "opacity-50 cursor-wait",
              )}
            >
              {isUpdating ? (
                <Loader2 className="size-3 absolute top-1 left-3 animate-spin text-white" />
              ) : (
                <div
                  className={cn(
                    "absolute top-1 size-3 rounded-full bg-white transition-all duration-300",
                    aiEnabled ? "left-6" : "left-1",
                  )}
                />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== TAGS ===== */}
      <div className="p-6 border-b border-border/10">
        <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <TagIcon className="size-3" /> Segmentação
        </TextSmall>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => handleRemoveTag(t)}
              disabled={isUpdating}
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-all flex items-center gap-1"
            >
              {t}
              <X className="size-2.5 opacity-60" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nova tag..."
            className="flex-1 bg-muted border border-border/10 rounded-lg px-3 py-1.5 text-[11px] outline-none"
          />
          <button
            onClick={handleAddTag}
            disabled={isUpdating || !newTag.trim()}
            className="size-7 rounded-lg bg-primary grid place-items-center"
          >
            {isUpdating ? (
              <Loader2 className="size-3 animate-spin text-primary-foreground" />
            ) : (
              <Plus className="size-3 text-primary-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* ===== BRIEFING ===== */}
      <div className="p-6 border-b border-border/10">
        <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Building2 className="size-3" /> Briefing
        </TextSmall>
        <div className="space-y-3">
          {[
            { icon: Building2, label: "Empresa", field: "company" },
            { icon: Users2, label: "Cargo", field: "role" },
            { icon: MapPin, label: "Cidade", field: "city" },
            { icon: Sparkles, label: "Origem", field: "source" },
          ].map((row) => (
            <div key={row.field} className="flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-2 opacity-60">
                <row.icon className="size-3" />
                <TextSmall className="text-[10px]">{row.label}</TextSmall>
              </div>
              <input
                value={briefingDraft[row.field as keyof typeof briefingDraft]}
                onChange={(e) =>
                  setBriefingDraft((prev) => ({
                    ...prev,
                    [row.field]: e.target.value,
                  }))
                }
                disabled={isUpdating}
                placeholder="—"
                className="text-[11px] font-mono text-right bg-transparent border-b border-border/10 px-1 outline-none focus:border-primary/30 w-[120px]"
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveBriefing}
            disabled={isUpdating || !briefingDirty}
            className="w-full mt-2"
          >
            {isUpdating ? (
              <Loader2 className="size-3 animate-spin mr-1" />
            ) : (
              <Save className="size-3 mr-1" />
            )}
            Salvar briefing
          </Button>
        </div>
      </div>

      {/* ===== AI SUMMARY ===== */}
      {metadataDraft.summary && (
        <div className="p-6 border-b border-border/10">
          <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
            Resumo da IA
          </TextSmall>
          <div className="p-4 rounded-2xl border border-border/10 bg-white/[0.02] text-[13px] leading-relaxed italic opacity-80">
            "{metadataDraft.summary}"
          </div>
        </div>
      )}

      {/* ===== SENTIMENT ===== */}
      {metadataDraft.sentiment && (
        <div className="p-6 border-b border-border/10">
          <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
            Sentimento
          </TextSmall>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-2 rounded-full",
                metadataDraft.sentiment === "positive"
                  ? "bg-green-4 shadow-[0_0_10px_#22c55e]"
                  : metadataDraft.sentiment === "negative"
                    ? "bg-red-5 shadow-[0_0_10px_#ef4444]"
                    : "bg-blue-10",
              )}
            />
            <span className="text-[12px] font-mono uppercase tracking-widest opacity-60">
              {metadataDraft.sentiment}
            </span>
          </div>
        </div>
      )}

      {/* ===== NOTES ===== */}
      <div className="p-6 border-b border-border/10">
        <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <FileText className="size-3" /> Notas
        </TextSmall>
        <div className="space-y-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-xl border border-border/10 bg-white/[0.02] group relative"
            >
              <p className="text-[12px] leading-relaxed opacity-80">{n.text}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                <TextMono className="text-[9px] opacity-40">{n.at}</TextMono>
                <button
                  onClick={() => handleDeleteNote(n.id)}
                  disabled={isUpdating}
                  className="opacity-0 group-hover:opacity-100 text-[9px] text-red-5 hover:text-red-4 transition-opacity"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Nova anotação..."
            rows={2}
            className="w-full bg-muted border border-border/10 rounded-xl px-3 py-2 text-[12px] outline-none resize-none"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddNote}
            disabled={isUpdating || !newNote.trim()}
            className="w-full"
          >
            {isUpdating ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Plus className="size-3 mr-1" />
            )}
            Adicionar nota
          </Button>
        </div>
      </div>

      {/* ===== DISPATCH ===== */}
      <div className="p-6 border-b border-border/10">
        <TextSmall className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Send className="size-3" /> Despacho
        </TextSmall>
        <div className="space-y-2">
          {[
            { label: "Secretaria", sub: "Resumo + Score", icon: Users2 },
            { label: "Comercial", sub: "Briefing técnico", icon: Building2 },
            { label: "Follow-up", sub: "Agendar retorno", icon: Clock },
          ].map((d) => (
            <button
              key={d.label}
              onClick={() => toast.success(`Briefing enviado para ${d.label}`)}
              className="w-full p-3 rounded-xl border border-border/10 bg-white/[0.02] flex items-center gap-3 hover:bg-white/[0.04] transition-all text-left"
            >
              <div className="size-8 rounded-lg bg-muted grid place-items-center">
                <d.icon className="size-4 opacity-60" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold block">{d.label}</span>
                <span className="text-[9px] opacity-40 uppercase tracking-widest">{d.sub}</span>
              </div>
              <ArrowRight className="size-3 opacity-40" />
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center opacity-20">
        <TextMono className="text-[9px] uppercase tracking-widest">
          Leadflow · {new Date().getFullYear()}
        </TextMono>
      </div>
    </aside>
  );
}

/* ------------------------- Chat Utilities ------------------------------- */

function formatWhatsAppMarkdown(text: string) {
  if (!text) return "";
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  let html = escapeHtml(text)
    .replace(/\*([^\*]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~([^~]+)~/g, "<del>$1</del>")
    .replace(/```([^`]*)```/g, "<code class='bg-black/10 px-1 rounded'>$1</code>")
    .replace(/\n/g, "<br/>");
  return html;
}

function MediaBubble({ instance, msg }: { instance: string; msg: any }) {
  const getMediaFn = useServerFn(getMediaData);
  const [data, setData] = useState<{ base64: string; mimetype: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = msg.type?.toLowerCase() || "";

  // Check if base64 is already present in raw_message (from webhookBase64=true)
  const hasInlineBase64 = msg.raw_message?.base64?.data;

  // Handler to download media on demand (only if not already present)
  const handleDownload = async () => {
    if (isLoading || data || hasInlineBase64) return;
    // Need raw_message.message to call Evolution API
    if (!msg.raw_message?.message) {
      setError("Mídia não disponível para download");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMediaFn({
        data: { instanceName: instance, message: msg.raw_message },
      });
      if (result?.base64) {
        setData(result);
      } else {
        setError("Mídia não disponível");
      }
    } catch (e: any) {
      setError(e.message || "Erro ao baixar");
    }
    setIsLoading(false);
  };

  // Use inline base64 if present (from webhook with webhookBase64=true)
  const mediaData = hasInlineBase64
    ? { base64: msg.raw_message.base64.data, mimetype: msg.raw_message.base64.mimetype }
    : data;

  // Determine if we have any media data to display
  const canShowMedia = !!mediaData?.base64;
  const needsDownload = !canShowMedia && msg.raw_message?.message;
  const hasNoSource = !canShowMedia && !msg.raw_message?.message && !hasInlineBase64;

  // No source available - show placeholder
  if (hasNoSource) {
    const mediaType = type.includes("audio")
      ? "Áudio"
      : type.includes("image")
        ? "Imagem"
        : type.includes("video")
          ? "Vídeo"
          : type.includes("sticker")
            ? "Figurinha"
            : type.includes("document")
              ? "Documento"
              : "Mídia";

    return (
      <div className="flex items-center gap-2 p-3 bg-black/5 rounded-lg border border-border/10 mt-1">
        <div className="size-8 rounded bg-muted grid place-items-center">
          <Paperclip className="size-4 opacity-60" />
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold">{mediaType}</span>
          <span className="text-[10px] opacity-40">Disponível apenas para mensagens recentes</span>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center gap-2 bg-black/5 rounded-lg border border-border/10">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="text-[11px] opacity-70">Baixando...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 p-3 bg-black/5 rounded-lg border border-border/10 hover:bg-black/10 transition-colors mt-1 w-full"
      >
        <div className="size-8 rounded bg-red-5/20 text-red-5 grid place-items-center">
          <Paperclip className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-red-5">{error}</span>
          <span className="text-[10px] opacity-60">Clique para tentar novamente</span>
        </div>
      </button>
    );
  }

  // Need download but haven't downloaded yet - show download button
  if (needsDownload) {
    const mediaType = type.includes("audio")
      ? "Áudio"
      : type.includes("image")
        ? "Imagem"
        : type.includes("video")
          ? "Vídeo"
          : type.includes("sticker")
            ? "Figurinha"
            : type.includes("document")
              ? "Documento"
              : "Mídia";
    return (
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 p-3 bg-black/5 rounded-lg border border-border/10 hover:bg-black/10 transition-colors mt-1 w-full"
      >
        <div className="size-8 rounded bg-primary/20 text-primary grid place-items-center">
          <Download className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold">{mediaType}</span>
          <span className="text-[10px] opacity-60">Clique para visualizar</span>
        </div>
      </button>
    );
  }

  // Data loaded (or inline base64) - show media
  if (mediaData?.base64) {
    const src = `data:${mediaData.mimetype};base64,${mediaData.base64}`;

    if (type.includes("audio")) {
      return <audio controls src={src} className="max-w-[240px] h-10 outline-none mt-1" />;
    }

    if (type.includes("image")) {
      const handleOpenImage = () => {
        fetch(src)
          .then((res) => res.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          })
          .catch(() => window.open(src, "_blank"));
      };
      return (
        <img
          src={src}
          alt="Media"
          className="max-w-xs rounded-lg mt-1 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleOpenImage}
        />
      );
    }

    if (type.includes("video")) {
      return <video controls src={src} className="max-w-xs rounded-lg mt-1" />;
    }

    return (
      <a
        href={src}
        download="documento"
        className="flex items-center gap-2 p-3 bg-black/5 rounded-lg border border-border/10 hover:bg-black/10 transition-colors mt-1"
      >
        <div className="size-8 rounded bg-primary/20 text-primary grid place-items-center">
          <Paperclip className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold">Documento / Mídia</span>
          <span className="text-[10px] opacity-60 cursor-pointer">Clique para baixar</span>
        </div>
      </a>
    );
  }

  // Default: show download button placeholder
  const mediaType = type.includes("audio")
    ? "Áudio"
    : type.includes("image")
      ? "Imagem"
      : type.includes("video")
        ? "Vídeo"
        : type.includes("sticker")
          ? "Figurinha"
          : "Documento";

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="flex items-center gap-2 p-3 bg-black/5 rounded-lg border border-border/10 hover:bg-black/10 transition-colors mt-1 w-full"
    >
      <div className="size-8 rounded bg-primary/20 text-primary grid place-items-center">
        <Paperclip className="size-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[12px] font-bold">{mediaType}</span>
        <span className="text-[10px] opacity-60">Clique para baixar e visualizar</span>
      </div>
      <Download className="size-4 opacity-40 ml-auto" />
    </button>
  );
}

/* ------------------------------ Chat Pane -------------------------------- */

function ChatPane({
  instance,
  chat,
  onToggleInsights,
}: {
  instance: string;
  chat: Chat;
  onToggleInsights: () => void;
}) {
  const findMessagesFn = useServerFn(findMessages);
  const markReadFn = useServerFn(markMessageAsRead);
  const getPromptsFn = useServerFn(getPrompts);
  const getContactFn = useServerFn(getContact);
  const requalifyLeadFn = useServerFn(requalifyLead);
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [qualifyOpen, setQualifyOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<"default" | "saved" | "custom">("default");
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const messagesQ = useQuery({
    queryKey: ["evo", "messages", instance, chat.remoteJid],
    queryFn: async () => {
      const data = await findMessagesFn({
        data: { instanceName: instance, remoteJid: chat.remoteJid, limit: 80 },
      });
      return (Array.isArray(data) ? data : []) as any[];
    },
    enabled: !!instance && !!chat.remoteJid,
    staleTime: 5000,
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
  });

  const promptsQ = useQuery({
    queryKey: ["prompts", "qualify-menu"],
    queryFn: () => getPromptsFn(),
    staleTime: 60000,
  });

  const contactQ = useQuery({
    queryKey: ["contact", "qualify-menu", chat.remoteJid],
    queryFn: () => getContactFn({ data: chat.remoteJid }),
    staleTime: 10000,
  });

  const messages = messagesQ.data ?? [];
  const contactPromptId = (contactQ.data as any)?.prompt_id as string | undefined;
  const hasSavedPrompts = (promptsQ.data?.length ?? 0) > 0;

  useEffect(() => {
    if (!qualifyOpen) return;
    if (contactPromptId) {
      setPromptMode("saved");
      setSelectedPromptId(contactPromptId);
      return;
    }
    if (hasSavedPrompts && !selectedPromptId) {
      setPromptMode("saved");
      setSelectedPromptId(promptsQ.data?.[0]?.id ?? "");
      return;
    }
    setPromptMode("default");
  }, [contactPromptId, hasSavedPrompts, promptsQ.data, qualifyOpen, selectedPromptId]);

  const requalifyMut = useMutation({
    mutationFn: async () =>
      requalifyLeadFn({
        data: {
          jid: chat.remoteJid,
          instanceId: instance,
          promptId: promptMode === "saved" ? selectedPromptId : undefined,
          customPrompt: promptMode === "custom" ? customPrompt : undefined,
        },
      }),
    onSuccess: (res: any) => {
      if (!res?.ok) {
        toast.error(res?.error || "Falha na requalificação");
        return;
      }
      qc.invalidateQueries({ queryKey: ["contact", chat.remoteJid] });
      qc.invalidateQueries({ queryKey: ["contact", "qualify-menu", chat.remoteJid] });
      qc.invalidateQueries({ queryKey: ["evo", "chats", instance] });
      toast.success(`Lead requalificado (${res.score ?? 0}/100)`);
      setQualifyOpen(false);
    },
    onError: (err) => toast.error((err as Error).message),
  });

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
      .filter((m) => !m.from_me)
      .slice(-Math.max(chat.unreadCount, 1))
      .map((m) => ({ remoteJid: chat.remoteJid, fromMe: false, id: m.id }));
    if (unread.length === 0) return;
    markReadFn({ data: { instanceName: instance, readMessages: unread } }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.remoteJid, messages.length]);

  const phone = jidToPhone(chat.remoteJid);
  // For groups: use groupName (stable), for individuals: use pushName
  const name = chat.isGroup
    ? chat.groupName || chat.pushName || "Grupo"
    : chat.pushName || formatPhone(chat.remoteJid);

  return (
    <>
      <div className="px-6 py-3 border-b border-border/10 flex items-center justify-between bg-void/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {chat.profilePicUrl ? (
            <img
              src={chat.profilePicUrl}
              alt={name}
              className={cn(
                "size-9 object-cover border border-white/5",
                chat.isGroup ? "rounded-lg" : "rounded-full",
              )}
            />
          ) : (
            <div
              className={cn(
                "size-9 grid place-items-center text-[12px] font-bold bg-muted border border-white/5 text-foreground",
                chat.isGroup ? "rounded-lg" : "rounded-full",
              )}
            >
              {chat.isGroup ? (
                <Users className="size-4 opacity-60" />
              ) : (
                initialsFrom(chat.pushName, chat.remoteJid)
              )}
            </div>
          )}
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[14px] font-bold tracking-tight truncate leading-none text-foreground">
              {name}
            </span>
            {chat.isGroup && (
              <span className="px-1.5 py-0.5 rounded border border-purple-10/40 bg-purple-10/10 text-purple-10 text-[8px] font-black uppercase tracking-wider shrink-0">
                Grupo
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!chat.isGroup && (
            <a
              href={`tel:+${phone}`}
              className="size-8 rounded-lg border border-border/10 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Phone className="size-3.5" />
            </a>
          )}
          <button
            onClick={onToggleInsights}
            className="size-8 rounded-lg border border-border/10 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Info className="size-3.5" />
          </button>
          {!chat.isGroup && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-full border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => setQualifyOpen(true)}
            >
              <Sparkles className="mr-2 size-3" />
              <span className="text-[10px] font-black uppercase tracking-wider">Qualificar</span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={qualifyOpen} onOpenChange={setQualifyOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Requalificar Lead com IA</DialogTitle>
            <DialogDescription>
              Escolha o prompt da requalificação. Essa ação atualiza score, resumo, sentimento e
              tags.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={promptMode === "default"}
                onChange={() => setPromptMode("default")}
              />
              Usar prompt padrão
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={promptMode === "saved"}
                onChange={() => setPromptMode("saved")}
                disabled={!hasSavedPrompts}
              />
              Usar prompt salvo
            </label>
            <select
              value={selectedPromptId}
              onChange={(e) => setSelectedPromptId(e.target.value)}
              disabled={promptMode !== "saved" || !hasSavedPrompts}
              className="w-full bg-muted border border-border/10 rounded-lg px-3 py-2 text-sm"
            >
              {hasSavedPrompts ? (
                promptsQ.data?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option value="">Nenhum prompt salvo</option>
              )}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={promptMode === "custom"}
                onChange={() => setPromptMode("custom")}
              />
              Prompt customizado (temporário)
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={promptMode !== "custom"}
              rows={8}
              placeholder="Escreva um prompt específico para extrair insights nesta requalificação..."
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQualifyOpen(false)}
              disabled={requalifyMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => requalifyMut.mutate()}
              disabled={
                requalifyMut.isPending ||
                (promptMode === "saved" && !selectedPromptId) ||
                (promptMode === "custom" && !customPrompt.trim())
              }
            >
              {requalifyMut.isPending ? (
                <>
                  <Loader2 className="size-3 mr-2 animate-spin" />
                  Requalificando...
                </>
              ) : (
                "Requalificar agora"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          const isMe = m.from_me === 1 || m.from_me === true;
          let text = m.content || "";

          const t = (m.type || "").toLowerCase();
          // Detect all media types including extended forms
          const isMedia =
            t.includes("audio") ||
            t.includes("image") ||
            t.includes("video") ||
            t.includes("document") ||
            t.includes("sticker") ||
            t.includes("media") ||
            t.includes("ptt") ||
            t.includes("voice") ||
            // Check raw_message.message for media types
            (m.raw_message?.message &&
              (m.raw_message.message.imageMessage ||
                m.raw_message.message.audioMessage ||
                m.raw_message.message.videoMessage ||
                m.raw_message.message.documentMessage ||
                m.raw_message.message.stickerMessage ||
                m.raw_message.message.pttMessage)) ||
            // Check raw_message.base64 (Evolution API webhookBase64=true)
            (m.raw_message?.base64 &&
              (m.raw_message.base64.type === "image" ||
                m.raw_message.base64.type === "audio" ||
                m.raw_message.base64.type === "video" ||
                m.raw_message.base64.type === "document" ||
                m.raw_message.base64.type === "sticker" ||
                m.raw_message.base64.mimetype?.startsWith("image/") ||
                m.raw_message.base64.mimetype?.startsWith("audio/") ||
                m.raw_message.base64.mimetype?.startsWith("video/")));

          if (!text && !isMedia && m.type) {
            if (t.includes("sticker")) text = "👾 Figurinha";
            else if (t.includes("reaction")) text = "❤️ Reação";
            else text = "";
          }

          const time = formatTime(new Date(m.timestamp));
          return (
            <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn("flex flex-col max-w-[80%]", isMe ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-[18px] text-[14px] leading-snug shadow-sm overflow-hidden",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                      : "bg-card border border-border/10 text-foreground rounded-tl-none",
                  )}
                >
                  {isMedia ? (
                    <MediaBubble instance={instance} msg={m} />
                  ) : text ? (
                    <div
                      className="whitespace-pre-wrap break-words [&>strong]:font-bold [&>em]:italic [&>del]:line-through [&>code]:font-mono [&>code]:text-[12px]"
                      dangerouslySetInnerHTML={{ __html: formatWhatsAppMarkdown(text) || "—" }}
                    />
                  ) : (
                    <div className="p-2 opacity-50 italic text-[11px]">Mensagem não disponível</div>
                  )}
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
    <div className="border-t border-border/10 p-4 md:p-6 bg-void/80 backdrop-blur-xl relative z-20 mt-auto">
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={startMut.isPending}
          >
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
    <div className="h-full grid place-items-center p-8">
      <div className="text-center max-w-md">
        <div className="size-14 rounded-2xl bg-muted border border-border/10 grid place-items-center mx-auto mb-6">
          <SettingsIcon className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-[18px] font-bold text-foreground mb-2">Nenhuma instância ativa</h2>
        <TextSmall className="text-[12px] mb-6 block">
          Para receber e enviar mensagens, conecte uma instância do WhatsApp em Configurações e
          marque-a como ativa.
        </TextSmall>
        <Button asChild>
          <Link to="/settings">Ir para Configurações</Link>
        </Button>
      </div>
    </div>
  );
}
