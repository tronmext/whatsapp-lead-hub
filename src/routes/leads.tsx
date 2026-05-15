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

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar leads, telefone, empresa..."
            className="w-full bg-[oklch(0.06_0_0)] frost-border rounded-md pl-9 pr-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5">
          {["Todos", "Novos", "Negociação", "Qualificados", "Perdidos"].map((f, i) => (
            <button
              key={f}
              className={[
                "pill px-3 py-1.5 text-[12px] font-medium font-section",
                i === 0 ? "bg-foreground text-background" : "frost-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="frost-border rounded-2xl overflow-hidden bg-card/40">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-section border-b border-border">
              <th className="px-5 py-3 font-medium">Lead</th>
              <th className="px-5 py-3 font-medium">Linha</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Tags</th>
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium text-right">Score</th>
              <th className="px-5 py-3 font-medium text-right">Última atividade</th>
            </tr>
          </thead>
          <tbody>
            {LEADS.map((l) => (
              <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full grid place-items-center text-[11px] font-semibold bg-[oklch(0.12_0_0)] frost-border">
                      {l.initials}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">{l.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{l.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={[
                    "pill px-2 py-0.5 text-[10px] font-mono font-bold",
                    l.line === "L1" ? "bg-[oklch(0.74_0.18_45)] text-black" : "bg-[oklch(0.68_0.18_245)] text-white",
                  ].join(" ")}>
                    {l.line}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12px] text-foreground/90">{STATUS_LABELS[l.status]}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {l.tags.map((t) => <TagPill key={t.id} tag={t} />)}
                  </div>
                </td>
                <td className="px-5 py-3 text-[12px] text-muted-foreground">{l.company ?? "—"}</td>
                <td className="px-5 py-3 text-right font-mono text-[13px]">
                  {l.score}<span className="text-muted-foreground">/100</span>
                </td>
                <td className="px-5 py-3 text-right text-[11px] text-muted-foreground font-mono">{l.lastTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
