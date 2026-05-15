import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Wifi, Shield, Bell, Database, Globe, Command, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Leadflow" },
      { name: "description", content: "Configurações cinematográficas de motor de IA e rede de despacho." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="relative min-h-screen bg-void px-12 py-16 animate-in fade-in duration-1000">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />
      
      <header className="mb-20 animate-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3 mb-4">
          <Command className="size-4 text-muted-foreground" />
          <p className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground font-black font-mono">
            Centro de Controle do Pipeline
          </p>
        </div>
        <h1 className="font-display text-[72px] leading-[1] tracking-tight">Settings</h1>
      </header>

      <div className="grid grid-cols-1 gap-20">
        <section className="space-y-10">
          <div className="flex items-baseline justify-between border-b border-frost-border pb-6">
            <h2 className="text-[24px] font-section text-near-white tracking-[0.35px]">Motor de IA Inteligente</h2>
            <p className="text-[13px] text-muted-foreground font-mono">v4.2-STABLE</p>
          </div>
          
          <div className="code-block relative group">
             <div className="absolute top-0 right-0 p-6 flex gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
               <Shield className="size-4 text-near-white" />
               <Sparkles className="size-4 text-orange-10" />
             </div>
             <div className="flex items-center gap-4 mb-6 text-[12px] font-mono text-muted-foreground uppercase tracking-widest border-b border-frost-border/20 pb-4">
                <span className="text-orange-10">●</span>
                system_instruction.md
             </div>
             <textarea 
               className="w-full h-64 bg-transparent outline-none resize-none text-[15px] font-mono leading-relaxed text-near-white/80 scrollbar-hide"
               spellCheck={false}
               defaultValue={`Você é um analista comercial sênior especialista em High Ticket.
Analise a transcrição da conversa e gere um objeto JSON:

1. EXECUTIVE_SUMMARY (3-5 linhas diretas)
2. QUALIFICATION_SCORE (0-100 baseado em urgência e budget)
3. IDENTIFIED_NEEDS (Lista técnica de dores)
4. SUGGESTED_NEXT_STEPS (Ações pragmáticas)

Nicho: Imóveis de luxo e Agronegócio de precisão.
Tom: Sóbrio, editorial, técnico.`}
             />
             <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-frost-border/20">
                <button className="btn-secondary px-6 py-2 uppercase tracking-widest text-[11px] font-black">RESTAURAR</button>
                <button className="btn-primary px-8 py-2 uppercase tracking-widest text-[11px] font-black shadow-2xl">SALVAR MUDANÇAS</button>
             </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="flex items-baseline justify-between border-b border-frost-border pb-6">
            <h2 className="text-[24px] font-section text-near-white tracking-[0.35px]">Instâncias WhatsApp</h2>
            <div className="size-2 rounded-full bg-green-4 shadow-[0_0_10px_rgba(17,255,153,0.5)] animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InstanceCard line="L1" label="Operação Comercial" phone="+55 11 99887-1100" accent="orange" />
            <InstanceCard line="L2" label="Setor Agronegócio" phone="+55 65 99700-2244" accent="blue" />
            <button className="frost-border rounded-2xl p-10 bg-white/[0.01] border-dashed border-2 flex flex-col items-center justify-center gap-4 group hover:bg-white/[0.03] transition-all duration-500">
               <div className="size-12 rounded-full bg-white/5 grid place-items-center group-hover:scale-110 transition-transform">
                  <Plus className="size-6 text-muted-foreground" />
               </div>
               <span className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-near-white transition-colors">CONECTAR NOVA LINHA</span>
            </button>
          </div>
        </section>
      </div>

      <footer className="mt-40 pt-10 border-t border-frost-border/20 flex justify-between items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
         <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em]">Leadflow v1.0.8</div>
         <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em]">Cinematic Void Edition</div>
      </footer>
    </div>
  );
}

function InstanceCard({ line, label, phone, accent }: { line: string; label: string; phone: string; accent: "orange" | "blue" }) {
  const colorClass = accent === "orange" ? "text-orange-10 border-orange-10/30" : "text-blue-10 border-blue-10/30";
  const bgClass = accent === "orange" ? "bg-orange-10/10" : "bg-blue-10/10";
  
  return (
    <div className="frost-border rounded-[24px] p-8 bg-white/[0.01] backdrop-blur-sm group hover:bg-white/[0.03] transition-all duration-500 relative overflow-hidden">
       <div className="flex items-center justify-between mb-8">
          <span className={cn("pill px-3 py-1 text-[10px] font-mono font-black border uppercase tracking-widest", bgClass, colorClass)}>
            LINHA {line}
          </span>
          <div className="flex items-center gap-2 bg-green-4/10 px-3 py-1 rounded-full border border-green-4/20">
             <div className="size-1.5 rounded-full bg-green-4 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-green-4">ESTÁVEL</span>
          </div>
       </div>
       <div className="text-[20px] font-semibold text-near-white mb-2">{label}</div>
       <div className="flex items-center gap-2 text-[14px] text-muted-foreground font-mono">
          <Wifi className="size-4" strokeWidth={2.5} />
          {phone}
       </div>
       <div className="mt-10 flex gap-3">
          <button className="flex-1 py-3 text-[11px] font-black uppercase tracking-widest frost-border rounded-xl hover:bg-white/5 transition-all">CONFIGURAR</button>
          <button className="size-11 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-red-5 hover:border-red-5/30 transition-all active:scale-90">
             <Trash2 className="size-4" />
          </button>
       </div>
    </div>
  );
}
