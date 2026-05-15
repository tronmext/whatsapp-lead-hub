import { createFileRoute } from "@tanstack/react-router";
import { LEADS, STATUS_LABELS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { Search, Plus } from "lucide-react";

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
    <div className="px-10 py-10 max-w-[1400px]">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-section mb-3">
            · {LEADS.length} contatos
          </p>
          <h1 className="font-display text-[56px] leading-[1] tracking-[-0.04em]">Leads</h1>
        </div>
        <button className="pill bg-foreground text-background px-4 py-2 text-[13px] font-medium flex items-center gap-1.5">
          <Plus className="size-3.5" /> Novo lead
        </button>
      </header>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md group">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            placeholder="Buscar leads, telefone, empresa..."
            className="w-full bg-[oklch(0.06_0_0)] frost-border rounded-md pl-9 pr-3 py-2.5 text-[13px] outline-none transition-all focus:ring-1 focus:ring-ring focus:bg-[oklch(0.08_0_0)] shadow-[inset_0_0_10px_rgba(214,235,253,0.02)]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["Todos", "Novos", "Negociação", "Qualificados", "Perdidos"].map((f, i) => (
            <button
              key={f}
              className={cn(
                "pill px-4 py-1.5 text-[12px] font-medium font-section transition-all hover:scale-105 active:scale-95 whitespace-nowrap",
                i === 0 ? "bg-foreground text-background shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "frost-border text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="frost-border rounded-2xl overflow-hidden bg-card/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-section border-b border-border bg-black/20">
                <th className="px-6 py-4 font-medium">Lead</th>
                <th className="px-6 py-4 font-medium">Linha</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Tags</th>
                <th className="px-6 py-4 font-medium">Empresa</th>
                <th className="px-6 py-4 font-medium text-right">Score</th>
                <th className="px-6 py-4 font-medium text-right">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {LEADS.map((l, index) => (
                <tr 
                  key={l.id} 
                  className="group transition-colors hover:bg-white/[0.03] animate-in fade-in duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full grid place-items-center text-[12px] font-semibold bg-[oklch(0.12_0_0)] frost-border group-hover:frost-ring transition-all duration-300">
                        {l.initials}
                      </div>
                      <div>
                        <div className="text-[13.5px] font-medium group-hover:text-foreground transition-colors">{l.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{l.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "pill px-2 py-0.5 text-[10px] font-mono font-bold shadow-sm",
                      l.line === "L1" ? "bg-orange text-black" : "bg-blue text-white"
                    )}>
                      {l.line}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12.5px] text-foreground/80 font-medium">{STATUS_LABELS[l.status]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {l.tags.map((t) => <TagPill key={t.id} tag={t} className="hover:scale-105 transition-transform" />)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12.5px] text-muted-foreground">{l.company ?? "—"}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono text-[14px]">
                      {l.score}<span className="text-muted-foreground/50">/100</span>
                    </div>
                    <div className={cn(
                      "h-0.5 w-full mt-1 bg-muted rounded-full overflow-hidden ml-auto",
                      l.score > 70 ? "max-w-[40px]" : "max-w-[20px]"
                    )}>
                      <div 
                        className={cn("h-full", l.score > 70 ? "bg-green" : l.score > 40 ? "bg-orange" : "bg-red")} 
                        style={{ width: `${l.score}%` }} 
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[11.5px] text-muted-foreground font-mono group-hover:text-foreground transition-colors">{l.lastTime}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
