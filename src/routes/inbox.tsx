import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LEADS, STATUS_LABELS, type Lead, type LineId } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import {
  Search, Filter, Send, Paperclip, Smile, Sparkles,
  Phone, Building2, MapPin, Tag as TagIcon, Plus, ArrowRight,
  MessageSquare, FileText, Users2, Clock, Mic
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
      <section className="w-[320px] shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-section text-[18px] font-semibold tracking-tight">Inbox</h1>
            <button className="size-7 rounded-md frost-border grid place-items-center hover:bg-white/5">
              <Filter className="size-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full bg-[oklch(0.06_0_0)] frost-border rounded-md pl-9 pr-3 py-2 text-[13px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1.5 mt-3">
            {(["all", "L1", "L2"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setLineFilter(opt)}
                className={[
                  "pill px-3 py-1 text-[11px] font-medium transition-colors font-mono",
                  lineFilter === opt
                    ? "bg-foreground text-background"
                    : "frost-border text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {opt === "all" ? "TODAS" : opt}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {filtered.map((l) => {
            const active = l.id === selectedId;
            return (
              <li key={l.id}>
                <button
                  onClick={() => setSelectedId(l.id)}
                  className={[
                    "w-full text-left px-4 py-3 flex gap-3 border-b border-border/60 transition-colors",
                    active ? "bg-[oklch(0.08_0_0)]" : "hover:bg-white/[0.02]",
                  ].join(" ")}
                >
                  <div className="relative">
                    <div className="size-10 rounded-full grid place-items-center text-[13px] font-semibold bg-[oklch(0.12_0_0)] frost-border">
                      {l.initials}
                    </div>
                    <span
                      className={[
                        "absolute -bottom-0.5 -right-0.5 text-[8px] font-mono px-1 rounded-sm font-bold",
                        l.line === "L1"
                          ? "bg-[oklch(0.74_0.18_45)] text-black"
                          : "bg-[oklch(0.68_0.18_245)] text-white",
                      ].join(" ")}
                    >
                      {l.line}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium truncate">{l.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{l.lastTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[12px] text-muted-foreground truncate">{l.lastMessage}</span>
                      {l.unread > 0 && (
                        <span className="ml-2 size-4 rounded-full bg-[oklch(0.86_0.2_155)] text-black text-[10px] font-bold grid place-items-center">
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
      <section className="flex-1 flex flex-col min-w-0 border-r border-border">
        <ChatHeader lead={lead} />
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3 bg-[oklch(0.015_0_0)]">
          {lead.messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[70%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed",
                  m.from === "me"
                    ? "bg-foreground text-background rounded-br-sm"
                    : "frost-border bg-card rounded-bl-sm",
                ].join(" ")}
              >
                <p>{m.text}</p>
                <span className={`block text-[10px] mt-1 font-mono ${m.from === "me" ? "text-background/60" : "text-muted-foreground"}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}
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
    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full grid place-items-center text-[12px] font-semibold bg-[oklch(0.12_0_0)] frost-border">
          {lead.initials}
        </div>
        <div>
          <div className="text-[14px] font-medium">{lead.name}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>{lead.phone}</span>
            <span>·</span>
            <span className="text-[oklch(0.86_0.2_155)]">digitando…</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-section mr-1">
          {STATUS_LABELS[lead.status]}
        </span>
        <button className="pill px-3 py-1.5 text-[12px] font-medium frost-border hover:bg-white/5 flex items-center gap-1.5">
          <Sparkles className="size-3" /> Analisar com IA
        </button>
      </div>
    </div>
  );
}

function ChatComposer() {
  const [text, setText] = useState("");
  return (
    <div className="border-t border-border p-4 bg-card/40">
      <div className="frost-border rounded-2xl bg-[oklch(0.04_0_0)] p-2 flex items-end gap-2">
        <button className="size-8 grid place-items-center text-muted-foreground hover:text-foreground">
          <Paperclip className="size-4" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Digite uma mensagem..."
          className="flex-1 bg-transparent resize-none outline-none text-[14px] py-1.5 placeholder:text-muted-foreground"
        />
        <button className="size-8 grid place-items-center text-muted-foreground hover:text-foreground">
          <Smile className="size-4" />
        </button>
        <button className="size-8 grid place-items-center text-muted-foreground hover:text-foreground">
          <Mic className="size-4" />
        </button>
        <button className="pill bg-foreground text-background size-9 grid place-items-center hover:opacity-90">
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <aside className="w-[360px] shrink-0 overflow-y-auto bg-card/30">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col items-center text-center">
          <div className="size-16 rounded-full grid place-items-center text-[20px] font-semibold bg-[oklch(0.12_0_0)] frost-border mb-3">
            {lead.initials}
          </div>
          <h2 className="font-display text-[22px] tracking-[-0.03em]">{lead.name}</h2>
          <p className="text-[12px] text-muted-foreground font-mono mt-1">{lead.phone}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="pill px-2 py-0.5 text-[10px] font-mono frost-border">
              Linha {lead.line.slice(1)}
            </span>
            <span className="pill px-2 py-0.5 text-[10px] font-mono bg-[oklch(0.18_0.02_240)]">
              {STATUS_LABELS[lead.status]}
            </span>
          </div>
        </div>
        <div className="mt-5 frost-border rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-section">
              Score IA
            </div>
            <div className="font-display text-[28px] tracking-tight leading-none mt-1">
              {lead.score}<span className="text-muted-foreground text-[16px]">/100</span>
            </div>
          </div>
          <div className="size-12 relative">
            <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.18 0 0)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="oklch(0.86 0.2 155)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(lead.score / 100) * 88} 100`}
              />
            </svg>
          </div>
        </div>
      </div>

      <Section title="Tags" icon={TagIcon}>
        <div className="flex flex-wrap gap-1.5">
          {lead.tags.map((t) => <TagPill key={t.id} tag={t} />)}
          <button className="pill px-2 py-0.5 text-[11px] frost-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Plus className="size-3" /> Tag
          </button>
        </div>
      </Section>

      <Section title="Detalhes" icon={Building2}>
        <dl className="space-y-2 text-[12px]">
          <Row icon={Building2} label="Empresa" value={lead.company} />
          <Row icon={Users2} label="Cargo" value={lead.role} />
          <Row icon={MapPin} label="Cidade" value={lead.city} />
          <Row icon={Phone} label="Origem" value={lead.source} />
        </dl>
      </Section>

      {lead.insights && (
        <Section title="Insights IA" icon={Sparkles} accent>
          <p className="text-[13px] leading-relaxed text-foreground/90 mb-4 italic font-display">
            "{lead.insights.summary}"
          </p>
          <div className="space-y-1.5 mb-4">
            {lead.insights.bullets.map((b, i) => (
              <div key={i} className="flex gap-2 text-[12px]">
                <span className="text-[oklch(0.74_0.18_45)] mt-0.5">·</span>
                <span className="text-foreground/80">{b}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-section mb-2">
            Próximos passos
          </div>
          <div className="space-y-1.5">
            {lead.insights.nextSteps.map((s, i) => (
              <div key={i} className="flex gap-2 text-[12px] frost-border rounded-md px-2.5 py-1.5">
                <ArrowRight className="size-3 text-[oklch(0.86_0.2_155)] mt-0.5 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Notas" icon={FileText}>
        {lead.notes.length === 0 && (
          <p className="text-[12px] text-muted-foreground italic">Nenhuma nota ainda.</p>
        )}
        {lead.notes.map((n) => (
          <div key={n.id} className="frost-border rounded-md p-2.5 mb-2">
            <p className="text-[12px]">{n.text}</p>
            <span className="text-[10px] font-mono text-muted-foreground mt-1 block">{n.at}</span>
          </div>
        ))}
        <button className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
          <Plus className="size-3" /> Adicionar nota
        </button>
      </Section>

      <Section title="Despachar" icon={Send}>
        <div className="space-y-2">
          <DispatchButton label="Enviar para Secretaria" sub="WhatsApp · resumo + insights" />
          <DispatchButton label="Enviar para Equipe Interna" sub="WhatsApp · briefing técnico" />
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
