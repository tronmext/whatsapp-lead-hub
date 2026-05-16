import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { STATUS_LABELS } from "@/lib/lead-constants";
import { getInstanceAccent, getInstanceIdList } from "@/lib/utils/instance-accent";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MessageSquare,
  Phone,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getLeads,
  updateLeadStatus,
  getInstances,
  createLead,
  requalifyLead,
} from "@/lib/server-functions";

const ACTIVE_INSTANCE_KEY = "evolution.activeInstance";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Helper to format phone from JID
function formatPhoneFromJid(jid: string): string {
  const phone = jid.split("@")[0]?.replace(/\D+/g, "") ?? "";
  if (!phone) return jid;
  if (phone.length >= 12) {
    const cc = phone.slice(0, 2);
    const ar = phone.slice(2, 4);
    const mid = phone.slice(4, phone.length - 4);
    const end = phone.slice(-4);
    return `+${cc} ${ar} ${mid}-${end}`;
  }
  return `+${phone}`;
}

export const Route = createFileRoute("/leads")({
  loader: async () => {
    const leads = await getLeads();
    return { leads };
  },
  head: () => ({
    meta: [
      { title: "Leads — Leadflow" },
      {
        name: "description",
        content: "Banco completo de leads, filtros e visualização Kanban premium.",
      },
    ],
  }),
  component: LeadsPage,
});

type ViewMode = "table" | "kanban";

const COLUMNS: ("novo" | "negociacao" | "qualificado" | "perdido")[] = [
  "novo",
  "negociacao",
  "qualificado",
  "perdido",
];

function LeadsPage() {
  const { leads: initialLeads } = Route.useLoaderData();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newInstanceId, setNewInstanceId] = useState("");
  const [qualifyingJid, setQualifyingJid] = useState<string | null>(null);
  const qc = useQueryClient();
  const updateStatusFn = useServerFn(updateLeadStatus);
  const getInstancesFn = useServerFn(getInstances);
  const createLeadFn = useServerFn(createLead);
  const getLeadsFn = useServerFn(getLeads);
  const requalifyLeadFn = useServerFn(requalifyLead);

  const leadsQ = useQuery({
    queryKey: ["leads"],
    queryFn: () => getLeadsFn(),
    initialData: initialLeads,
    staleTime: 20000,
  });

  const [leads, setLeads] = useState(initialLeads);

  useEffect(() => {
    if (leadsQ.data) setLeads(leadsQ.data);
  }, [leadsQ.data]);

  const createLeadMut = useMutation({
    mutationFn: async () => {
      const phone = newPhone.replace(/\D+/g, "");
      if (phone.length < 10) throw new Error("Informe um telefone válido com DDI e DDD");
      const instanceId =
        newInstanceId ||
        (typeof window !== "undefined" ? localStorage.getItem(ACTIVE_INSTANCE_KEY) || "" : "");
      if (!instanceId) throw new Error("Selecione uma instância WhatsApp");
      return createLeadFn({
        data: { jid: phone, name: newName, instanceId },
      });
    },
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Lead criado com sucesso");
        setNewLeadOpen(false);
        setNewPhone("");
        setNewName("");
        qc.invalidateQueries({ queryKey: ["leads"] });
      } else {
        toast.error(result.error || "Erro ao criar lead");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const requalifyMut = useMutation({
    mutationFn: async (lead: { jid: string; instance_id: string }) => {
      setQualifyingJid(lead.jid);
      return requalifyLeadFn({
        data: { jid: lead.jid, instanceId: lead.instance_id },
      });
    },
    onSuccess: (res) => {
      setQualifyingJid(null);
      if (!res?.ok) {
        toast.error(
          res?.error === "ai_keys_missing"
            ? "Configure as chaves de IA no ambiente"
            : res?.error || "Falha na qualificação",
        );
        return;
      }
      toast.success(`Lead qualificado (${res.score ?? 0}/100)`);
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: Error) => {
      setQualifyingJid(null);
      toast.error(err.message);
    },
  });

  const instancesQ = useQuery({
    queryKey: ["instances", "aliases"],
    queryFn: () => getInstancesFn(),
    staleTime: 15000,
    refetchInterval: 60000,
  });

  const aliasMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (instancesQ.data) {
      instancesQ.data.forEach((inst: { name: string; alias?: string }) => {
        map[inst.name] = inst.alias ?? inst.name;
      });
    }
    return map;
  }, [instancesQ.data]);

  const instanceIds = useMemo(
    () => getInstanceIdList(instancesQ.data as { name: string }[] | undefined),
    [instancesQ.data],
  );

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem(ACTIVE_INSTANCE_KEY);
    if (stored) setNewInstanceId(stored);
  }, []);

  useEffect(() => {
    if (instancesQ.data?.length && !newInstanceId) {
      const first = (instancesQ.data as { name: string }[])[0]?.name;
      if (first) setNewInstanceId(first);
    }
  }, [instancesQ.data, newInstanceId]);

  const handleRequalify = (lead: { jid: string; instance_id: string }, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lead.instance_id) {
      toast.error("Lead sem instância associada");
      return;
    }
    requalifyMut.mutate(lead);
  };

  const filteredLeads = leads.filter(
    (l) => l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.jid.includes(searchQuery),
  );

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index)
      return;

    const leadIndex = leads.findIndex((l) => l.jid === draggableId);
    if (leadIndex === -1) return;

    const previousLeads = [...leads];
    const updatedLeads = [...leads];
    const [movedLead] = updatedLeads.splice(leadIndex, 1);

    const leadWithNewStatus = {
      ...movedLead,
      status: destination.droppableId as any,
    };

    updatedLeads.push(leadWithNewStatus);
    setLeads(updatedLeads);

    updateStatusFn({ data: { jid: draggableId, status: destination.droppableId } })
      .then((res) => {
        if (res && "ok" in res && res.ok === false) {
          toast.error((res as { error?: string }).error || "Erro ao atualizar status");
          setLeads(previousLeads);
          return;
        }
        qc.invalidateQueries({ queryKey: ["leads"] });
      })
      .catch((err: Error) => {
        toast.error("Erro ao atualizar status: " + err.message);
        setLeads(previousLeads);
      });
  };

  return (
    <div className="relative min-h-screen bg-void flex flex-col animate-in fade-in duration-1000">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />

      <header className="px-6 md:px-12 pt-12 md:pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <TextSmall className="text-muted-foreground opacity-70 mb-3 block font-mono tracking-widest uppercase">
              Pipeline de Vendas · {filteredLeads.length} leads
            </TextSmall>
            <HeadingHero className="text-[48px] md:text-[72px] leading-none mb-0">
              Leads
            </HeadingHero>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-white/[0.02] border border-frost-border/60 rounded-xl">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                  viewMode === "kanban"
                    ? "bg-near-white text-void"
                    : "text-muted-foreground hover:text-near-white",
                )}
              >
                <LayoutGrid className="size-4" />
                <span className="text-[11px] font-black uppercase tracking-widest font-mono">
                  Kanban
                </span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                  viewMode === "table"
                    ? "bg-near-white text-void"
                    : "text-muted-foreground hover:text-near-white",
                )}
              >
                <List className="size-4" />
                <span className="text-[11px] font-black uppercase tracking-widest font-mono">
                  Tabela
                </span>
              </button>
            </div>
            <Button
              variant="default"
              size="default"
              className="px-8"
              onClick={() => setNewLeadOpen(true)}
            >
              NOVO LEAD <Plus className="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/[0.02] border border-frost-border/60 p-1.5 rounded-xl">
          <div className="relative flex-1 group">
            <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-near-white transition-colors" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar leads, telefone..."
              className="w-full bg-transparent pl-12 pr-4 py-3 text-[13px] outline-none placeholder:text-muted-foreground/25 font-mono"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 md:px-12 pb-12 overflow-hidden flex flex-col">
        {isClient ? (
          viewMode === "kanban" ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-hide">
                {COLUMNS.map((status) => (
                  <div key={status} className="flex flex-col w-[320px] shrink-0">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-2 rounded-full",
                            status === "novo"
                              ? "bg-blue-10"
                              : status === "negociacao"
                                ? "bg-orange-10"
                                : status === "qualificado"
                                  ? "bg-green-4"
                                  : "bg-red-5",
                          )}
                        />
                        <HeadingSub className="text-[14px] uppercase tracking-[0.2em] mb-0 opacity-80">
                          {STATUS_LABELS[status]}
                        </HeadingSub>
                      </div>
                      <TextMono className="text-[11px] opacity-40">
                        {filteredLeads.filter((l) => l.status === status).length}
                      </TextMono>
                    </div>

                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={cn(
                            "flex-1 flex flex-col gap-4 p-3 rounded-2xl transition-colors min-h-[500px]",
                            snapshot.isDraggingOver ? "bg-white/[0.03]" : "bg-transparent",
                          )}
                        >
                          {filteredLeads
                            .filter((l) => l.status === status)
                            .map((lead, index) => (
                              <Draggable key={lead.jid} draggableId={lead.jid} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "group relative transition-all duration-300",
                                      snapshot.isDragging
                                        ? "z-50 scale-105 rotate-2"
                                        : "hover:-translate-y-1",
                                    )}
                                  >
                                    <Link to="/inbox" search={{ jid: lead.jid }} className="block">
                                      <ResendCard
                                        className={cn(
                                          "p-5 bg-white/[0.02] border-frost-border/30 hover:border-white/20 transition-all shadow-lg backdrop-blur-md cursor-pointer",
                                          snapshot.isDragging &&
                                            "shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/[0.05] border-white/40",
                                        )}
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="size-12 rounded-full grid place-items-center text-[14px] font-bold bg-gradient-to-br from-orange-10/20 to-blue-10/20 frost-border shadow-inner">
                                            {lead.name?.slice(0, 2).toUpperCase() || "??"}
                                          </div>
                                          <div
                                            className={cn(
                                              "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider font-mono border",
                                              (() => {
                                                const a = getInstanceAccent(
                                                  lead.instance_id,
                                                  instanceIds,
                                                );
                                                return `${a.bg} ${a.text} ${a.border}`;
                                              })(),
                                            )}
                                          >
                                            {aliasMap[lead.instance_id] ?? lead.instance_id}
                                          </div>
                                        </div>

                                        <h3 className="text-[15px] font-semibold text-near-white mb-0.5 group-hover:text-white transition-colors truncate">
                                          {lead.name || "Sem nome"}
                                        </h3>
                                        <TextMono className="text-[11px] opacity-50 block mb-3">
                                          {formatPhoneFromJid(lead.jid)}
                                        </TextMono>

                                        {/* Score bar */}
                                        <div className="flex items-center gap-2 mb-3">
                                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                              className={cn(
                                                "h-full rounded-full transition-all",
                                                lead.score >= 70
                                                  ? "bg-green-4"
                                                  : lead.score >= 40
                                                    ? "bg-orange-10"
                                                    : "bg-red-5/60",
                                              )}
                                              style={{ width: `${lead.score}%` }}
                                            />
                                          </div>
                                          <TextMono className="text-[11px] font-bold">
                                            {lead.score}
                                          </TextMono>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 pt-3 border-t border-frost-border/10">
                                          <a
                                            href={`tel:+${lead.jid.split("@")[0]}`}
                                            className="size-7 rounded-lg bg-white/[0.03] border border-frost-border/30 grid place-items-center hover:bg-white/[0.08] hover:border-white/20 transition-all"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Phone className="size-3.5 text-muted-foreground" />
                                          </a>
                                          <Link
                                            to="/inbox"
                                            search={{ jid: lead.jid }}
                                            className="size-7 rounded-lg bg-white/[0.03] border border-frost-border/30 grid place-items-center hover:bg-white/[0.08] hover:border-white/20 transition-all"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MessageSquare className="size-3.5 text-muted-foreground" />
                                          </Link>
                                          <button
                                            className="size-7 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center hover:bg-primary/20 transition-all ml-auto disabled:opacity-50"
                                            disabled={
                                              qualifyingJid === lead.jid && requalifyMut.isPending
                                            }
                                            onClick={(e) => handleRequalify(lead, e)}
                                          >
                                            {qualifyingJid === lead.jid &&
                                            requalifyMut.isPending ? (
                                              <Loader2 className="size-3.5 text-primary animate-spin" />
                                            ) : (
                                              <Sparkles className="size-3.5 text-primary" />
                                            )}
                                          </button>
                                        </div>
                                      </ResendCard>
                                    </Link>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          ) : (
            <ResendCard
              variant="large"
              className="overflow-hidden bg-card/20 shadow-2xl flex-1 border-frost-border/20"
            >
              <div className="overflow-x-auto h-full scrollbar-hide">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-black font-mono border-b border-frost-border bg-void/90 backdrop-blur-md">
                      <th className="px-8 py-5">Lead</th>
                      <th className="px-8 py-5">Linha</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Score</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-frost-border/10">
                    {filteredLeads.map((l) => (
                      <tr key={l.jid} className="group transition-all hover:bg-white/[0.03]">
                        <td className="px-8 py-6">
                          <Link
                            to="/inbox"
                            search={{ jid: l.jid }}
                            className="flex items-center gap-4"
                          >
                            <div className="size-10 rounded-full grid place-items-center text-[12px] font-bold bg-gradient-to-br from-orange-10/20 to-blue-10/20 frost-border group-hover:frost-ring transition-all duration-300">
                              {l.name?.slice(0, 2).toUpperCase() || "??"}
                            </div>
                            <div>
                              <div className="text-[15px] font-semibold text-near-white">
                                {l.name || "Sem nome"}
                              </div>
                              <TextMono className="text-[11px] opacity-50">
                                {formatPhoneFromJid(l.jid)}
                              </TextMono>
                            </div>
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={cn(
                              "pill px-3 py-1 text-[9px] font-mono font-black uppercase tracking-wider border",
                              (() => {
                                const a = getInstanceAccent(l.instance_id, instanceIds);
                                return `${a.bg} ${a.text} ${a.border}`;
                              })(),
                            )}
                          >
                            {aliasMap[l.instance_id] ?? l.instance_id}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[13px] font-medium text-near-white/80">
                            {STATUS_LABELS[l.status as keyof typeof STATUS_LABELS] || l.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <TextMono className="text-[15px] font-bold text-near-white block">
                            {l.score}
                            <span className="text-muted-foreground/30 font-medium text-[10px] ml-1">
                              /100
                            </span>
                          </TextMono>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <a
                              href={`tel:+${l.jid.split("@")[0]}`}
                              className="size-7 rounded-lg bg-white/[0.03] border border-frost-border/30 grid place-items-center hover:bg-white/[0.08] transition-all"
                            >
                              <Phone className="size-3.5 text-muted-foreground" />
                            </a>
                            <Link
                              to="/inbox"
                              search={{ jid: l.jid }}
                              className="size-7 rounded-lg bg-white/[0.03] border border-frost-border/30 grid place-items-center hover:bg-white/[0.08] transition-all"
                            >
                              <MessageSquare className="size-3.5 text-muted-foreground" />
                            </Link>
                            <button
                              className="size-7 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center hover:bg-primary/20 transition-all disabled:opacity-50"
                              disabled={qualifyingJid === l.jid && requalifyMut.isPending}
                              onClick={(e) => {
                                e.preventDefault();
                                handleRequalify(l, e);
                              }}
                            >
                              {qualifyingJid === l.jid && requalifyMut.isPending ? (
                                <Loader2 className="size-3.5 text-primary animate-spin" />
                              ) : (
                                <Sparkles className="size-3.5 text-primary" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResendCard>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </main>

      {/* New Lead Dialog */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="bg-card border-border/20 text-foreground">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Adicione um novo lead manualmente ao pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Telefone (com DDI e DDD)
              </label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="5511997269626"
                className="bg-muted"
              />
            </div>
            {(instancesQ.data as { name: string; alias?: string }[] | undefined)?.length ? (
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Instância WhatsApp
                </label>
                <select
                  value={newInstanceId}
                  onChange={(e) => setNewInstanceId(e.target.value)}
                  className="w-full bg-muted border border-border/20 rounded-lg px-3 py-2 text-sm font-mono outline-none"
                >
                  {(instancesQ.data as { name: string; alias?: string }[]).map((inst) => (
                    <option key={inst.name} value={inst.name}>
                      {inst.alias ?? inst.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nome (opcional)
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do lead"
                className="bg-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewLeadOpen(false)}
              disabled={createLeadMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createLeadMut.mutate()}
              disabled={createLeadMut.isPending || !newPhone.trim()}
            >
              {createLeadMut.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Lead"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
