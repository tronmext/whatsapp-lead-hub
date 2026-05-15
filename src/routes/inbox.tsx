import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { LEADS, STATUS_LABELS, type Lead, type LineId } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Filter, Send, Paperclip, Smile, Sparkles,
  Phone, Building2, MapPin, Tag as TagIcon, Plus, ArrowRight,
  MessageSquare, FileText, Users2, Clock, Mic, Check, CheckCheck, MoreHorizontal, Info
} from "lucide-react";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { ResendButton } from "@/components/ResendButton";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Leadflow" },
      { name: "description", content: "Fluxo unificado e cinematográfico de atendimento via WhatsApp." },
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
    <div className="h-screen flex bg-void animate-in fade-in duration-700 overflow-hidden">
      {/* 01. Sidebar: Feed de Conversas */}
      <section className="w-[380px] shrink-0 border-r border-frost-border flex flex-col bg-white/[0.01] backdrop-blur-3xl relative z-10">
        <div className="p-8 border-b border-frost-border space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSub className="text-[24px] tracking-tight mb-0">Conversas</HeadingSub>
            <button className="size-9 rounded-full frost-border grid place-items-center hover:bg-white/5 transition-all active:scale-90">
              <Plus className="size-4.5" />
            </button>
          </div>
          
          <div className="relative group">
            <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-near-white transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no pipeline..."
              className="w-full bg-void frost-border rounded-xl pl-12 pr-4 py-3.5 text-[14px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-near-white/20 transition-all font-mono"
            />
          </div>
          
          <div className="flex p-1 bg-void rounded-xl frost-border animate-in zoom-in-95 duration-500 delay-100">
            {(["all", "L1", "L2"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setLineFilter(opt)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-lg font-mono",
                  lineFilter === opt
                    ? "bg-white/[0.08] text-near-white shadow-xl"
                    : "text-muted-foreground hover:text-near-white hover:bg-white/5"
                )}
              >
                {opt === "all" ? "Geral" : opt}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-frost-border/10 scrollbar-hide">
          {filtered.map((l, index) => {
            const active = l.id === selectedId;
            return (
              <li key={l.id} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                <button
                  onClick={() => setSelectedId(l.id)}
                  className={cn(
                    "w-full text-left px-8 py-6 flex gap-5 transition-all duration-500 relative group",
                    active ? "bg-white/[0.04] shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]" : "hover:bg-white/[0.02]"
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-10 bg-near-white rounded-full" />}
                  
                  <div className="relative shrink-0">
                    <div className={cn(
                      "size-14 rounded-full grid place-items-center text-[16px] font-bold bg-void frost-border transition-all duration-700",
                      active ? "scale-105 frost-ring" : "group-hover:scale-105"
                    )}>
                      {l.initials}
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 text-[9px] font-mono px-2 py-0.5 rounded-full font-black border-2 border-void shadow-2xl",
                        l.line === "L1" ? "bg-orange-10 text-void" : "bg-blue-10 text-near-white"
                      )}
                    >
                      {l.line}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("text-[15px] font-bold truncate tracking-tight transition-colors", active ? "text-near-white" : "text-near-white/80 group-hover:text-near-white")}>
                        {l.name}
                      </span>
                      <TextMono className="text-[10px] uppercase tracking-widest opacity-60">
                        {l.lastTime}
                      </TextMono>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <TextMono className="text-[13px] truncate leading-relaxed max-w-[180px] block">
                        {l.lastMessage}
                      </TextMono>
                      {l.unread > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 min-w-[20px] text-center rounded-full bg-green-4 text-void text-[10px] font-black shadow-[0_0_15px_rgba(17,255,153,0.3)] shrink-0 animate-pulse">
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

      {/* 02. Center: Palco do Chat */}
      <section className="flex-1 flex flex-col min-w-0 border-r border-frost-border bg-void relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none opacity-50" />
        <ChatHeader lead={lead} />
        
        <div className="flex-1 overflow-y-auto px-12 py-10 space-y-6 scrollbar-hide relative z-10">
          <div className="text-center py-8">
            <TextMono className="px-5 py-1.5 bg-white/[0.03] border border-white/[0.05] text-[10px] uppercase tracking-[0.3em] font-bold rounded-full">
              Protocolo Iniciado · Hoje
            </TextMono>
          </div>
          
          {lead.messages.map((m, i) => {
            const isMe = m.from === "me";
            return (
              <div 
                key={m.id} 
                className={cn(
                  "flex animate-in fade-in slide-in-from-bottom-4 duration-700", 
                  isMe ? "justify-end" : "justify-start"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={cn("flex flex-col max-w-[65%]", isMe ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "px-5 py-4 rounded-[20px] text-[15.5px] leading-relaxed shadow-sm transition-all duration-500",
                      isMe
                        ? "bg-near-white text-void rounded-tr-none hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] font-medium"
                        : "frost-border bg-white/[0.02] backdrop-blur-xl rounded-tl-none hover:bg-white/[0.04]"
                    )}
                  >
                    <p>{m.text}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 mt-2 px-1 opacity-40",
                    isMe ? "flex-row" : "flex-row-reverse"
                  )}>
                    <TextMono className="text-[10px] font-bold uppercase tracking-widest">
                      {m.time}
                    </TextMono>
                    {isMe && <CheckCheck className="size-3 text-blue-10" strokeWidth={3} />}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="h-4" />
        </div>
        
        <ChatComposer />
      </section>

      {/* 03. Right: Lead Insights Card */}
      <LeadCard lead={lead} />
    </div>
  );
}

function ChatHeader({ lead }: { lead: Lead }) {
  return (
    <div className="px-10 py-6 border-b border-frost-border flex items-center justify-between bg-void/80 backdrop-blur-2xl sticky top-0 z-20">
      <div className="flex items-center gap-5">
        <div className="relative group">
           <div className="size-12 rounded-full grid place-items-center text-[16px] font-bold bg-void frost-border transition-all duration-700 group-hover:frost-ring">
             {lead.initials}
           </div>
           <span className="absolute bottom-0 right-0 size-3 bg-green-4 rounded-full border-2 border-void shadow-[0_0_12px_rgba(17,255,153,0.6)] animate-pulse" />
        </div>
        <div>
          <HeadingSub className="text-[18px] tracking-tight">
            {lead.name}
          </HeadingSub>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1.5">
              <span className={cn(
                "size-1.5 rounded-full",
                lead.line === "L1" ? "bg-orange-10" : "bg-blue-10"
              )} />
              <TextMono className="text-[11px] font-bold">{lead.phone}</TextMono>
            </span>
            <span className="opacity-30 text-muted-foreground">|</span>
            <TextSmall className="text-green-4 animate-pulse uppercase tracking-widest text-[9px]">Transmitindo…</TextSmall>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="size-11 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all active:scale-90">
          <Phone className="size-4.5" strokeWidth={2} />
        </button>
        <button className="size-11 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all active:scale-90">
          <MoreHorizontal className="size-4.5" strokeWidth={2} />
        </button>
        <div className="w-[1px] h-8 bg-frost-border/40 mx-2" />
        <ResendButton 
          onClick={() => {
            toast.loading("Analisando transcrição...", { id: "ai-qual" });
            setTimeout(() => {
              toast.success("Qualificação concluída com sucesso", { id: "ai-qual", description: "Score e insights atualizados." });
            }, 2000);
          }}
          className="group overflow-hidden relative"
          icon={<Sparkles className="size-4 text-orange-10 animate-pulse" />}
        >
          <span className="text-[12px] font-black uppercase tracking-[0.1em]">Qualificar</span>
        </ResendButton>
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
    <div className="border-t border-frost-border p-8 bg-void relative z-20">
      <div className="frost-border rounded-2xl bg-white/[0.01] p-3 flex items-end gap-3 focus-within:ring-1 focus-within:ring-near-white/20 focus-within:bg-white/[0.03] transition-all shadow-2xl">
        <div className="flex gap-1">
          <button className="size-10 rounded-xl grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all">
            <Plus className="size-5" />
          </button>
          <button className="size-10 rounded-xl grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all">
            <Smile className="size-5" />
          </button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Compor mensagem para o pipeline..."
          className="flex-1 bg-transparent resize-none outline-none text-[16px] py-2.5 px-1 placeholder:text-muted-foreground/40 leading-relaxed scrollbar-hide text-near-white font-sans"
        />
        
        <div className="flex gap-2 items-center">
          <button className="size-10 rounded-xl grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all">
            <Mic className="size-5" />
          </button>
          <button 
            disabled={!text.trim()}
            className={cn(
              "size-10 rounded-xl grid place-items-center transition-all active:scale-90",
              text.trim() 
                ? "bg-near-white text-void shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
                : "bg-white/5 text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            <Send className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="text-center mt-5 opacity-40">
        <TextSmall className="text-[10px] flex items-center justify-center gap-3">
          <Info className="size-3" /> Transmissão encriptada de ponta a ponta
        </TextSmall>
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <aside className="w-[420px] shrink-0 overflow-y-auto bg-void border-l border-frost-border animate-in slide-in-from-right-8 duration-1000 scrollbar-hide relative z-20">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-10/[0.02] via-transparent to-transparent pointer-events-none" />
      
      <div className="p-10 border-b border-frost-border relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 group">
            <div className="size-24 rounded-full grid place-items-center text-[32px] font-bold bg-void frost-border transition-all duration-1000 group-hover:scale-110 group-hover:frost-ring">
              {lead.initials}
            </div>
            <button className="absolute bottom-0 right-0 size-8 bg-near-white text-void rounded-full grid place-items-center shadow-2xl border-4 border-void hover:scale-110 transition-transform active:scale-95">
              <Plus className="size-4" strokeWidth={3} />
            </button>
          </div>
          <HeadingHero className="text-[32px] mb-2 leading-none">
            {lead.name}
          </HeadingHero>
          <TextMono className="text-[13px] font-bold opacity-60 flex items-center gap-2">
            <Phone className="size-3.5" /> {lead.phone}
          </TextMono>
          
          <div className="flex items-center gap-3 justify-center mt-8">
            <TextMono className={cn(
              "px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg rounded-full",
              lead.line === "L1" ? "border-orange-10/40 text-orange-10 bg-orange-10/5" : "border-blue-10/40 text-blue-10 bg-blue-10/5"
            )}>
              LINHA {lead.line.slice(1)}
            </TextMono>
            <TextMono className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] bg-near-white text-void shadow-2xl rounded-full">
              {STATUS_LABELS[lead.status]}
            </TextMono>
          </div>
        </div>
        
        <div className="mt-12 p-6 rounded-3xl bg-white/[0.02] border border-frost-border relative group overflow-hidden">
          <div className="absolute top-0 right-0 size-32 bg-green-4 opacity-5 blur-[60px] group-hover:opacity-15 transition-opacity duration-1000" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <TextSmall className="text-[10px] opacity-80 mb-2 block">QUALIFICAÇÃO IA</TextSmall>
              <div className="text-[44px] font-display leading-none tracking-tighter text-near-white">
                {lead.score}<span className="text-muted-foreground/20 text-[20px] ml-1 font-sans">/100</span>
              </div>
            </div>
            <div className="size-16 relative flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                <circle
                  cx="18" cy="18" r="16" fill="none"
                  stroke="var(--color-green-4)" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(lead.score / 100) * 100} 100`}
                  className="animate-in fade-in duration-1000"
                />
              </svg>
              <TextMono className="absolute text-[12px] font-black text-green-4">{lead.score}%</TextMono>
            </div>
          </div>
        </div>
      </div>

      <Section title="Segmentação Operacional" icon={TagIcon}>
        <div className="flex flex-wrap gap-2.5 animate-in slide-in-from-top-2 duration-500">
          {lead.tags.map((t) => <TagPill key={t.id} tag={t} className="px-3 py-1 shadow-lg hover:scale-110 transition-transform" />)}
          <button className="pill px-3 py-1.5 text-[10px] font-black uppercase tracking-widest frost-border text-muted-foreground hover:text-near-white hover:bg-white/5 inline-flex items-center gap-2 transition-all font-mono">
            <Plus className="size-3.5" /> GERENCIAR
          </button>
        </div>
      </Section>

      <Section title="Briefing do Perfil" icon={Building2}>
        <dl className="space-y-5">
          <Row icon={Building2} label="Empresa" value={lead.company} />
          <Row icon={Users2} label="Cargo" value={lead.role} />
          <Row icon={MapPin} label="Cidade" value={lead.city} />
          <Row icon={Sparkles} label="Origem" value={lead.source} />
        </dl>
      </Section>

      {lead.insights && (
        <Section title="Inteligência Gerada" icon={Sparkles} accent>
          <div className="relative mb-8">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-orange-10/40 rounded-full" />
            <p className="text-[15px] leading-relaxed text-near-white font-display italic pl-2">
              "{lead.insights.summary}"
            </p>
          </div>
          
          <div className="space-y-4 mb-10 animate-in fade-in duration-1000">
            {lead.insights.bullets.map((b, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-orange-10 font-black mt-0.5 group-hover:scale-150 transition-transform">·</span>
                <span className="text-near-white/70 leading-relaxed font-medium text-[13.5px]">{b}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 mb-6">
             <div className="h-[1px] flex-1 bg-frost-border/30" />
             <TextSmall className="text-[10px] opacity-60">PRÓXIMOS PASSOS</TextSmall>
             <div className="h-[1px] flex-1 bg-frost-border/30" />
          </div>
          
          <div className="space-y-2.5">
            {lead.insights.nextSteps.map((s, i) => (
              <div key={i} className="flex gap-4 text-[13px] frost-border rounded-2xl px-4 py-3.5 bg-white/[0.01] hover:bg-white/[0.04] transition-all duration-300 group/step cursor-pointer">
                <ArrowRight className="size-4 text-green-4 mt-0.5 shrink-0 group-hover/step:translate-x-1.5 transition-transform" />
                <span className="leading-snug font-bold text-near-white/90">{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Notas Estratégicas" icon={FileText}>
        <div className="space-y-4">
          {lead.notes.map((n) => (
            <div key={n.id} className="frost-border rounded-2xl p-5 bg-white/[0.01] hover:bg-white/[0.02] transition-all group/note border-l-2 border-l-transparent hover:border-l-near-white/40">
              <p className="text-[14px] leading-relaxed text-near-white/80 font-medium">{n.text}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-frost-border/10">
                <TextMono className="text-[10px] font-bold uppercase tracking-widest opacity-40">{n.at}</TextMono>
                <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-5 transition-colors opacity-0 group-hover/note:opacity-100">Deletar</button>
              </div>
            </div>
          ))}
          <button className="w-full py-4 flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-near-white hover:bg-white/5 frost-border border-dashed rounded-2xl transition-all duration-500 font-mono">
            <Plus className="size-4.5" /> NOVA ANOTAÇÃO
          </button>
        </div>
      </Section>

      <Section title="Rede de Despacho" icon={Send}>
        <div className="space-y-4">
          <DispatchButton label="Central Secretaria" sub="RESUMO + SCORE" icon={Users2} />
          <DispatchButton label="Equipe Comercial" sub="BRIEFING TÉCNICO" icon={Building2} />
          <DispatchButton label="Agendar Follow-up" sub="PROTOCOLO ATIVO" icon={Clock} />
        </div>
      </Section>

      <div className="p-12 text-center opacity-20 group hover:opacity-40 transition-opacity duration-1000">
        <TextMono className="text-[10px] uppercase tracking-[0.5em] font-black">
          TIMELINE · AUDITADA · 2026
        </TextMono>
      </div>
    </aside>
  );
}

function Section({
  title, icon: Icon, accent, children,
}: { title: string; icon: any; accent?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("px-10 py-10 border-b border-frost-border relative overflow-hidden", accent && "bg-white/[0.01]")}>
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <Icon className={cn("size-5", accent ? "text-orange-10" : "text-muted-foreground")} strokeWidth={accent ? 2.5 : 2} />
        <HeadingSub className="text-[13px] tracking-[0.25em] mb-0">{title}</HeadingSub>
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 group/row">
      <TextSmall className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity text-[11px]">
        <Icon className="size-3.5" />
        {label}
      </TextSmall>
      <TextMono className="text-near-white font-bold truncate max-w-[200px]">{value ?? "—"}</TextMono>
    </div>
  );
}

function DispatchButton({
  label, sub, icon: Icon = MessageSquare,
}: { label: string; sub: string; icon?: any }) {
  return (
    <button 
      onClick={() => toast.success(`Briefing enviado para ${label}`)}
      className="w-full frost-border rounded-2xl p-5 text-left flex items-center gap-5 hover:bg-white/[0.03] transition-all duration-500 group relative overflow-hidden shadow-2xl"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
         <Icon className="size-10" />
      </div>
      <span className="size-12 rounded-xl grid place-items-center bg-void frost-border group-hover:bg-white/[0.05] group-hover:scale-110 transition-all duration-500 relative z-10">
        <Icon className="size-5 text-near-white/60 group-hover:text-near-white" />
      </span>
      <div className="flex-1 min-w-0 relative z-10">
        <TextMono className="text-[14px] font-black uppercase tracking-widest text-near-white mb-0.5 block">{label}</TextMono>
        <TextMono className="text-[10px] font-bold tracking-[0.15em] opacity-40 group-hover:opacity-80 transition-opacity block uppercase">{sub}</TextMono>
      </div>
      <ArrowRight className="size-4 text-muted-foreground group-hover:text-near-white group-hover:translate-x-1 transition-all relative z-10" />
    </button>
  );
}
