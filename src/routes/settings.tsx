import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Wifi, Shield, Trash2, Command } from "lucide-react";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";

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
          <TextSmall className="text-muted-foreground opacity-80">CENTRO DE CONTROLE DO PIPELINE</TextSmall>
        </div>
        <HeadingHero>Settings</HeadingHero>
      </header>

      <div className="grid grid-cols-1 gap-20">
        <section className="space-y-10">
          <div className="flex items-baseline justify-between border-b border-frost-border pb-6">
            <HeadingSub>Motor de IA Inteligente</HeadingSub>
            <TextMono className="opacity-50">v4.2-STABLE</TextMono>
          </div>
          
          <div className="code-block relative group">
             <div className="absolute top-0 right-0 p-6 flex gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
               <Shield className="size-4 text-near-white" />
               <Sparkles className="size-4 text-orange-10" />
             </div>
             <TextMono className="flex items-center gap-4 mb-6 uppercase tracking-widest border-b border-frost-border/20 pb-4 block">
                <span className="text-orange-10">●</span>
                system_instruction.md
             </TextMono>
             <textarea 
               className="w-full h-64 bg-transparent outline-none resize-none text-[15px] font-mono leading-relaxed text-near-white/80 scrollbar-hide"
               spellCheck={false}
               defaultValue={`Você é um analista comercial sênior especialista em High Ticket.
Analise a transcrição da conversa e gere um objeto JSON:

1. EXECUTIVE_SUMMARY (3-5 linhas diretas)
2. QUALIFICATION_SCORE (0-100 baseado em urgência e budget)
3. IDENTIFIED_NEEDS (Lista técnica de dores)
4. SUGGESTED_NEXT_STEPS (Ações pragmáticas)

Tom: Sóbrio, editorial, técnico.`}
             />
             <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-frost-border/20">
                <Button variant="secondary" size="sm" className="px-6 uppercase tracking-widest text-[11px] font-black">RESTAURAR</Button>
                <Button variant="default" size="sm" className="px-8 uppercase tracking-widest text-[11px] font-black shadow-2xl">SALVAR MUDANÇAS</Button>
             </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="flex items-baseline justify-between border-b border-frost-border pb-6">
            <HeadingSub>Instâncias WhatsApp</HeadingSub>
            <div className="size-2 rounded-full bg-green-4 shadow-[0_0_10px_rgba(17,255,153,0.5)] animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InstanceCard line="L1" label="Operação Comercial" phone="+55 11 99887-1100" accent="orange" />
            <InstanceCard line="L2" label="Setor Agronegócio" phone="+55 65 99700-2244" accent="blue" />
            <button className="frost-border rounded-2xl p-10 bg-white/[0.01] border-dashed border-2 flex flex-col items-center justify-center gap-4 group hover:bg-white/[0.03] transition-all duration-500">
               <div className="size-12 rounded-full bg-white/5 grid place-items-center group-hover:scale-110 transition-transform">
                  <Plus className="size-6 text-muted-foreground" />
               </div>
               <TextSmall className="tracking-[0.2em] text-muted-foreground group-hover:text-near-white transition-colors">CONECTAR NOVA LINHA</TextSmall>
            </button>
          </div>
        </section>
      </div>

      <footer className="mt-40 pt-10 border-t border-frost-border/20 flex justify-between items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
         <TextMono className="uppercase tracking-[0.3em] font-bold">Leadflow v1.0.8</TextMono>
         <TextMono className="uppercase tracking-[0.3em] font-bold">Cinematic Void Edition</TextMono>
      </footer>
    </div>
  );
}

function InstanceCard({ line, label, phone, accent }: { line: string; label: string; phone: string; accent: "orange" | "blue" }) {
  const colorClass = accent === "orange" ? "text-orange-10 border-orange-10/30" : "text-blue-10 border-blue-10/30";
  const bgClass = accent === "orange" ? "bg-orange-10/10" : "bg-blue-10/10";
  
  return (
    <ResendCard variant="large" className="p-8 relative overflow-hidden group">
       <div className="flex items-center justify-between mb-8">
          <TextMono className={cn("px-3 py-1 border uppercase tracking-widest text-[10px] font-black rounded-full", bgClass, colorClass)}>
            LINHA {line}
          </TextMono>
          <div className="flex items-center gap-2 bg-green-4/10 px-3 py-1 rounded-full border border-green-4/20">
             <div className="size-1.5 rounded-full bg-green-4 animate-pulse" />
             <TextSmall className="text-green-4 text-[9px]">ESTÁVEL</TextSmall>
          </div>
       </div>
       <div className="text-[20px] font-semibold text-near-white mb-2 font-sans tracking-tight">{label}</div>
       <div className="flex items-center gap-2">
          <Wifi className="size-4 text-muted-foreground" strokeWidth={2.5} />
          <TextMono className="text-[14px]">{phone}</TextMono>
       </div>
       <div className="mt-10 flex gap-3">
          <Button variant="secondary" size="sm" className="flex-1 uppercase tracking-widest text-[11px] font-black">CONFIGURAR</Button>
          <button className="size-11 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-red-5 hover:border-red-5/30 transition-all active:scale-90">
             <Trash2 className="size-4" />
          </button>
       </div>
    </ResendCard>
  );
}
