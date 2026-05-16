import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Wifi,
  Shield,
  Command,
  Loader2,
  Save,
  Plus,
  Layers,
  AlertTriangle,
  Lock,
  Palette,
  Check,
  Send,
} from "lucide-react";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { InstancesPanel } from "@/components/evolution/InstancesPanel";
import { listInstances } from "@/lib/evolution.functions";
import {
  getPrompts,
  savePrompt,
  getInstanceLeadsAi,
  setInstanceAiDefault,
  setLeadsAiBatch,
  getConversationCategorySettings,
  saveConversationCategorySettings,
  getDispatchSettings,
  saveDispatchSettings,
} from "@/lib/server-functions";
import { Input } from "@/components/ui/input";
import { useTheme, THEMES } from "@/hooks/use-theme";
import { toast } from "sonner";

type PromptRecord = {
  id: string;
  name: string;
  content: string;
  category?: string;
  scope_instance_id?: string | null;
  scope_tag?: string | null;
};

type LeadAiRow = {
  jid: string;
  name?: string;
  status?: string;
  ai_enabled: number;
  updated_at: string;
};

type ConversationCategorySettings = {
  categories: string[];
  visibleCategories: string[];
};

const CATEGORY_OPTIONS = [
  { value: "sales", label: "Assistente / Atendimento" },
  { value: "tech", label: "Técnico" },
  { value: "summary", label: "Resumo" },
  { value: "referral", label: "Indicação" },
] as const;

function categoryLabel(value?: string): string {
  return CATEGORY_OPTIONS.find((opt) => opt.value === value)?.label || value || "Vendas";
}

function pickEvolutionInstanceName(i: any): string {
  return i?.instanceName ?? i?.instance?.instanceName ?? i?.name ?? "";
}

function normalizePromptMultiline(text: string): string {
  return String(text || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");
}

function promptScopeLabel(p: PromptRecord): string {
  const hasInstance = !!p.scope_instance_id;
  const hasTag = !!p.scope_tag;
  if (hasInstance && hasTag) return `${p.scope_instance_id} + #${p.scope_tag}`;
  if (hasInstance) return `${p.scope_instance_id}`;
  if (hasTag) return `Global + #${p.scope_tag}`;
  return "Global";
}

function formatConversationCategoryLabel(raw: string): string {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "group") return "GRUPO";
  if (v === "lead") return "LEAD";
  if (v === "personal") return "PESSOAL";
  if (v === "business") return "EMPRESA";
  if (!v) return "SEM CATEGORIA";
  return v.toUpperCase();
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Leadflow" },
      {
        name: "description",
        content: "Configuração operacional do motor de IA e das instâncias WhatsApp.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "ai" | "instances" | "dispatch" | "security" | "appearance"
  >("ai");
  const listInstancesFn = useServerFn(listInstances);

  const instancesQ = useQuery({
    queryKey: ["settings", "instances"],
    queryFn: () => listInstancesFn(),
    staleTime: 20000,
    refetchInterval: 30000,
  });

  const liveInstanceCount = useMemo(() => {
    const arr = (instancesQ.data?.instances ?? []) as any[];
    return arr.filter((i) => pickEvolutionInstanceName(i)).length;
  }, [instancesQ.data]);

  const TABS = [
    {
      id: "ai",
      label: "Motor de IA",
      desc: "Prompts e escopo de roteamento",
      icon: Sparkles,
    },
    {
      id: "instances",
      label: "Instâncias",
      desc: "Conexões ativas da Evolution",
      icon: Wifi,
    },
    {
      id: "dispatch",
      label: "Despacho",
      desc: "Destinos WhatsApp para briefings",
      icon: Send,
    },
    {
      id: "security",
      label: "Segurança",
      desc: "Políticas e superfície de risco",
      icon: Shield,
    },
    {
      id: "appearance",
      label: "Aparência",
      desc: "Cores e personalização visual",
      icon: Palette,
    },
  ] as const;

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="relative min-h-full bg-void animate-in fade-in duration-700 flex flex-col xl:flex-row overflow-hidden">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />

      <aside className="w-full xl:w-[360px] shrink-0 border-b xl:border-b-0 xl:border-r border-frost-border bg-white/[0.01] backdrop-blur-3xl z-10 flex flex-col">
        <div className="p-6 md:p-8 xl:p-10">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Command className="size-4 text-muted-foreground" />
              <TextSmall className="text-muted-foreground uppercase tracking-widest">
                Centro de Controle
              </TextSmall>
            </div>
            <HeadingHero className="text-[34px] md:text-[40px] leading-none mb-3">
              Configurações
            </HeadingHero>
            <TextSmall className="text-muted-foreground max-w-[36ch]">
              Ajuste o comportamento por contexto de atendimento, sem misturar escopos globais e
              específicos.
            </TextSmall>
          </header>

          <div className="grid grid-cols-2 gap-2 mb-8">
            <div className="rounded-xl border border-frost-border bg-white/[0.02] p-3">
              <TextSmall className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                Instâncias Reais
              </TextSmall>
              <TextMono className="text-[16px] font-black text-near-white">
                {instancesQ.isLoading ? "..." : liveInstanceCount}
              </TextMono>
            </div>
            <div className="rounded-xl border border-frost-border bg-white/[0.02] p-3">
              <TextSmall className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                Escopo Global
              </TextSmall>
              <TextMono className="text-[12px] text-near-white">todas as instâncias</TextMono>
            </div>
          </div>

          <nav className="space-y-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left rounded-2xl p-4 border transition-all",
                    active
                      ? "bg-near-white text-void border-near-white"
                      : "border-frost-border text-muted-foreground hover:text-near-white hover:bg-white/[0.03]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <tab.icon
                      className={cn(
                        "size-5 mt-0.5",
                        active ? "text-void" : "text-muted-foreground",
                      )}
                    />
                    <div>
                      <div className="font-section font-bold tracking-[0.04em] uppercase text-[12px]">
                        {tab.label}
                      </div>
                      <TextSmall
                        className={cn(
                          "text-[11px] mt-1",
                          active ? "text-void/70" : "text-muted-foreground",
                        )}
                      >
                        {tab.desc}
                      </TextSmall>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 md:p-8 border-t border-frost-border/30">
          <TextMono className="text-[10px] uppercase tracking-[0.25em] opacity-40 block">
            Leadflow settings
          </TextMono>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 xl:p-14 relative z-0">
        <div className="max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-8 border-b border-frost-border pb-6">
            <HeadingSub className="mb-2">{activeTabMeta.label}</HeadingSub>
            <TextSmall className="text-muted-foreground">{activeTabMeta.desc}</TextSmall>
          </div>

          {activeTab === "ai" && <AISettings />}
          {activeTab === "instances" && <InstanceSettings />}
          {activeTab === "dispatch" && <DispatchSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
        </div>
      </main>
    </div>
  );
}

function AISettings() {
  const qc = useQueryClient();
  const getPromptsFn = useServerFn(getPrompts);
  const savePromptFn = useServerFn(savePrompt);
  const getInstanceLeadsAiFn = useServerFn(getInstanceLeadsAi);
  const setInstanceAiDefaultFn = useServerFn(setInstanceAiDefault);
  const setLeadsAiBatchFn = useServerFn(setLeadsAiBatch);
  const getConversationCategorySettingsFn = useServerFn(getConversationCategorySettings);
  const saveConversationCategorySettingsFn = useServerFn(saveConversationCategorySettings);
  const listInstancesFn = useServerFn(listInstances);

  const promptsQ = useQuery({
    queryKey: ["prompts"],
    queryFn: () => getPromptsFn(),
  });

  const instancesQ = useQuery({
    queryKey: ["instances", "for-prompts"],
    queryFn: () => listInstancesFn(),
    staleTime: 30000,
  });

  const categorySettingsQ = useQuery({
    queryKey: ["settings", "conversation-categories"],
    queryFn: () => getConversationCategorySettingsFn(),
    staleTime: 30000,
  });

  const instanceNames = useMemo(() => {
    const arr = (instancesQ.data?.instances ?? []) as any[];
    return arr.map((i) => pickEvolutionInstanceName(i)).filter(Boolean);
  }, [instancesQ.data]);

  const prompts = (promptsQ.data ?? []) as PromptRecord[];

  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecord | null>(null);
  const [content, setContent] = useState("");
  const [batchInstanceId, setBatchInstanceId] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLeadJids, setSelectedLeadJids] = useState<Record<string, boolean>>({});
  const [conversationCategories, setConversationCategories] = useState<string[]>([]);
  const [visibleConversationCategories, setVisibleConversationCategories] = useState<string[]>([]);
  const [newConversationCategory, setNewConversationCategory] = useState("");

  useEffect(() => {
    if (prompts.length > 0 && !selectedPrompt) {
      const first = prompts[0];
      const normalized = normalizePromptMultiline(first.content);
      setSelectedPrompt({
        id: first.id,
        name: first.name,
        content: normalized,
        category: first.category,
        scope_instance_id: first.scope_instance_id ?? "",
        scope_tag: first.scope_tag ?? "",
      });
      setContent(normalized);
    }
  }, [prompts, selectedPrompt]);

  useEffect(() => {
    if (batchInstanceId || instanceNames.length === 0) return;
    setBatchInstanceId(instanceNames[0]);
  }, [batchInstanceId, instanceNames]);

  useEffect(() => {
    const data = categorySettingsQ.data as ConversationCategorySettings | undefined;
    if (!data) return;
    setConversationCategories(data.categories || []);
    setVisibleConversationCategories(data.visibleCategories || []);
  }, [categorySettingsQ.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!selectedPrompt) return;
      return savePromptFn({
        data: {
          id: selectedPrompt.id || undefined,
          name: selectedPrompt.name,
          content: normalizePromptMultiline(content),
          category: selectedPrompt.category || "sales",
          scope_instance_id: selectedPrompt.scope_instance_id || null,
          scope_tag: selectedPrompt.scope_tag || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Prompt salvo com sucesso");
      qc.invalidateQueries({ queryKey: ["prompts"] });
      setSelectedPrompt((prev) =>
        prev ? { ...prev, content: normalizePromptMultiline(content) } : prev,
      );
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleNewPrompt = () => {
    const draft: PromptRecord = {
      id: "",
      name: "Novo Prompt",
      content: "",
      category: "sales",
      scope_instance_id: "",
      scope_tag: "",
    };
    setSelectedPrompt(draft);
    setContent("");
  };

  const leadsQ = useQuery({
    queryKey: ["settings", "leads-ai", batchInstanceId],
    queryFn: () => getInstanceLeadsAiFn({ data: { instanceId: batchInstanceId } }),
    enabled: !!batchInstanceId,
    staleTime: 15000,
  });

  const filteredLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    const rows = (leadsQ.data ?? []) as LeadAiRow[];
    if (!q) return rows;
    return rows.filter((l) => {
      const name = (l.name || "").toLowerCase();
      const jid = l.jid.toLowerCase();
      return name.includes(q) || jid.includes(q);
    });
  }, [leadSearch, leadsQ.data]);

  const selectedCount = useMemo(
    () => Object.values(selectedLeadJids).filter(Boolean).length,
    [selectedLeadJids],
  );

  const toggleInstanceAiMut = useMutation({
    mutationFn: (enabled: boolean) =>
      setInstanceAiDefaultFn({ data: { instanceId: batchInstanceId, enabled } }),
    onSuccess: (res: any) => {
      if (!res?.ok) {
        toast.error(res?.error || "Falha ao atualizar instância");
        return;
      }
      toast.success(`IA ${res?.changes ? `atualizada em ${res.changes} leads` : "atualizada"}`);
      qc.invalidateQueries({ queryKey: ["settings", "leads-ai", batchInstanceId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const batchMut = useMutation({
    mutationFn: (enabled: boolean) =>
      setLeadsAiBatchFn({
        data: {
          instanceId: batchInstanceId,
          jids: Object.entries(selectedLeadJids)
            .filter(([, v]) => v)
            .map(([jid]) => jid),
          enabled,
        },
      }),
    onSuccess: (res: any) => {
      if (!res?.ok) {
        toast.error(res?.error || "Falha no batch");
        return;
      }
      toast.success(`Batch concluído: ${res.updated ?? 0} leads`);
      qc.invalidateQueries({ queryKey: ["settings", "leads-ai", batchInstanceId] });
      setSelectedLeadJids({});
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const saveConversationCategoriesMut = useMutation({
    mutationFn: async () =>
      saveConversationCategorySettingsFn({
        data: {
          categories: conversationCategories,
          visibleCategories: visibleConversationCategories,
        },
      }),
    onSuccess: (res: any) => {
      if (!res?.ok) {
        toast.error(res?.error || "Falha ao salvar categorias");
        return;
      }
      toast.success("Categorias de conversa salvas");
      qc.invalidateQueries({ queryKey: ["settings", "conversation-categories"] });
      qc.invalidateQueries({ queryKey: ["inbox", "conversation-categories"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const addConversationCategory = () => {
    const normalized = newConversationCategory.trim().toLowerCase();
    if (!normalized) return;
    if (conversationCategories.includes(normalized)) {
      setNewConversationCategory("");
      return;
    }
    setConversationCategories((prev) => [...prev, normalized]);
    setVisibleConversationCategories((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized],
    );
    setNewConversationCategory("");
  };

  const toggleVisibleCategory = (cat: string, checked: boolean) => {
    setVisibleConversationCategories((prev) => {
      if (checked) return prev.includes(cat) ? prev : [...prev, cat];
      return prev.filter((c) => c !== cat);
    });
  };

  const removeConversationCategory = (cat: string) => {
    setConversationCategories((prev) => prev.filter((c) => c !== cat));
    setVisibleConversationCategories((prev) => prev.filter((c) => c !== cat));
  };

  useEffect(() => {
    setSelectedLeadJids({});
  }, [batchInstanceId]);

  if (promptsQ.isLoading) {
    return (
      <section>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <TextSmall>Carregando prompts...</TextSmall>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="rounded-2xl border border-frost-border bg-white/[0.02] p-4 h-fit">
          <div className="flex items-center justify-between mb-4">
            <TextSmall className="uppercase tracking-widest text-[10px] text-muted-foreground">
              Biblioteca de Prompts
            </TextSmall>
            <Button size="sm" variant="outline" onClick={handleNewPrompt} className="h-7 px-2">
              <Plus className="size-3 mr-1" /> Novo
            </Button>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {prompts.length === 0 && (
              <div className="rounded-xl border border-dashed border-frost-border p-4">
                <TextSmall className="text-muted-foreground">Nenhum prompt cadastrado.</TextSmall>
              </div>
            )}
            {prompts.map((p) => {
              const active = selectedPrompt?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    const normalized = normalizePromptMultiline(p.content);
                    setSelectedPrompt({
                      id: p.id,
                      name: p.name,
                      content: normalized,
                      category: p.category,
                      scope_instance_id: p.scope_instance_id ?? "",
                      scope_tag: p.scope_tag ?? "",
                    });
                    setContent(normalized);
                  }}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 transition-all",
                    active
                      ? "border-primary/40 bg-primary/10"
                      : "border-frost-border hover:bg-white/[0.03]",
                  )}
                >
                  <div className="text-[12px] font-bold truncate">{p.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground uppercase">
                      {categoryLabel(p.category)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground truncate">
                      {promptScopeLabel(p)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5">
          {selectedPrompt ? (
            <>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <input
                  value={selectedPrompt.name}
                  onChange={(e) =>
                    setSelectedPrompt((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  placeholder="Nome do prompt"
                  className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground"
                />
                <select
                  value={selectedPrompt.category ?? "sales"}
                  onChange={(e) =>
                    setSelectedPrompt((prev) =>
                      prev ? { ...prev, category: e.target.value } : prev,
                    )
                  }
                  className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <TextSmall className="text-[11px] text-muted-foreground mb-3 block">
                Categoria define a finalidade do prompt. Para atendimento normal da assistente, use
                “Assistente / Atendimento”.
              </TextSmall>

              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <select
                  value={selectedPrompt.scope_instance_id ?? ""}
                  onChange={(e) =>
                    setSelectedPrompt((prev) =>
                      prev ? { ...prev, scope_instance_id: e.target.value } : prev,
                    )
                  }
                  className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground"
                >
                  <option value="">Global (todas as instâncias reais)</option>
                  {instanceNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  value={selectedPrompt.scope_tag ?? ""}
                  onChange={(e) =>
                    setSelectedPrompt((prev) =>
                      prev ? { ...prev, scope_tag: e.target.value.toLowerCase() } : prev,
                    )
                  }
                  placeholder="Tag alvo opcional (ex: advogado)"
                  className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground"
                />
              </div>

              <div className="mb-4 rounded-xl border border-frost-border bg-black/10 p-3">
                <TextSmall className="text-[11px] text-muted-foreground">
                  Prioridade aplicada na IA: contato fixo, instância + tag, instância, tag global,
                  global.
                </TextSmall>
              </div>

              <textarea
                className="w-full h-80 bg-transparent outline-none resize-none text-[14px] font-mono leading-relaxed text-near-white/85 scrollbar-hide border border-frost-border rounded-xl p-3"
                spellCheck={false}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <TextSmall className="text-[11px] text-muted-foreground mt-2 block">
                Suporta Markdown e quebras de linha reais.
              </TextSmall>

              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-frost-border/30">
                <Button
                  variant="secondary"
                  size="sm"
                  className="px-6 uppercase tracking-widest text-[11px] font-black"
                  onClick={() => setContent(selectedPrompt.content)}
                >
                  Restaurar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="px-8 uppercase tracking-widest text-[11px] font-black"
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending || !content.trim() || !selectedPrompt.name.trim()}
                >
                  {saveMut.isPending ? (
                    <Loader2 className="size-3.5 animate-spin mr-2" />
                  ) : (
                    <Save className="size-3.5 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            </>
          ) : (
            <div className="h-[420px] grid place-items-center rounded-xl border border-dashed border-frost-border">
              <TextSmall className="text-muted-foreground">
                Selecione um prompt para editar ou crie um novo.
              </TextSmall>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <HeadingSub className="text-[18px] mb-1">Automação IA por Instância</HeadingSub>
            <TextSmall className="text-muted-foreground">
              Defina padrão para todos os leads da instância e aplique lote por seleção.
            </TextSmall>
          </div>
          <select
            value={batchInstanceId}
            onChange={(e) => setBatchInstanceId(e.target.value)}
            className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground min-w-[220px]"
          >
            {instanceNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!batchInstanceId || toggleInstanceAiMut.isPending}
            onClick={() => toggleInstanceAiMut.mutate(true)}
          >
            {toggleInstanceAiMut.isPending ? (
              <Loader2 className="size-3 mr-2 animate-spin" />
            ) : null}
            Ativar IA para todos da instância
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!batchInstanceId || toggleInstanceAiMut.isPending}
            onClick={() => toggleInstanceAiMut.mutate(false)}
          >
            {toggleInstanceAiMut.isPending ? (
              <Loader2 className="size-3 mr-2 animate-spin" />
            ) : null}
            Desativar IA para todos da instância
          </Button>
        </div>

        <div className="border-t border-frost-border/30 pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Buscar lead por nome ou JID..."
              className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground flex-1 min-w-[260px]"
            />
            <label className="text-[12px] text-muted-foreground flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  filteredLeads.length > 0 && filteredLeads.every((l) => !!selectedLeadJids[l.jid])
                }
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedLeadJids((prev) => {
                    const next = { ...prev };
                    filteredLeads.forEach((l) => {
                      next[l.jid] = checked;
                    });
                    return next;
                  });
                }}
              />
              Selecionar todos filtrados
            </label>
          </div>

          <div className="max-h-[280px] overflow-y-auto rounded-xl border border-frost-border/40 divide-y divide-frost-border/30">
            {leadsQ.isLoading && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin inline mr-2" />
                Carregando leads...
              </div>
            )}
            {!leadsQ.isLoading && filteredLeads.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhum lead encontrado para este filtro.
              </div>
            )}
            {filteredLeads.map((lead) => (
              <label key={lead.jid} className="p-3 flex items-center gap-3 hover:bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={!!selectedLeadJids[lead.jid]}
                  onChange={(e) =>
                    setSelectedLeadJids((prev) => ({ ...prev, [lead.jid]: e.target.checked }))
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold truncate">{lead.name || lead.jid}</div>
                  <TextMono className="text-[10px] opacity-60 truncate block">{lead.jid}</TextMono>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border",
                    lead.ai_enabled
                      ? "border-green-500/40 text-green-400"
                      : "border-border/30 text-muted-foreground",
                  )}
                >
                  {lead.ai_enabled ? "IA ON" : "IA OFF"}
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <TextSmall className="text-muted-foreground">Selecionados: {selectedCount}</TextSmall>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCount === 0 || batchMut.isPending}
                onClick={() => batchMut.mutate(true)}
              >
                {batchMut.isPending ? <Loader2 className="size-3 mr-2 animate-spin" /> : null}
                Ativar IA nos selecionados
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCount === 0 || batchMut.isPending}
                onClick={() => batchMut.mutate(false)}
              >
                {batchMut.isPending ? <Loader2 className="size-3 mr-2 animate-spin" /> : null}
                Desativar IA nos selecionados
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5 space-y-4">
        <div>
          <HeadingSub className="text-[18px] mb-1">Categorias de Conversa</HeadingSub>
          <TextSmall className="text-muted-foreground">
            Controle as categorias exibidas no Inbox e personalize classificações como amigo,
            família e marketing.
          </TextSmall>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={newConversationCategory}
            onChange={(e) => setNewConversationCategory(e.target.value)}
            placeholder="ex.: amigo, familia, marketing"
            className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground flex-1"
          />
          <Button variant="outline" size="sm" onClick={addConversationCategory}>
            <Plus className="size-3 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="rounded-xl border border-frost-border/40 divide-y divide-frost-border/30">
          {conversationCategories.map((cat) => {
            const visible = visibleConversationCategories.includes(cat);
            const isBase = ["lead", "group", "personal", "business"].includes(cat);
            return (
              <div key={cat} className="p-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => toggleVisibleCategory(cat, e.target.checked)}
                  />
                  <span className="font-semibold">{formatConversationCategoryLabel(cat)}</span>
                  <TextMono className="text-[10px] opacity-60">{cat}</TextMono>
                </label>
                {!isBase ? (
                  <button
                    type="button"
                    onClick={() => removeConversationCategory(cat)}
                    className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Remover
                  </button>
                ) : (
                  <TextSmall className="text-[10px] text-muted-foreground">base</TextSmall>
                )}
              </div>
            );
          })}

          {conversationCategories.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma categoria cadastrada.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={() => saveConversationCategoriesMut.mutate()}
            disabled={
              saveConversationCategoriesMut.isPending ||
              conversationCategories.length === 0 ||
              visibleConversationCategories.length === 0
            }
          >
            {saveConversationCategoriesMut.isPending ? (
              <Loader2 className="size-3 mr-2 animate-spin" />
            ) : (
              <Save className="size-3 mr-2" />
            )}
            Salvar categorias
          </Button>
        </div>
      </div>
    </section>
  );
}

function DispatchSettings() {
  const getDispatchFn = useServerFn(getDispatchSettings);
  const saveDispatchFn = useServerFn(saveDispatchSettings);
  const [secretaria, setSecretaria] = useState("");
  const [comercial, setComercial] = useState("");
  const [followupNotify, setFollowupNotify] = useState("");

  const dispatchQ = useQuery({
    queryKey: ["settings", "dispatch"],
    queryFn: () => getDispatchFn(),
  });

  useEffect(() => {
    if (dispatchQ.data?.ok && dispatchQ.data.settings) {
      setSecretaria(dispatchQ.data.settings.secretaria || "");
      setComercial(dispatchQ.data.settings.comercial || "");
      setFollowupNotify(dispatchQ.data.settings.followupNotify || "");
    }
  }, [dispatchQ.data]);

  const saveMut = useMutation({
    mutationFn: () =>
      saveDispatchFn({
        data: { secretaria, comercial, followupNotify },
      }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Destinos de despacho salvos");
      } else {
        toast.error(res?.error || "Erro ao salvar");
      }
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section className="space-y-8">
      <div className="border-b border-frost-border pb-6">
        <HeadingSub className="mb-2">Destinos de Despacho</HeadingSub>
        <TextSmall className="text-muted-foreground">
          Números WhatsApp (somente dígitos, com DDI) que receberão briefings do inbox.
        </TextSmall>
      </div>
      <div className="grid gap-6 max-w-lg">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Secretaria
          </label>
          <Input
            value={secretaria}
            onChange={(e) => setSecretaria(e.target.value.replace(/\D/g, ""))}
            placeholder="5511999999999"
            className="bg-muted font-mono"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Equipe comercial
          </label>
          <Input
            value={comercial}
            onChange={(e) => setComercial(e.target.value.replace(/\D/g, ""))}
            placeholder="5511888888888"
            className="bg-muted font-mono"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Follow-up (operador)
          </label>
          <Input
            value={followupNotify}
            onChange={(e) => setFollowupNotify(e.target.value.replace(/\D/g, ""))}
            placeholder="5511777777777"
            className="bg-muted font-mono"
          />
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Salvar destinos
        </Button>
      </div>
    </section>
  );
}

function InstanceSettings() {
  return <InstancesPanel />;
}

function SecuritySettings() {
  return (
    <section className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="size-4 text-muted-foreground" />
            <TextSmall className="uppercase tracking-widest text-[10px] text-muted-foreground">
              Credenciais
            </TextSmall>
          </div>
          <TextSmall className="text-muted-foreground">
            Chaves de API ficam no servidor e não são expostas para o cliente. Ajustes sensíveis
            devem ser feitos por variáveis de ambiente.
          </TextSmall>
        </div>

        <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="size-4 text-muted-foreground" />
            <TextSmall className="uppercase tracking-widest text-[10px] text-muted-foreground">
              Webhooks
            </TextSmall>
          </div>
          <TextSmall className="text-muted-foreground">
            Eventos de entrada são processados no servidor com validação de token e persistência em
            banco local.
          </TextSmall>
        </div>
      </div>

      <div className="rounded-2xl border border-red-5/30 bg-red-5/5 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="size-4 text-red-5" />
          <TextSmall className="uppercase tracking-widest text-[10px] text-red-5">
            Ações críticas
          </TextSmall>
        </div>
        <TextSmall className="text-red-5/80">
          Exclusões em massa e reset geral não estão disponíveis nesta tela para evitar operação
          acidental.
        </TextSmall>
      </div>
    </section>
  );
}

function AppearanceSettings() {
  const { currentTheme, themes, setTheme, setCustomColor, customColor } = useTheme();
  const [pickerColor, setPickerColor] = useState(customColor || "#ff801f");

  const themeColors: Record<string, string> = {
    orange: "#ff801f",
    blue: "#3b82f6",
    green: "#22c55e",
    purple: "#a855f7",
    rose: "#f43f5e",
    cyan: "#06b6d4",
    amber: "#f59e0b",
    violet: "#8b5cf6",
  };

  const handleColorPick = (hex: string) => {
    setPickerColor(hex);
    setCustomColor(hex);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-4 text-muted-foreground" />
          <TextSmall className="uppercase tracking-widest text-[10px] text-muted-foreground">
            Cores Pré-definidas
          </TextSmall>
        </div>
        <TextSmall className="text-muted-foreground mb-6 block">
          Escolha a cor principal da interface. A alteração é aplicada imediatamente em todos os
          elementos.
        </TextSmall>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {Object.entries(themes).map(([id, theme]) => {
            const isActive = currentTheme.id === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className="group flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div
                    className="size-10 rounded-xl transition-all duration-200 ring-2 ring-offset-2 ring-offset-void"
                    style={
                      {
                        backgroundColor: themeColors[id],
                        "--tw-ring-color": isActive ? themeColors[id] : "transparent",
                      } as React.CSSProperties
                    }
                  />
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="size-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
                <TextSmall
                  className={`text-[10px] transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {theme.name}
                </TextSmall>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-4 text-muted-foreground" />
          <TextSmall className="uppercase tracking-widest text-[10px] text-muted-foreground">
            Cor Personalizada
          </TextSmall>
        </div>
        <TextSmall className="text-muted-foreground mb-4 block">
          Escolha qualquer cor usando o seletor abaixo.
        </TextSmall>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="color"
              value={pickerColor}
              onChange={(e) => handleColorPick(e.target.value)}
              className="size-12 rounded-xl cursor-pointer border-2 border-frost-border bg-transparent p-1"
            />
            {currentTheme.id === "custom" && (
              <div className="absolute -top-1 -right-1 size-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="size-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <TextMono className="text-[12px] text-foreground uppercase">{pickerColor}</TextMono>
            <TextSmall className="text-muted-foreground text-[10px]">
              {currentTheme.id === "custom" ? "Cor ativa" : "Clique para aplicar"}
            </TextSmall>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-frost-border bg-white/[0.02] p-5">
        <TextSmall className="uppercase tracking-widest text-[10px] text-muted-foreground mb-4 block">
          Pré-visualização
        </TextSmall>
        <div className="flex flex-wrap gap-3">
          <Button variant="default" size="sm">
            Botão Primário
          </Button>
          <Button variant="outline" size="sm">
            Botão Outline
          </Button>
          <Button variant="secondary" size="sm">
            Botão Secundário
          </Button>
          <Button variant="ghost" size="sm">
            Botão Ghost
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-primary/20">
            <div className="h-full w-3/5 rounded-full bg-primary" />
          </div>
          <TextMono className="text-[11px] text-primary">60%</TextMono>
        </div>
      </div>
    </section>
  );
}
