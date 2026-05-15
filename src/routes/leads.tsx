import { createFileRoute, Link } from "@tanstack/react-router";
import { LEADS, STATUS_LABELS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { Search, Plus, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Leadflow" },
      { name: "description", content: "Banco completo de leads, filtros e segmentação por tag." },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  return (
    <div className="relative min-h-screen bg-void px-12 py-16 animate-in fade-in duration-1000">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 animate-in slide-in-from-top-4 duration-1000">
        <div>
          <TextSmall className="text-muted-foreground opacity-80 mb-4 block">
            · {LEADS.length} leads cadastrados
          </TextSmall>
          <HeadingHero className="text-[72px]">Leads</HeadingHero>
        </div>
        <Button variant="default" size="default" className="px-8 shadow-xl">
          NOVO LEAD <Plus className="ml-2 size-4" />
        </Button>
      </header>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-black/40 p-2 rounded-2xl frost-border backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-1000 delay-200">
        <div className="relative w-full md:w-96 group">
          <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-near-white transition-colors" />
          <input
            placeholder="Buscar leads, telefone, empresa..."
            className="w-full bg-transparent pl-12 pr-4 py-3 text-[13px] outline-none placeholder:text-muted-foreground font-mono"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["Todos", "Novos", "Negociação", "Qualificados", "Perdidos"].map((f, i) => (
            <button
              key={f}
              className={cn(
                "pill px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap font-mono",
                i === 0 ? "bg-near-white text-void" : "frost-border text-muted-foreground hover:text-near-white hover:bg-white/5"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ResendCard variant="large" className="overflow-hidden bg-card/20 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-black font-mono border-b border-frost-border bg-white/[0.02]">
                <th className="px-8 py-5">Lead</th>
                <th className="px-8 py-5">Linha</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Tags</th>
                <th className="px-8 py-5">Empresa</th>
                <th className="px-8 py-5 text-right">Score</th>
                <th className="px-8 py-5 text-right">Atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-frost-border/20">
              {LEADS.map((l) => (
                <tr key={l.id} className="group transition-all hover:bg-white/[0.03]">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-11 rounded-full grid place-items-center text-[13px] font-bold bg-void frost-border group-hover:frost-ring transition-all duration-300">
                        {l.initials}
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-near-white">{l.name}</div>
                        <TextMono className="text-[12px] opacity-60">{l.phone}</TextMono>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "pill px-3 py-1 text-[10px] font-mono font-black uppercase tracking-wider",
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
                    <TextMono className="text-[16px] font-bold text-near-white block">
                      {l.score}<span className="text-muted-foreground/30 font-medium text-[11px] ml-1">/100</span>
                    </TextMono>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <TextMono className="text-[12px] opacity-60">{l.lastTime}</TextMono>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResendCard>
    </div>
  );
}
