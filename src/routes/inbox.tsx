import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { LEADS, STATUS_LABELS, type Lead, type LineId } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import {
  Search, Filter, Send, Paperclip, Smile, Sparkles,
  Phone, Building2, MapPin, Tag as TagIcon, Plus, ArrowRight,
  MessageSquare, FileText, Users2, Clock, Mic, Check, CheckCheck, MoreHorizontal, Info
} from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Leadflow" },
      { name: "description", content: "Inbox unificada das duas linhas WhatsApp com perfil de lead em tempo real." },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const [selectedId, setSelectedId] = useState<string>(LEADS[0].id);
  const [lineFilter, setLineFilter] = useState<"all" | LineId>("all");
  const [query, setQuery] = useState("");
  const lead = LEADS.find((l) => l.id === selectedId)!;

  const filtered = LEADS.filter((l) =>
    (lineFilter === "all" || l.line === lineFilter) &&
    (l.name.toLowerCase().includes(query.toLowerCase()) || l.lastMessage.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="h-screen flex">
      {/* Conversations list */}
      <section className="w-[340px] shrink-0 border-r border-border flex flex-col bg-sidebar/30 backdrop-blur-xl relative z-10">
        <div className="p-5 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-section text-[20px] font-bold tracking-tight">Conversas</h1>
            <div className="flex gap-1">
              <button className="size-8 rounded-md frost-border grid place-items-center hover:bg-white/5 transition-all active:scale-90">
                <Plus className="size-4" />
              </button>
              <button className="size-8 rounded-md frost-border grid place-items-center hover:bg-white/5 transition-all active:scale-90">
                <Filter className="size-4" />
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-[oklch(0.06_0_0)] frost-border rounded-lg pl-10 pr-4 py-2.5 text-[13.5px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring focus:bg-[oklch(0.08_0_0)] transition-all"
            />
          </div>
          
          <div className="flex gap-1.5 p-1 bg-black/20 rounded-lg frost-border">
            {(["all", "L1", "L2"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setLineFilter(opt)}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-bold tracking-wider transition-all rounded-md font-mono uppercase",
                  lineFilter === opt
                    ? "bg-foreground text-background shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {opt === "all" ? "Todas" : opt}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-border/20 scrollbar-hide">
          {filtered.map((l, index) => {
            const active = l.id === selectedId;
            return (
              <li key={l.id} className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                <button
                  onClick={() => setSelectedId(l.id)}
                  className={cn(
                    "w-full text-left px-5 py-4 flex gap-4 transition-all duration-300 relative group",
                    active ? "bg-[oklch(0.1_0_0)] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" : "hover:bg-white/[0.03]"
                  )}
                >
                  {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-foreground" />}
                  
                  <div className="relative shrink-0">
                    <div className="size-11 rounded-full grid place-items-center text-[14px] font-bold bg-[oklch(0.12_0_0)] frost-border group-hover:scale-105 transition-transform duration-300">
                      {l.initials}
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 text-[8px] font-mono px-1.5 py-0.5 rounded-full font-black border-2 border-background",
                        l.line === "L1"
                          ? "bg-orange text-black"
                          : "bg-blue text-white"
                      )}
                    >
                      {l.line}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-[14px] font-semibold truncate", active ? "text-foreground" : "text-foreground/80")}>
                        {l.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter shrink-0 ml-2">
                        {l.lastTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] text-muted-foreground/80 truncate leading-snug">
                        {l.lastMessage}
                      </span>
                      {l.unread > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 min-w-[18px] text-center rounded-full bg-green text-black text-[10px] font-black shadow-[0_0_10px_rgba(17,255,153,0.3)] shrink-0">
                          {l.unread}
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

      {/* Chat */}
      <section className="flex-1 flex flex-col min-w-0 border-r border-border bg-[oklch(0.01_0_0)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue/5 via-transparent to-transparent pointer-events-none opacity-50" />
        <ChatHeader lead={lead} />
        
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide relative z-10">
          <div className="text-center py-4">
            <span className="pill px-3 py-1 bg-white/5 border border-white/10 text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
              Hoje
            </span>
          </div>
          
          {lead.messages.map((m, i) => {
            const isMe = m.from === "me";
            return (
              <div 
                key={m.id} 
                className={cn(
                  "flex animate-in fade-in slide-in-from-bottom-2 duration-300", 
                  isMe ? "justify-end" : "justify-start"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed shadow-sm transition-all duration-300",
                      isMe
                        ? "bg-foreground text-background rounded-tr-none hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        : "frost-border bg-card/60 backdrop-blur-md rounded-tl-none hover:bg-card/80"
                    )}
                  >
                    <p>{m.text}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 mt-1 px-1",
                    isMe ? "flex-row" : "flex-row-reverse"
                  )}>
                    <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                      {m.time}
                    </span>
                    {isMe && <CheckCheck className="size-3 text-blue" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="h-2" />
        </div>
        
        <ChatComposer />
      </section>

      {/* Lead Card */}
      <LeadCard lead={lead} />
    </div>
  );
}

function ChatHeader({ lead }: { lead: Lead }) {
  return (
    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-full grid place-items-center text-[13px] font-bold bg-[oklch(0.12_0_0)] frost-border relative group">
          {lead.initials}
          <span className="absolute bottom-0 right-0 size-2.5 bg-green rounded-full border-2 border-background shadow-[0_0_8px_rgba(17,255,153,0.5)]" />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight">{lead.name}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <span className={cn(
                "size-1.5 rounded-full",
                lead.line === "L1" ? "bg-orange" : "bg-blue"
              )} />
              {lead.phone}
            </span>
            <span>·</span>
            <span className="text-green animate-pulse font-medium">digitando…</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="size-9 rounded-full frost-border grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <Phone className="size-4" />
        </button>
        <button className="size-9 rounded-full frost-border grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <MoreHorizontal className="size-4" />
        </button>
        <div className="w-[1px] h-6 bg-border mx-2" />
        <button className="pill bg-white/5 frost-border px-4 py-2 text-[12.5px] font-bold text-foreground hover:bg-[oklch(0.74_0.18_45/0.2)] hover:text-orange hover:border-orange/30 transition-all duration-300 flex items-center gap-2 group">
          <Sparkles className="size-3.5 text-orange group-hover:animate-bounce" /> 
          <span>Analisar com IA</span>
        </button>
      </div>
    </div>
  );
}

function ChatComposer() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <div className="border-t border-border p-5 bg-black/40 backdrop-blur-md relative z-20">
      <div className="frost-border rounded-2xl bg-[oklch(0.04_0_0)] p-2 flex items-end gap-1.5 focus-within:ring-1 focus-within:ring-ring focus-within:bg-[oklch(0.06_0_0)] transition-all shadow-lg">
        <div className="flex gap-0.5">
          <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <Plus className="size-4.5" strokeWidth={2} />
          </button>
          <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <Smile className="size-4.5" strokeWidth={2} />
          </button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-transparent resize-none outline-none text-[15px] py-2 px-1 placeholder:text-muted-foreground/50 leading-relaxed scrollbar-hide"
        />
        
        <div className="flex gap-1 items-center pb-0.5">
          <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <Mic className="size-4.5" strokeWidth={2} />
          </button>
          <button 
            disabled={!text.trim()}
            className={cn(
              "size-9 rounded-xl grid place-items-center transition-all active:scale-90",
              text.trim() 
                ? "bg-foreground text-background shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                : "bg-white/5 text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            <Send className="size-4.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono flex items-center justify-center gap-1.5 opacity-60">
          <Info className="size-2.5" /> Use <kbd className="bg-white/10 px-1 rounded">Shift + Enter</kbd> para pular linha
        </p>
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <aside className="w-[380px] shrink-0 overflow-y-auto bg-card/40 backdrop-blur-xl border-l border-border animate-in slide-in-from-right duration-500">
      <div className="p-8 border-b border-border bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 group">
            <div className="size-20 rounded-full grid place-items-center text-[24px] font-bold bg-[oklch(0.12_0_0)] frost-border group-hover:frost-ring transition-all duration-500 group-hover:scale-110">
              {lead.initials}
            </div>
            <button className="absolute bottom-0 right-0 size-7 bg-foreground text-background rounded-full grid place-items-center shadow-lg border-2 border-background hover:scale-110 transition-transform">
              <Plus className="size-3.5" />
            </button>
          </div>
          <h2 className="font-display text-[26px] tracking-tight leading-tight">{lead.name}</h2>
          <div className="flex items-center gap-1.5 justify-center mt-1 text-muted-foreground font-mono text-[12.5px]">
            <Phone className="size-3" /> {lead.phone}
          </div>
          
          <div className="flex items-center gap-2 justify-center mt-5">
            <span className={cn(
              "pill px-3 py-1 text-[10px] font-black uppercase tracking-widest border shadow-sm",
              lead.line === "L1" ? "border-orange/30 text-orange" : "border-blue/30 text-blue"
            )}>
              Linha {lead.line.slice(1)}
            </span>
            <span className="pill px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-foreground text-background shadow-lg">
              {STATUS_LABELS[lead.status]}
            </span>
          </div>
        </div>
        
        <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-white/5 relative group overflow-hidden">
          <div className="absolute top-0 right-0 size-24 bg-green opacity-5 blur-3xl group-hover:opacity-10 transition-opacity" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-section font-bold mb-1">
                Score de Qualificação
              </div>
              <div className="font-display text-[32px] tracking-tighter leading-none">
                {lead.score}<span className="text-muted-foreground/30 text-[18px] ml-1">/100</span>
              </div>
            </div>
            <div className="size-14 relative flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(0.12 0 0)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="oklch(0.86 0.2 155)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(lead.score / 100) * 94} 100`}
                  className="animate-in fade-in duration-1000"
                />
              </svg>
              <span className="absolute text-[11px] font-mono font-bold text-green">{lead.score}%</span>
            </div>
          </div>
        </div>
      </div>

      <Section title="Segmentação" icon={TagIcon}>
        <div className="flex flex-wrap gap-2">
          {lead.tags.map((t) => <TagPill key={t.id} tag={t} className="hover:scale-105 transition-transform" />)}
          <button className="pill px-2.5 py-1 text-[11px] font-bold frost-border text-muted-foreground hover:text-foreground hover:bg-white/5 inline-flex items-center gap-1.5 transition-all">
            <Plus className="size-3" /> ADICIONAR
          </button>
        </div>
      </Section>

      <Section title="Detalhes do Perfil" icon={Building2}>
        <dl className="space-y-4 text-[13px]">
          <Row icon={Building2} label="Empresa" value={lead.company} />
          <Row icon={Users2} label="Cargo" value={lead.role} />
          <Row icon={MapPin} label="Cidade" value={lead.city} />
          <Row icon={Phone} label="Origem" value={lead.source} />
        </dl>
        <button className="w-full mt-4 py-2 text-[11px] font-bold uppercase tracking-widest frost-border rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          Editar Perfil
        </button>
      </Section>

      {lead.insights && (
        <Section title="Insights IA" icon={Sparkles} accent>
          <div className="relative">
            <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-orange/30 rounded-full" />
            <p className="text-[14px] leading-relaxed text-foreground/90 mb-5 italic font-display">
              "{lead.insights.summary}"
            </p>
          </div>
          
          <div className="space-y-2.5 mb-6">
            {lead.insights.bullets.map((b, i) => (
              <div key={i} className="flex gap-3 text-[12.5px] group">
                <span className="text-orange font-bold group-hover:scale-125 transition-transform">·</span>
                <span className="text-foreground/80 leading-snug">{b}</span>
              </div>
            ))}
          </div>
          
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-section font-bold mb-3 flex items-center gap-2">
            <div className="h-[1px] flex-1 bg-border/40" />
            PRÓXIMOS PASSOS
            <div className="h-[1px] flex-1 bg-border/40" />
          </div>
          
          <div className="space-y-2">
            {lead.insights.nextSteps.map((s, i) => (
              <div key={i} className="flex gap-3 text-[12.5px] frost-border rounded-xl px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group/step cursor-default">
                <ArrowRight className="size-3.5 text-green mt-0.5 shrink-0 group-hover/step:translate-x-1 transition-transform" />
                <span className="leading-snug">{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Notas Internas" icon={FileText}>
        <div className="space-y-3">
          {lead.notes.length === 0 && (
            <p className="text-[12.5px] text-muted-foreground italic bg-black/20 p-4 rounded-xl border border-dashed border-border/40">
              Nenhuma anotação estratégica registrada.
            </p>
          )}
          {lead.notes.map((n) => (
            <div key={n.id} className="frost-border rounded-xl p-3.5 bg-white/[0.01] hover:frost-ring transition-all group/note">
              <p className="text-[13px] leading-relaxed text-foreground/90">{n.text}</p>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-tighter">{n.at}</span>
                <button className="text-[10px] text-muted-foreground hover:text-red transition-colors opacity-0 group-hover/note:opacity-100">Excluir</button>
              </div>
            </div>
          ))}
          <button className="w-full py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 frost-border border-dashed rounded-xl transition-all">
            <Plus className="size-4" /> ADICIONAR NOTA
          </button>
        </div>
      </Section>

      <Section title="Ações de Despacho" icon={Send}>
        <div className="space-y-3">
          <DispatchButton label="Enviar para Secretaria" sub="WhatsApp · resumo + insights" icon={Users2} />
          <DispatchButton label="Enviar para Equipe Interna" sub="WhatsApp · briefing técnico" icon={Building2} />
          <DispatchButton label="Agendar follow-up" sub="Lembrete + push" icon={Clock} />
        </div>
      </Section>

      <div className="p-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-section">
          · timeline registrada
        </p>
      </div>
    </aside>
  );
}

function Section({
  title, icon: Icon, accent, children,
}: { title: string; icon: React.ComponentType<{ className?: string }>; accent?: boolean; children: React.ReactNode }) {
  return (
    <section className={`px-6 py-5 border-b border-border ${accent ? "bg-[oklch(0.74_0.18_45/0.04)]" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`size-3.5 ${accent ? "text-[oklch(0.74_0.18_45)]" : "text-muted-foreground"}`} />
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-section font-semibold">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </span>
      <span className="text-foreground/90 truncate">{value ?? "—"}</span>
    </div>
  );
}

function DispatchButton({
  label, sub, icon: Icon = MessageSquare,
}: { label: string; sub: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <button className="w-full frost-border rounded-lg p-3 text-left flex items-center gap-3 hover:bg-white/[0.03] transition-colors group">
      <span className="size-8 rounded-md grid place-items-center bg-[oklch(0.12_0_0)] group-hover:bg-[oklch(0.74_0.18_45/0.15)]">
        <Icon className="size-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
      <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
    </button>
  );
}
