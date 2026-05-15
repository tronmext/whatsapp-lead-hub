import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Wifi, Shield, Command } from "lucide-react";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { InstancesPanel } from "@/components/evolution/InstancesPanel";

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
  const [activeTab, setActiveTab] = useState<"ai" | "instances" | "security">("ai");

  const TABS = [
    { id: "ai", label: "Motor de IA", icon: Sparkles },
    { id: "instances", label: "Instâncias", icon: Wifi },
    { id: "security", label: "Segurança", icon: Shield },
  ] as const;

  return (
    <div className="relative min-h-full bg-void animate-in fade-in duration-1000 flex flex-col md:flex-row overflow-hidden">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />
      
      {/* Navigation Sidebar */}
      <aside className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-frost-border bg-white/[0.01] backdrop-blur-3xl z-10 flex flex-col h-auto md:h-full relative overflow-y-auto">
        <div className="p-8 md:p-12">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Command className="size-4 text-muted-foreground" />
              <TextSmall className="text-muted-foreground opacity-80 uppercase tracking-widest">Centro de Controle</TextSmall>
            </div>
            <HeadingHero className="text-[42px] leading-none mb-0">Settings</HeadingHero>
          </header>

          <nav className="space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group",
                  activeTab === tab.id
                    ? "bg-near-white text-void shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    : "text-muted-foreground hover:text-near-white hover:bg-white/[0.03]"
                )}
              >
                <tab.icon className={cn("size-5 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-void" : "text-muted-foreground")} />
                <span className="font-section font-bold tracking-[0.05em] uppercase text-[12px]">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-12 hidden md:block opacity-30">
          <TextMono className="text-[9px] uppercase tracking-[0.3em] font-black">Leadflow v1.0.8</TextMono>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-8 md:p-20 relative z-0">
        <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === "ai" && <AISettings />}
          {activeTab === "instances" && <InstanceSettings />}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </main>
    </div>
  );
}

function AISettings() {
  return (
    <section className="space-y-12">
      <div className="flex items-baseline justify-between border-b border-frost-border pb-8">
        <div>
          <HeadingSub className="mb-2">Motor de IA Inteligente</HeadingSub>
          <TextSmall className="text-muted-foreground">Configure as diretrizes e o comportamento do processamento de leads.</TextSmall>
        </div>
        <TextMono className="opacity-50 text-[11px]">v4.2-STABLE</TextMono>
      </div>
      
      <div className="code-block relative group">
         <div className="absolute top-0 right-0 p-6 flex gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
           <Shield className="size-4 text-near-white" />
           <Sparkles className="size-4 text-orange-10" />
         </div>
         <TextMono className="flex items-center gap-4 mb-6 uppercase tracking-widest border-b border-frost-border/20 pb-4 block text-[11px]">
            <span className="text-orange-10 animate-pulse">●</span>
            system_instruction.md
         </TextMono>
         <textarea 
           className="w-full h-80 bg-transparent outline-none resize-none text-[15px] font-mono leading-relaxed text-near-white/80 scrollbar-hide"
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
  );
}

function InstanceSettings() {
  return <InstancesPanel />;
}

function SecuritySettings() {
  return (
    <section className="space-y-12">
      <div className="flex items-baseline justify-between border-b border-frost-border pb-8">
        <div>
          <HeadingSub className="mb-2">Segurança e Chaves</HeadingSub>
          <TextSmall className="text-muted-foreground">Tokens de acesso e criptografia de ponta a ponta.</TextSmall>
        </div>
        <Shield className="size-5 text-muted-foreground opacity-30" />
      </div>

      <div className="space-y-6">
        <div className="frost-border p-8 rounded-2xl bg-white/[0.01] flex items-center justify-between group hover:bg-white/[0.02] transition-all">
          <div>
            <TextSmall className="text-muted-foreground uppercase tracking-widest text-[10px] block mb-2">EVOLUTION API</TextSmall>
            <TextMono className="text-[15px] text-near-white">configurada via secret server-side</TextMono>
          </div>
          <Button variant="outline" size="sm" className="font-bold tracking-widest text-[10px]">ATIVA</Button>
        </div>

        <div className="frost-border p-8 rounded-2xl bg-white/[0.01] flex items-center justify-between group hover:bg-white/[0.02] transition-all border-red-5/20">
          <div>
            <TextSmall className="text-red-5/60 uppercase tracking-widest text-[10px] block mb-2">ÁREA DE PERIGO</TextSmall>
            <TextSmall className="text-muted-foreground">Excluir todos os registros e desconectar instâncias.</TextSmall>
          </div>
          <Button variant="outline" size="sm" className="text-red-5 border-red-5/20 hover:bg-red-5/5 font-bold tracking-widest text-[10px]">APAGAR TUDO</Button>
        </div>
      </div>
    </section>
  );
}
