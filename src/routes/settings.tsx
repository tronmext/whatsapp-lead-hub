import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Wifi, Shield, Bell, Database, Globe, Command, Trash2, Users2, Building2 } from "lucide-react";

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
    <div className="relative min-h-screen animate-in fade-in duration-700">
      <div className="grain absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="relative px-10 py-12 max-w-[1000px] mx-auto">
        <header className="mb-12 animate-in slide-in-from-top-2 duration-700">
          <div className="flex items-center gap-2 mb-3">
            <Command className="size-3 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black font-mono">
              Centro de Controle
            </p>
          </div>
          <h1 className="font-display text-[64px] leading-[1] tracking-tight">Settings</h1>
        </header>

        <div className="space-y-12">
          <Section 
            title="Linhas WhatsApp" 
            subtitle="Gerencie as instâncias conectadas via Evolution API v2."
            icon={Wifi}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { line: "L1", label: "Operação Comercial", phone: "+55 11 99887-1100", color: "orange" },
                { line: "L2", label: "Setor Agronegócio", phone: "+55 65 99700-2244", color: "blue" },
              ].map((l) => (
                <div key={l.line} className="frost-border rounded-[24px] p-5 bg-card/40 backdrop-blur-sm group hover:frost-ring transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                      "pill px-2.5 py-1 text-[10px] font-mono font-black shadow-sm",
                      l.color === "orange" ? "bg-orange text-black" : "bg-blue text-white"
                    )}>
                      {l.line}
                    </span>
                    <div className="flex items-center gap-1.5 bg-green/10 px-2 py-0.5 rounded-full border border-green/20">
                      <span className="size-1.5 rounded-full bg-green animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-green tracking-widest">Ativo</span>
                    </div>
                  </div>
                  <div className="text-[15px] font-bold tracking-tight mb-1">{l.label}</div>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono">
                    {l.phone}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest frost-border rounded-lg hover:bg-white/5 transition-all">Configurar</button>
                    <button className="size-9 rounded-lg frost-border grid place-items-center text-muted-foreground hover:text-red hover:border-red/30 transition-all">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="frost-border rounded-[24px] p-5 bg-white/[0.02] border-dashed border-2 flex flex-col items-center justify-center gap-3 group hover:bg-white/[0.04] transition-all">
                <div className="size-10 rounded-full bg-white/5 grid place-items-center group-hover:scale-110 transition-transform">
                  <Plus className="size-5 text-muted-foreground" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Nova Instância</span>
              </button>
            </div>
          </Section>

          <Section 
            title="Tags Estratégicas" 
            subtitle="Tags globais para segmentação de leads e automação de filtros."
            icon={Database}
          >
            <div className="frost-border rounded-[24px] p-6 bg-card/30 backdrop-blur-sm">
              <div className="flex flex-wrap gap-2.5">
                {ALL_TAGS.map((t) => <TagPill key={t.id} tag={t} className="px-3 py-1 shadow-md hover:scale-105 transition-transform" />)}
                <button className="pill px-3 py-1 text-[11px] font-black uppercase tracking-widest frost-border border-dashed text-muted-foreground hover:text-foreground hover:bg-white/5 inline-flex items-center gap-2 transition-all">
                  <Plus className="size-3" /> Adicionar
                </button>
              </div>
            </div>
          </Section>

          <Section
            title="Motor de IA"
            subtitle="Personalize o System Prompt que define o tom e as prioridades da análise."
            icon={Sparkles}
            accent
          >
            <div className="frost-border rounded-[24px] bg-black/60 overflow-hidden shadow-2xl relative group">
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="size-5 text-orange opacity-20 group-hover:opacity-100 transition-opacity animate-pulse" />
              </div>
              <div className="px-6 py-4 border-b border-border bg-white/[0.02] flex items-center gap-3">
                <div className="size-2 rounded-full bg-orange shadow-[0_0_8px_rgba(255,128,31,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono text-muted-foreground">
                  qualifier_system_v2.md
                </span>
              </div>
              <div className="p-6">
                <textarea 
                  className="w-full h-48 bg-transparent text-[13.5px] font-mono leading-relaxed resize-none outline-none text-foreground/80 scrollbar-hide"
                  spellCheck={false}
                  defaultValue={`Você é um analista comercial sênior. Receba a transcrição
completa de uma conversa de WhatsApp com um lead e retorne:

1. Resumo executivo  (3-5 linhas, tom direto)
2. Insights         (necessidades, objeções, interesse)
3. Próximos passos  (ações concretas para o operador)
4. Score 0-100      (qualificação baseada em sinais)
5. Tags sugeridas   (de uma lista controlada)

Foco do nicho: imóveis de alto padrão e agronegócio.
Linguagem: pt-BR, profissional, sem jargão genérico.`}
                />
              </div>
              <div className="px-6 py-4 bg-white/[0.03] border-t border-border flex justify-between items-center">
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5">
                     <Shield className="size-3 text-muted-foreground" />
                     <span className="text-[10px] font-black uppercase text-muted-foreground">Auditado</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Bell className="size-3 text-muted-foreground" />
                     <span className="text-[10px] font-black uppercase text-muted-foreground">Notificar Erros</span>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button className="pill px-4 py-2 text-[11px] font-black uppercase tracking-widest frost-border hover:bg-white/5 transition-all">Restaurar</button>
                  <button className="pill px-6 py-2 text-[11px] font-black uppercase tracking-widest bg-foreground text-background hover:scale-105 active:scale-95 shadow-xl transition-all">
                    Salvar Mudanças
                  </button>
                </div>
              </div>
            </div>
          </Section>

          <Section 
            title="Rede de Despacho" 
            subtitle="Defina os pontos de saída para os briefings gerados pela IA."
            icon={Globe}
          >
            <div className="space-y-3">
              <Field label="Central da Secretaria" value="+55 11 98000-0001" line="L1" icon={Users2} />
              <Field label="Grupo de Vendas (Nacional)" value="Cluster Comercial BR" line="L2" icon={Building2} />
            </div>
          </Section>
        </div>
        
        <footer className="mt-20 pt-8 border-t border-border flex items-center justify-between opacity-40">
           <div className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Leadflow v1.0.4</div>
           <div className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">Void Edition</div>
        </footer>
      </div>
    </div>
  );
}

function Section({
  title, subtitle, children, accent, icon: Icon,
}: { title: string; subtitle: string; children: React.ReactNode; accent?: boolean; icon: any }) {
  return (
    <section className="animate-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-start gap-5 mb-6">
        <div className={cn(
          "size-12 rounded-2xl frost-border grid place-items-center shrink-0 shadow-lg transition-transform hover:scale-110 duration-500",
          accent ? "bg-orange/5 border-orange/20" : "bg-white/[0.02]"
        )}>
          <Icon className={cn("size-5", accent ? "text-orange" : "text-muted-foreground")} strokeWidth={1.5} />
        </div>
        <div className="pt-1">
          <h2 className={cn(
            "font-section text-[22px] font-bold tracking-tight mb-1",
            accent ? "text-foreground" : "text-foreground/90"
          )}>
            {title}
          </h2>
          <p className="text-[14px] text-muted-foreground font-medium italic">{subtitle}</p>
        </div>
      </div>
      <div className="pl-1 relative">
        <div className="absolute left-[-26px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-border/40 via-border/10 to-transparent" />
        {children}
      </div>
    </section>
  );
}

function Field({ label, value, line, icon: Icon }: { label: string; value: string; line: string; icon: any }) {
  return (
    <div className="frost-border rounded-2xl p-4 bg-card/30 backdrop-blur-sm flex items-center justify-between group hover:bg-card/50 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl bg-white/5 frost-border grid place-items-center group-hover:frost-ring transition-all">
          <Icon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div>
          <div className="text-[14px] font-bold tracking-tight">{label}</div>
          <div className="text-[12px] text-muted-foreground font-mono mt-0.5">{value}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="pill px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] frost-border text-muted-foreground font-mono">
          via {line}
        </span>
        <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Alterar</button>
      </div>
    </div>
  );
}

