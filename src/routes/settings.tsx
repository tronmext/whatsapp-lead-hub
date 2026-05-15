import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { Plus, Sparkles, Wifi } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Leadflow" },
      { name: "description", content: "Configure linhas WhatsApp, tags globais e o prompt do motor de IA." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="px-10 py-10 max-w-[920px]">
      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-section mb-3">
          · configurações
        </p>
        <h1 className="font-display text-[56px] leading-[1] tracking-[-0.04em]">Settings</h1>
      </header>

      <Section title="Linhas WhatsApp" subtitle="Conectadas via Evolution API v2.">
        <div className="grid grid-cols-2 gap-3">
          {[
            { line: "L1", label: "Linha 1 · Comercial", phone: "+55 11 99887-1100", color: "oklch(0.74 0.18 45)" },
            { line: "L2", label: "Linha 2 · Agronegócio", phone: "+55 65 99700-2244", color: "oklch(0.68 0.18 245)" },
          ].map((l) => (
            <div key={l.line} className="frost-border rounded-xl p-4 bg-card/40">
              <div className="flex items-center justify-between mb-3">
                <span className="pill px-2 py-0.5 text-[10px] font-mono font-bold text-black" style={{ background: l.color }}>
                  {l.line}
                </span>
                <span className="text-[10px] text-[oklch(0.86_0.2_155)] flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[oklch(0.86_0.2_155)] shadow-[0_0_8px_oklch(0.86_0.2_155)]" />
                  conectado
                </span>
              </div>
              <div className="text-[13px] font-medium">{l.label}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono mt-0.5">
                <Wifi className="size-3" /> {l.phone}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tags globais" subtitle="Compartilhadas entre operadores e regras de filtro.">
        <div className="frost-border rounded-xl p-4 bg-card/40">
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((t) => <TagPill key={t.id} tag={t} />)}
            <button className="pill px-2 py-0.5 text-[11px] frost-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <Plus className="size-3" /> Nova tag
            </button>
          </div>
        </div>
      </Section>

      <Section
        title="Motor de IA"
        subtitle="Prompt base usado para gerar resumos, score e próximos passos."
        accent
      >
        <div className="frost-border rounded-xl bg-[oklch(0.025_0_0)] overflow-hidden">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <Sparkles className="size-3.5 text-[oklch(0.74_0.18_45)]" />
            <span className="text-[11px] uppercase tracking-[0.16em] font-section text-muted-foreground">
              prompt.system.md
            </span>
          </div>
          <pre className="p-4 text-[12px] font-mono leading-relaxed whitespace-pre-wrap text-foreground/85">
{`Você é um analista comercial sênior. Receba a transcrição
completa de uma conversa de WhatsApp com um lead e retorne:

1. Resumo executivo  (3-5 linhas, tom direto)
2. Insights         (necessidades, objeções, interesse)
3. Próximos passos  (ações concretas para o operador)
4. Score 0-100      (qualificação baseada em sinais)
5. Tags sugeridas   (de uma lista controlada)

Foco do nicho: imóveis de alto padrão e agronegócio.
Linguagem: pt-BR, profissional, sem jargão genérico.`}
          </pre>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button className="pill px-4 py-2 text-[12px] frost-border hover:bg-white/5">Cancelar</button>
          <button className="pill px-4 py-2 text-[12px] bg-foreground text-background hover:opacity-90">
            Salvar prompt
          </button>
        </div>
      </Section>

      <Section title="Despacho" subtitle="Para onde os resumos serão enviados via WhatsApp.">
        <div className="space-y-2">
          <Field label="Secretaria" value="+55 11 98000-0001" line="L1" />
          <Field label="Equipe Interna (grupo)" value="Grupo Vendas Brasil" line="L2" />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title, subtitle, children, accent,
}: { title: string; subtitle: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className={`font-section text-[18px] font-semibold tracking-tight ${accent ? "text-[oklch(0.86_0.16_55)]" : ""}`}>
          {title}
        </h2>
        <p className="text-[12px] text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, line }: { label: string; value: string; line: string }) {
  return (
    <div className="frost-border rounded-lg p-3 bg-card/40 flex items-center justify-between">
      <div>
        <div className="text-[12px] font-medium">{label}</div>
        <div className="text-[12px] text-muted-foreground font-mono">{value}</div>
      </div>
      <span className="pill px-2 py-0.5 text-[10px] font-mono frost-border">enviar via {line}</span>
    </div>
  );
}
