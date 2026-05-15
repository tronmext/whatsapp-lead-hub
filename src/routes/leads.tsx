import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { LEADS, STATUS_LABELS, type Lead } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { Search, Plus, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Leadflow" },
      { name: "description", content: "Banco completo de leads, filtros e visualização Kanban premium." },
    ],
  }),
  component: LeadsPage,
});

type ViewMode = "table" | "kanban";

const COLUMNS: Lead["status"][] = ["novo", "negociacao", "qualificado", "perdido"];

function LeadsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery)
  );

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updatedLeads = [...leads];
    const leadIndex = updatedLeads.findIndex(l => l.id === draggableId);
    
    if (leadIndex !== -1) {
      updatedLeads[leadIndex] = {
        ...updatedLeads[leadIndex],
        status: destination.droppableId as Lead["status"]
      };
      setLeads(updatedLeads);
    }
  };

  return (
    <div className="relative min-h-screen bg-void flex flex-col animate-in fade-in duration-1000">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />

      <header className="px-8 md:px-12 pt-12 md:pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <TextSmall className="text-muted-foreground opacity-80 mb-2 block font-mono tracking-widest uppercase">
              Pipeline de Vendas · {filteredLeads.length} leads
            </TextSmall>
            <HeadingHero className="text-[52px] md:text-[72px] leading-none mb-0">Leads</HeadingHero>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-white/[0.02] frost-border rounded-xl">
              <button 
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                  viewMode === "kanban" ? "bg-near-white text-void shadow-xl" : "text-muted-foreground hover:text-near-white"
                )}
              >
                <LayoutGrid className="size-4" />
                <span className="text-[11px] font-black uppercase tracking-widest font-mono">Kanban</span>
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                  viewMode === "table" ? "bg-near-white text-void shadow-xl" : "text-muted-foreground hover:text-near-white"
                )}
              >
                <List className="size-4" />
                <span className="text-[11px] font-black uppercase tracking-widest font-mono">Tabela</span>
              </button>
            </div>
            <Button variant="default" size="default" className="px-8 shadow-xl">
              NOVO LEAD <Plus className="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/[0.02] p-1.5 rounded-2xl frost-border backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-near-white transition-colors" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar leads, telefone, empresa..."
              className="w-full bg-transparent pl-12 pr-4 py-3 text-[13px] outline-none placeholder:text-muted-foreground/30 font-mono"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 md:px-12 pb-12 overflow-hidden flex flex-col">
        {isClient && viewMode === "kanban" ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-hide">
              {COLUMNS.map((status) => (
                <div key={status} className="flex flex-col w-[320px] shrink-0">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-2 rounded-full",
                        status === "novo" ? "bg-blue-10" : 
                        status === "negociacao" ? "bg-orange-10" :
                        status === "qualificado" ? "bg-green-4" : "bg-red-5"
                      )} />
                      <HeadingSub className="text-[14px] uppercase tracking-[0.2em] mb-0 opacity-80">
                        {STATUS_LABELS[status]}
                      </HeadingSub>
                    </div>
                    <TextMono className="text-[11px] opacity-40">
                      {filteredLeads.filter(l => l.status === status).length}
                    </TextMono>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 flex flex-col gap-4 p-3 rounded-2xl transition-colors min-h-[500px]",
                          snapshot.isDraggingOver ? "bg-white/[0.03]" : "bg-transparent"
                        )}
                      >
                        {filteredLeads.filter(l => l.status === status).map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "group relative transition-all duration-300",
                                  snapshot.isDragging ? "z-50 scale-105 rotate-2" : "hover:-translate-y-1"
                                )}
                              >
                                <ResendCard 
                                  className={cn(
                                    "p-5 bg-white/[0.02] border-frost-border/30 hover:border-white/20 transition-all shadow-lg backdrop-blur-md",
                                    snapshot.isDragging && "shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/[0.05] border-white/40"
                                  )}
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="size-10 rounded-full grid place-items-center text-[12px] font-bold bg-void frost-border shadow-inner">
                                      {lead.initials}
                                    </div>
                                    <div className={cn(
                                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider font-mono shadow-sm",
                                      lead.line === "L1" ? "bg-orange-10/10 text-orange-10 border border-orange-10/20" : "bg-blue-10/10 text-blue-10 border border-blue-10/20"
                                    )}>
                                      {lead.line}
                                    </div>
                                  </div>
                                  
                                  <h3 className="text-[16px] font-semibold text-near-white mb-1 group-hover:text-white transition-colors">
                                    {lead.name}
                                  </h3>
                                  <TextMono className="text-[11px] opacity-40 block mb-4">
                                    {lead.company || lead.phone}
                                  </TextMono>

                                  <div className="flex flex-wrap gap-1.5 mb-5">
                                    {lead.tags.slice(0, 2).map(t => (
                                      <TagPill key={t.id} tag={t} />
                                    ))}
                                    {lead.tags.length > 2 && (
                                      <span className="text-[9px] opacity-30 font-mono self-center ml-1">+{lead.tags.length - 2}</span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-4 border-t border-frost-border/10">
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-near-white/40" 
                                              style={{ width: `${lead.score}%` }} 
                                            />
                                          </div>
                                          <TextMono className="text-[9px] font-bold">{lead.score}</TextMono>
                                        </div>
                                      </div>
                                    </div>
                                    <TextMono className="text-[9px] opacity-30 uppercase tracking-widest">{lead.lastTime}</TextMono>
                                  </div>
                                </ResendCard>
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
          <ResendCard variant="large" className="overflow-hidden bg-card/20 shadow-2xl flex-1 border-frost-border/20">
            <div className="overflow-x-auto h-full scrollbar-hide">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-black font-mono border-b border-frost-border bg-void/90 backdrop-blur-md">
                    <th className="px-8 py-5">Lead</th>
                    <th className="px-8 py-5">Linha</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Tags</th>
                    <th className="px-8 py-5">Empresa</th>
                    <th className="px-8 py-5 text-right">Score</th>
                    <th className="px-8 py-5 text-right">Atividade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-frost-border/10">
                  {filteredLeads.map((l) => (
                    <tr key={l.id} className="group transition-all hover:bg-white/[0.03]">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-full grid place-items-center text-[12px] font-bold bg-void frost-border group-hover:frost-ring transition-all duration-300">
                            {l.initials}
                          </div>
                          <div>
                            <div className="text-[15px] font-semibold text-near-white">{l.name}</div>
                            <TextMono className="text-[11px] opacity-40">{l.phone}</TextMono>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "pill px-3 py-1 text-[9px] font-mono font-black uppercase tracking-wider",
                          l.line === "L1" ? "bg-orange-10/10 text-orange-10 border border-orange-10/20" : "bg-blue-10/10 text-blue-10 border border-blue-10/20"
                        )}>
                          {l.line}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[13px] font-medium text-near-white/80">{STATUS_LABELS[l.status]}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {l.tags.map((t) => <TagPill key={t.id} tag={t} />)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[13px] text-muted-foreground">{l.company ?? "—"}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <TextMono className="text-[15px] font-bold text-near-white block">
                          {l.score}<span className="text-muted-foreground/30 font-medium text-[10px] ml-1">/100</span>
                        </TextMono>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <TextMono className="text-[11px] opacity-40">{l.lastTime}</TextMono>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResendCard>
        )}
      </main>
    </div>
  );
}
