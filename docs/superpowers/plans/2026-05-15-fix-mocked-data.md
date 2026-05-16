# Fix Mocked Data & Broken Functionality

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded/mock data with real database queries, fix non-functional UI components (AI settings, analytics, dashboard metrics), and ensure every page is backed by the actual D1/SQLite database.

**Architecture:** The app uses TanStack Start with Cloudflare D1 (proxied locally via `LocalD1Proxy` to SQLite). Server functions in `server-functions.ts` and `evolution.functions.ts` wrap database and Evolution API calls. We'll add missing server functions, wire up existing static pages to them, and clean up the dead mock-data file.

**Tech Stack:** TypeScript, TanStack Start, React Query, D1/SQLite, Evolution API

---

## File Map

| File                             | Action    | Responsibility                                                                                  |
| -------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `src/lib/server-functions.ts`    | Modify    | Add `getAnalyticsMetrics`, `getPrompt`, `savePrompt`, `updateLeadStatus` server functions       |
| `src/lib/services/db.service.ts` | Modify    | Add `getAnalyticsMetrics()`, `getPromptById()`, `savePrompt()`, `updateContactStatus()` methods |
| `src/routes/index.tsx`           | Modify    | Replace hardcoded `METRICS` with real DB query via new server function                          |
| `src/routes/analytics.tsx`       | Modify    | Replace hardcoded `SERIES` and stat cards with real DB queries                                  |
| `src/routes/settings.tsx`        | Modify    | Wire AI settings textarea to load/save from `prompts_library` table                             |
| `src/routes/leads.tsx`           | Modify    | Wire drag-and-drop status change to server function                                             |
| `src/lib/mock-data.ts`           | Modify    | Remove unused `LEADS` array; keep `STATUS_LABELS`, `Tag` type, `ALL_TAGS` as they are used      |
| `src/components/Tag.tsx`         | No change | Already imports only the `Tag` type from mock-data (valid)                                      |

---

### Task 1: Add Missing Database Methods

**Files:**

- Modify: `src/lib/services/db.service.ts`

- [ ] **Step 1: Add new methods to DatabaseService class**

Add these methods to the `DatabaseService` class in `src/lib/services/db.service.ts`, right after the existing `getMessagesByContact` method and before `getPrompt`:

```typescript
  // Analytics
  async getAnalyticsMetrics() {
    // Total contacts
    const totalContacts = await this.db.prepare("SELECT COUNT(*) as count FROM contacts").first<{ count: number }>();

    // New contacts today
    const newToday = await this.db.prepare(
      "SELECT COUNT(*) as count FROM contacts WHERE date(updated_at) = date('now')"
    ).first<{ count: number }>();

    // Contacts in negotiation
    const inNegotiation = await this.db.prepare(
      "SELECT COUNT(*) as count FROM contacts WHERE status = 'negociacao'"
    ).first<{ count: number }>();

    // Average response time (approximate: avg time between consecutive messages in a conversation)
    const avgResponse = await this.db.prepare(
      `SELECT AVG(diff) as avg_ms FROM (
        SELECT (julianday(timestamp) - julianday(LAG(timestamp) OVER (PARTITION BY contact_id ORDER BY timestamp))) * 86400000 as diff
        FROM messages
        WHERE diff IS NOT NULL
      )`
    ).first<{ avg_ms: number | null }>();

    // Conversion rate: qualified / (qualified + lost)
    const conversion = await this.db.prepare(
      `SELECT
        SUM(CASE WHEN status = 'qualificado' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'perdido' THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN status IN ('qualificado', 'perdido') THEN 1 ELSE 0 END) as total
      FROM contacts`
    ).first<{ qualified: number; lost: number; total: number }>();

    // AI automations count (messages from_me that are AI-generated - we'll approximate as all from_me messages where contact has ai_enabled=1)
    const aiAutomations = await this.db.prepare(
      `SELECT COUNT(*) as count FROM messages m
       JOIN contacts c ON m.contact_id = c.jid
       WHERE m.from_me = 1 AND c.ai_enabled = 1`
    ).first<{ count: number }>();

    // Weekly qualified leads for chart (last 18 weeks)
    const weeklyQualified = await this.db.prepare(
      `SELECT date(updated_at, 'weekday 0', '-17 weeks') as week_start, COUNT(*) as count
       FROM contacts
       WHERE status = 'qualificado' AND updated_at >= date('now', '-17 weeks')
       GROUP BY week_start
       ORDER BY week_start`
    ).all<{ week_start: string; count: number }>();

    return {
      totalContacts: totalContacts?.count ?? 0,
      newToday: newToday?.count ?? 0,
      inNegotiation: inNegotiation?.count ?? 0,
      avgResponseMs: avgResponse?.avg_ms ?? 0,
      conversionRate: conversion?.total ? (conversion.qualified / conversion.total) * 100 : 0,
      aiAutomations: aiAutomations?.count ?? 0,
      weeklyQualified: weeklyQualified.results ?? [],
    };
  }

  // Prompts
  async getPromptById(id: string) {
    return this.db.prepare("SELECT * FROM prompts_library WHERE id = ?").bind(id).first<{ id: string; name: string; content: string; category: string }>();
  }

  async getPrompts() {
    const { results } = await this.db.prepare("SELECT * FROM prompts_library ORDER BY name").all<{ id: string; name: string; content: string; category: string }>();
    return results;
  }

  async savePrompt(prompt: { id?: string; name: string; content: string; category?: string }) {
    if (prompt.id) {
      return this.db.prepare(
        "UPDATE prompts_library SET name = ?, content = ?, category = ? WHERE id = ?"
      ).bind(prompt.name, prompt.content, prompt.category ?? 'sales', prompt.id).run();
    }
    const id = prompt.id || `prompt_${Date.now()}`;
    return this.db.prepare(
      "INSERT INTO prompts_library (id, name, content, category) VALUES (?, ?, ?, ?)"
    ).bind(id, prompt.name, prompt.content, prompt.category ?? 'sales').run();
  }

  async updateContactStatus(jid: string, status: string) {
    // Use smart JID matching
    const contact = await this.getContact(jid);
    if (!contact) return { ok: false, error: 'not_found' };
    return this.db.prepare(
      "UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE jid = ?"
    ).bind(status, contact.jid).run();
  }
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Expected: No errors related to db.service.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/db.service.ts
git commit -m "feat: add analytics, prompts, and status update methods to DatabaseService"
```

---

### Task 2: Add Missing Server Functions

**Files:**

- Modify: `src/lib/server-functions.ts`

- [ ] **Step 1: Add new server functions**

Append these server functions to the end of `src/lib/server-functions.ts`:

```typescript
export const getAnalyticsMetrics = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    try {
      // @ts-ignore
      const env =
        context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;

      if (!dbInstance)
        return {
          totalContacts: 0,
          newToday: 0,
          inNegotiation: 0,
          avgResponseMs: 0,
          conversionRate: 0,
          aiAutomations: 0,
          weeklyQualified: [],
        };

      const db = new DatabaseService(dbInstance);
      return db.getAnalyticsMetrics();
    } catch (error: any) {
      console.error("Error in getAnalyticsMetrics:", error.message);
      return {
        totalContacts: 0,
        newToday: 0,
        inNegotiation: 0,
        avgResponseMs: 0,
        conversionRate: 0,
        aiAutomations: 0,
        weeklyQualified: [],
      };
    }
  },
);

export const getPrompts = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  try {
    // @ts-ignore
    const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
    // @ts-ignore
    const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;

    if (!dbInstance) return [];

    const db = new DatabaseService(dbInstance);
    return db.getPrompts();
  } catch (error: any) {
    console.error("Error in getPrompts:", error.message);
    return [];
  }
});

export const savePrompt = createServerFn({ method: "POST" })
  .inputValidator((data: { id?: string; name: string; content: string; category?: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      // @ts-ignore
      const env =
        context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      return db.savePrompt(data);
    } catch (error: any) {
      console.error("Error in savePrompt:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { jid: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      // @ts-ignore
      const env =
        context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      return db.updateContactStatus(data.jid, data.status);
    } catch (error: any) {
      console.error("Error in updateLeadStatus:", error.message);
      return { ok: false, error: error.message };
    }
  });
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Expected: No errors related to server-functions.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/server-functions.ts
git commit -m "feat: add analytics, prompts, and lead status server functions"
```

---

### Task 3: Fix Dashboard — Replace Hardcoded Metrics

**Files:**

- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Update imports and replace hardcoded METRICS**

Replace the top of `src/routes/index.tsx`. Change the imports and remove the hardcoded `METRICS` constant:

```typescript
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MessageSquare, Sparkles, TrendingUp, Users, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";
import { getLeads, getAnalyticsMetrics } from "@/lib/server-functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const leads = await getLeads();
    return { leads };
  },
  head: () => ({
    meta: [
      { title: "Dashboard — Leadflow" },
      { name: "description", content: "Visão geral cinematográfica dos leads e atividade WhatsApp." },
    ],
  }),
  component: Dashboard,
});

function formatMsToHuman(ms: number): string {
  if (!ms || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function Dashboard() {
  const { leads } = Route.useLoaderData();
  const recent = leads.slice(0, 4);
  const getMetricsFn = useServerFn(getAnalyticsMetrics);

  const metricsQ = useQuery({
    queryKey: ["analytics", "metrics"],
    queryFn: () => getMetricsFn(),
    refetchInterval: 30000,
  });

  const m = metricsQ.data;

  const dynamicMetrics = [
    { label: "Leads ativos", value: String(m?.totalContacts ?? 0), delta: leads.length > 0 ? `${leads.length} no DB` : "Sem dados", icon: Users, accent: "var(--color-orange-10)" },
    { label: "Novos hoje", value: String(m?.newToday ?? 0), delta: m?.newToday ? "Hoje" : "—", icon: TrendingUp, accent: "var(--color-green-4)" },
    { label: "Em negociação", value: String(m?.inNegotiation ?? 0), delta: m?.conversionRate ? `${m.conversionRate.toFixed(1)}% conv.` : "—", icon: MessageSquare, accent: "var(--color-blue-10)" },
    { label: "Tempo médio resp.", value: formatMsToHuman(m?.avgResponseMs ?? 0), delta: m?.aiAutomations ? `${m.aiAutomations} IA msgs` : "—", icon: Clock, accent: "var(--color-red-5)" },
  ];

  return (
    <div className="relative min-h-full bg-void animate-in fade-in duration-1000 overflow-y-auto">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] />
      <div className="absolute top-[-20%] right-[-10%] size-[800px] bg-orange-10/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[600px] bg-blue-10/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative px-6 md:px-12 py-8 md:py-16 max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-12 md:mb-20 animate-in slide-in-from-top-6 duration-1000">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-green-4 animate-pulse shadow-[0_0_10px_rgba(17,255,153,0.5)]" />
              <TextSmall className="text-muted-foreground opacity-80">SISTEMA OPERACIONAL · LIVE</TextSmall>
            </div>
            <HeadingHero>
              Boa tarde,<br />
              <span className="text-muted-foreground italic font-light opacity-60">o pipeline performa.</span>
            </HeadingHero>
          </div>
          <Link to="/inbox">
            <Button variant="outline" className="group shadow-2xl">
              ABRIR INBOX <ArrowUpRight className="ml-2 size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </Link>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metricsQ.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <ResendCard key={i} className="p-8 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </ResendCard>
            ))
          ) : (
            dynamicMetrics.map((metric, i) => (
              <ResendCard
                key={metric.label}
                className="p-8 relative overflow-hidden group animate-in zoom-in-95"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className="absolute -top-10 -right-10 size-32 rounded-full opacity-10 blur-3xl transition-all duration-1000 group-hover:opacity-20 group-hover:scale-150"
                  style={{ background: metric.accent }}
                />
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="size-10 rounded-lg bg-white/[0.03] frost-border grid place-items-center group-hover:scale-110 transition-transform">
                    <metric.icon className="size-5 text-muted-foreground group-hover:text-near-white transition-colors" strokeWidth={1.5} />
                  </div>
                  <TextMono className="text-green-4 border border-green-4/20 bg-green-4/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                    {metric.delta}
                  </TextMono>
                </div>
                <div className="text-[56px] leading-none tracking-tight mb-3 font-display text-near-white group-hover:translate-x-1 transition-transform">{metric.value}</div>
                <TextSmall className="text-muted-foreground opacity-70 tracking-[0.2em]">{metric.label}</TextSmall>
              </ResendCard>
            ))
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ResendCard variant="large" className="lg:col-span-2 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:p-10 pb-6 border-b border-frost-border gap-4">
              <HeadingSub className="mb-0">Leads Recentes</HeadingSub>
              <Link to="/leads" className="nav-link text-[12px] flex items-center gap-2 group/link">
                GERENCIAR TODOS <ArrowUpRight className="size-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <div className="px-4">
              {recent.length > 0 ? (
                <ul className="divide-y divide-frost-border/30">
                  {recent.map((l) => (
                    <li
                      key={l.jid}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 md:px-8 py-5 transition-all duration-500 hover:bg-white/[0.03] group/lead"
                    >
                      <div className="size-12 rounded-full grid place-items-center text-[15px] font-bold bg-void frost-border group-hover/lead:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all shrink-0">
                        {l.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-semibold text-near-white/90 group-hover/lead:text-near-white transition-colors">{l.name}</div>
                        <TextMono className="text-[13px] opacity-60 mt-0.5 truncate">{l.jid}</TextMono>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <TextMono className="text-[16px] font-bold text-near-white">
                          {l.score}<span className="text-muted-foreground/30 font-medium text-[12px] ml-1">/100</span>
                        </TextMono>
                        <span className={cn(
                          "text-[9px] font-mono font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded inline-block",
                          l.instance_id === "L1" ? "bg-orange-10/10 text-orange-10 border border-orange-10/20" : "bg-blue-10/10 text-blue-10 border border-blue-10/20"
                        )}>
                          {l.instance_id}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-20 text-center text-muted-foreground opacity-50 italic">
                  Nenhum lead processado ainda.
                </div>
              )}
            </div>
          </ResendCard>

          <ResendCard variant="large" className="p-10 bg-void relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] size-64 rounded-full bg-orange-10 opacity-[0.05] blur-[60px] group-hover:opacity-10 transition-opacity duration-1000" />
            <div className="size-12 rounded-xl bg-white/[0.02] frost-border grid place-items-center mb-8 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="size-6 text-orange-10 animate-pulse" />
            </div>
            <HeadingSub className="text-[36px] leading-[1.1] mb-6 tracking-tighter">
              A inteligência está <br />
              <span className="italic opacity-60">pronta para agir.</span>
            </HeadingSub>
            <TextMono className="text-[15px] leading-relaxed mb-10 block opacity-80">
              Gerenciamento automático de leads via Evolution API.
            </TextMono>
            <Button variant="default" className="w-full py-6">
              QUALIFICAR AGORA
            </Button>

            <div className="mt-10 pt-10 border-t border-frost-border/40 flex items-center justify-between">
              <TextSmall className="text-[10px] opacity-50">MODELO ATIVO</TextSmall>
              <TextMono className="text-[11px] bg-white/[0.05] px-3 py-1 rounded frost-border text-near-white">
                GPT-4O · PRO
              </TextMono>
            </div>
          </ResendCard>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Expected: No errors related to index.tsx

- [ ] **Step 3: Commit**

```bash
git add src/routes/index.tsx
git commit -m "fix: replace hardcoded dashboard metrics with real DB queries"
```

---

### Task 4: Fix Analytics — Replace Hardcoded Data

**Files:**

- Modify: `src/routes/analytics.tsx`

- [ ] **Step 1: Rewrite analytics.tsx with real data**

Replace the entire content of `src/routes/analytics.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ArrowUpRight, Loader2 } from "lucide-react";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";
import { getAnalyticsMetrics } from "@/lib/server-functions";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Leadflow" },
      { name: "description", content: "Métricas cinematográficas de performance da operação." },
    ],
  }),
  component: AnalyticsPage,
});

function formatMsToHuman(ms: number): string {
  if (!ms || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function AnalyticsPage() {
  const getMetricsFn = useServerFn(getAnalyticsMetrics);

  const metricsQ = useQuery({
    queryKey: ["analytics", "metrics"],
    queryFn: () => getMetricsFn(),
    refetchInterval: 30000,
  });

  const m = metricsQ.data;

  // Build chart series from weekly data, padding to 18 points
  const buildSeries = (): number[] => {
    if (!m?.weeklyQualified || m.weeklyQualified.length === 0) {
      return Array(18).fill(0);
    }
    const series: number[] = [];
    const weekMap = new Map<string, number>();
    m.weeklyQualified.forEach((w: { week_start: string; count: number }) => {
      weekMap.set(w.week_start, w.count);
    });
    // Generate last 18 weeks
    for (let i = 17; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 7));
      // Get the Sunday of that week
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      const key = d.toISOString().split('T')[0];
      series.push(weekMap.get(key) || 0);
    }
    return series;
  };

  const series = buildSeries();

  if (metricsQ.isLoading) {
    return (
      <div className="relative min-h-screen bg-void px-12 py-16 animate-in fade-in duration-1000 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-void px-12 py-16 animate-in fade-in duration-1000">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20 animate-in slide-in-from-top-4 duration-1000">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="size-4 text-muted-foreground" />
            <TextSmall className="text-muted-foreground opacity-80">Últimas 18 semanas</TextSmall>
          </div>
          <HeadingHero>Analytics</HeadingHero>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="default" className="uppercase tracking-widest text-[12px] font-black">Exportar Dados</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard
          label="Conversão"
          value={`${m?.conversionRate?.toFixed(1) ?? 0}%`}
          delta={m?.conversionRate ? (m.conversionRate > 30 ? "Bom" : "Melhorar") : "Sem dados"}
          accent={m?.conversionRate && m.conversionRate > 30 ? "green" : m?.conversionRate && m.conversionRate > 15 ? "blue" : "red"}
        />
        <StatCard
          label="Resposta Média"
          value={formatMsToHuman(m?.avgResponseMs ?? 0)}
          delta={m?.avgResponseMs ? "Calculado" : "Sem dados"}
          accent="red"
        />
        <StatCard
          label="IA Automations"
          value={String(m?.aiAutomations ?? 0)}
          delta={m?.aiAutomations ? "Total" : "Nenhum"}
          accent="blue"
        />
      </div>

      <ResendCard variant="section" className="p-12 mb-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-near-white/10 to-transparent" />

        <div className="flex items-end justify-between mb-12 relative z-10">
          <div>
            <HeadingSub className="text-[24px]">Performance do Pipeline</HeadingSub>
            <p className="text-[15px] text-muted-foreground mt-2 italic font-sans opacity-70">Leads qualificados por semana</p>
          </div>
          <div className="text-right">
            <div className="text-[48px] font-display leading-none tracking-tighter text-near-white">
              {m?.totalContacts ?? 0}
            </div>
            <TextSmall className="text-green-4 mt-2 block">Total de Leads</TextSmall>
          </div>
        </div>

        <div className="relative h-64 mt-8">
           <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const max = Math.max(...series, 1);
                const points = series.map((v, i) => `${(i / (series.length - 1)) * 1000},${180 - (v / max) * 160}`).join(" ");
                return (
                  <>
                    <path
                      d={`M0,200 L0,${180 - (series[0] / max) * 160} ${points} L1000,200 Z`}
                      fill="url(#chartGradient)"
                    />
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {series.map((v, i) => (
                      <circle
                        key={i}
                        cx={(i / (series.length - 1)) * 1000}
                        cy={180 - (v / max) * 160}
                        r="3"
                        fill="#000000"
                        stroke="#f0f0f0"
                        strokeWidth="1.5"
                      />
                    ))}
                  </>
                );
              })()}
           </svg>
        </div>
        <div className="mt-10 flex justify-between">
          <TextMono className="opacity-30 tracking-[0.3em] uppercase">18 SEMANAS ATRÁS</TextMono>
          <TextMono className="opacity-30 tracking-[0.3em] uppercase">HOJE</TextMono>
        </div>
      </ResendCard>
    </div>
  );
}

function StatCard({ label, value, delta, accent }: { label: string; value: string; delta: string; accent: "green" | "red" | "blue" }) {
  const color = accent === "green" ? "text-green-4" : accent === "red" ? "text-red-5" : "text-blue-10";
  return (
    <ResendCard className="p-8 group relative overflow-hidden">
      <TextSmall className="opacity-60 mb-4 block">{label}</TextSmall>
      <div className="text-[48px] font-display text-near-white mb-2 leading-none group-hover:translate-x-1 transition-transform">{value}</div>
      <TextMono className={color}>{delta}</TextMono>
    </ResendCard>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Expected: No errors related to analytics.tsx

- [ ] **Step 3: Commit**

```bash
git add src/routes/analytics.tsx
git commit -m "fix: replace hardcoded analytics data with real DB queries"
```

---

### Task 5: Fix AI Settings — Wire Prompt Save/Load

**Files:**

- Modify: `src/routes/settings.tsx`

- [ ] **Step 1: Update imports in settings.tsx**

Replace the imports at the top of `src/routes/settings.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Wifi, Shield, Command, Loader2, Save } from "lucide-react";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { InstancesPanel } from "@/components/evolution/InstancesPanel";
import { getPrompts, savePrompt } from "@/lib/server-functions";
import { toast } from "sonner";
```

- [ ] **Step 2: Replace the AISettings component**

Replace the `AISettings` function in `src/routes/settings.tsx` with:

```typescript
function AISettings() {
  const qc = useQueryClient();
  const getPromptsFn = useServerFn(getPrompts);
  const savePromptFn = useServerFn(savePrompt);

  const promptsQ = useQuery({
    queryKey: ["prompts"],
    queryFn: () => getPromptsFn(),
  });

  const [selectedPrompt, setSelectedPrompt] = useState<{ id: string; name: string; content: string } | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (promptsQ.data && promptsQ.data.length > 0 && !selectedPrompt) {
      const first = promptsQ.data[0];
      setSelectedPrompt({ id: first.id, name: first.name, content: first.content });
      setContent(first.content);
    }
  }, [promptsQ.data, selectedPrompt]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!selectedPrompt) return;
      return savePromptFn({ data: { id: selectedPrompt.id, name: selectedPrompt.name, content } });
    },
    onSuccess: () => {
      toast.success("Prompt salvo com sucesso");
      qc.invalidateQueries({ queryKey: ["prompts"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleNewPrompt = () => {
    const newPrompt = { id: `prompt_${Date.now()}`, name: "Novo Prompt", content: "" };
    setSelectedPrompt(newPrompt);
    setContent("");
  };

  if (promptsQ.isLoading) {
    return (
      <section className="space-y-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <TextSmall>Carregando prompts...</TextSmall>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-12">
      <div className="flex items-baseline justify-between border-b border-frost-border pb-8">
        <div>
          <HeadingSub className="mb-2">Motor de IA Inteligente</HeadingSub>
          <TextSmall className="text-muted-foreground">Configure as diretrizes e o comportamento do processamento de leads.</TextSmall>
        </div>
        <div className="flex items-center gap-3">
          {promptsQ.data && promptsQ.data.length > 0 && (
            <select
              value={selectedPrompt?.id ?? ""}
              onChange={(e) => {
                const p = promptsQ.data.find(x => x.id === e.target.value);
                if (p) {
                  setSelectedPrompt({ id: p.id, name: p.name, content: p.content });
                  setContent(p.content);
                }
              }}
              className="bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none text-foreground"
            >
              {promptsQ.data.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={handleNewPrompt} className="font-bold tracking-widest text-[10px]">
            NOVO
          </Button>
          <TextMono className="opacity-50 text-[11px]">v4.2-STABLE</TextMono>
        </div>
      </div>

      <div className="code-block relative group">
         <div className="absolute top-0 right-0 p-6 flex gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
           <Shield className="size-4 text-near-white" />
           <Sparkles className="size-4 text-orange-10" />
         </div>
         <TextMono className="flex items-center gap-4 mb-6 uppercase tracking-widest border-b border-frost-border/20 pb-4 block text-[11px]">
            <span className="text-orange-10 animate-pulse">●</span>
            {selectedPrompt?.name ?? "system_instruction.md"}
         </TextMono>
         <textarea
           className="w-full h-80 bg-transparent outline-none resize-none text-[15px] font-mono leading-relaxed text-near-white/80 scrollbar-hide"
           spellCheck={false}
           value={content}
           onChange={(e) => setContent(e.target.value)}
         />
         <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-frost-border/20">
            <Button variant="secondary" size="sm" className="px-6 uppercase tracking-widest text-[11px] font-black" onClick={() => {
              if (selectedPrompt) setContent(selectedPrompt.content);
            }}>RESTAURAR</Button>
            <Button
              variant="default"
              size="sm"
              className="px-8 uppercase tracking-widest text-[11px] font-black shadow-2xl"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !content.trim()}
            >
              {saveMut.isPending ? <Loader2 className="size-3.5 animate-spin mr-2" /> : <Save className="size-3.5 mr-2" />}
              SALVAR MUDANÇAS
            </Button>
         </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Expected: No errors related to settings.tsx

- [ ] **Step 4: Commit**

```bash
git add src/routes/settings.tsx
git commit -m "fix: wire AI settings to load/save prompts from database"
```

---

### Task 6: Fix Leads Page — Persist Drag-and-Drop Status Changes

**Files:**

- Modify: `src/routes/leads.tsx`

- [ ] **Step 1: Add imports and wire up status persistence**

In `src/routes/leads.tsx`, update the imports:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { STATUS_LABELS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { Search, Plus, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";
import { getLeads, updateLeadStatus } from "@/lib/server-functions";
import { toast } from "sonner";
```

- [ ] **Step 2: Update the onDragEnd handler in LeadsPage**

Inside the `LeadsPage` component, replace the `onDragEnd` function:

```typescript
const qc = useQueryClient();
const updateStatusFn = useServerFn(updateLeadStatus);

const onDragEnd = (result: DropResult) => {
  const { destination, source, draggableId } = result;

  if (!destination) return;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return;

  const leadIndex = leads.findIndex((l) => l.jid === draggableId);
  if (leadIndex === -1) return;

  const updatedLeads = [...leads];
  const [movedLead] = updatedLeads.splice(leadIndex, 1);

  const leadWithNewStatus = {
    ...movedLead,
    status: destination.droppableId as any,
  };

  updatedLeads.push(leadWithNewStatus);
  setLeads(updatedLeads);

  // Persist to server
  updateStatusFn({ data: { jid: draggableId, status: destination.droppableId } })
    .then(() => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    })
    .catch((err: Error) => {
      toast.error("Erro ao atualizar status: " + err.message);
      // Revert on failure
      setLeads(leads);
    });
};
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Expected: No errors related to leads.tsx

- [ ] **Step 4: Commit**

```bash
git add src/routes/leads.tsx
git commit -m "fix: persist lead status changes from drag-and-drop to database"
```

---

### Task 7: Clean Up Mock Data

**Files:**

- Modify: `src/lib/mock-data.ts`

- [ ] **Step 1: Remove unused LEADS array and related types**

The `LEADS` array (6 fake leads) is not imported anywhere. Remove it along with types only used by it. Keep `STATUS_LABELS`, `Tag` type, `ALL_TAGS`, and `LineId` type since they are imported by other files.

Replace the content of `src/lib/mock-data.ts`:

```typescript
export type LineId = "L1" | "L2";

export type Tag = {
  id: string;
  label: string;
  color: "orange" | "green" | "blue" | "yellow" | "red";
};

export const ALL_TAGS: Tag[] = [
  { id: "t1", label: "Soja", color: "green" },
  { id: "t2", label: "Imóveis", color: "orange" },
  { id: "t3", label: "Alta prioridade", color: "red" },
  { id: "t4", label: "Indicação", color: "blue" },
  { id: "t5", label: "Frio", color: "yellow" },
  { id: "t6", label: "Retornar", color: "blue" },
];

export const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  negociacao: "Em negociação",
  qualificado: "Qualificado",
  perdido: "Perdido",
};
```

This removes:

- The `Message` type (only used by LEADS)
- The `Lead` type (only used by LEADS)
- The `LEADS` array (6 fake leads, never imported)

- [ ] **Step 2: Verify no broken imports**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -30`
Expected: No type errors. If `TagPill` or other components break, they only import the `Tag` type which we kept.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "chore: remove unused mock LEADS array, keep shared constants"
```

---

### Task 8: Seed Database with Default Prompt (Optional but Recommended)

**Files:**

- Create: `src/lib/seed.ts`

- [ ] **Step 1: Create seed script**

Create `src/lib/seed.ts`:

```typescript
import { DatabaseService } from "./services/db.service";

const DEFAULT_PROMPT = `Você é um analista comercial sênior especialista em High Ticket.
Analise a transcrição da conversa e gere um objeto JSON:

1. EXECUTIVE_SUMMARY (3-5 linhas diretas)
2. QUALIFICATION_SCORE (0-100 baseado em urgência e budget)
3. IDENTIFIED_NEEDS (Lista técnica de dores)
4. SUGGESTED_NEXT_STEPS (Ações pragmáticas)

Tom: Sóbrio, editorial, técnico.`;

export async function seedDatabase(db: D1Database) {
  const dbService = new DatabaseService(db);

  // Check if prompts exist
  const prompts = await dbService.getPrompts();
  if (prompts.length === 0) {
    await dbService.savePrompt({
      id: "default_sales",
      name: "Sales Analyst",
      content: DEFAULT_PROMPT,
      category: "sales",
    });
    console.log("[seed] Created default sales prompt");
  }
}
```

- [ ] **Step 2: Wire seed into server.ts**

In `src/server.ts`, after the DB is detected and before the handler, add the seed call. Find the block where `globalThis.DB` is set and add after it:

```typescript
      if (db) {
        console.log('DB active, injecting into globalThis');
        (globalThis as any).DB = db;

        // Seed default data if needed (only once)
        try {
          const { seedDatabase } = await import('./lib/seed');
          await seedDatabase(db);
        } catch (err) {
          console.error('Seed failed:', err);
        }
      } else {
```

The full modified block in `src/server.ts` should look like:

```typescript
if (db) {
  console.log("DB active, injecting into globalThis");
  (globalThis as any).DB = db;

  // Seed default data if needed (only once)
  try {
    const { seedDatabase } = await import("./lib/seed");
    await seedDatabase(db);
  } catch (err) {
    console.error("Seed failed:", err);
  }
} else {
  console.warn("DB NOT FOUND in env or local filesystem");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/seed.ts src/server.ts
git commit -m "feat: add database seed for default AI prompt"
```

---

## Self-Review Checklist

**1. Spec coverage:**

- [x] Mock data (LEADS array) removed → Task 7
- [x] Dashboard metrics dynamic → Task 3
- [x] Analytics page dynamic → Task 4
- [x] AI settings save/load → Task 5
- [x] Leads drag-and-drop persistence → Task 6
- [x] Database methods for all new queries → Task 1
- [x] Server functions for all new endpoints → Task 2
- [x] Seed default prompt → Task 8

**2. Placeholder scan:**

- No TBD, TODO, or "implement later" in any step
- All code blocks contain actual implementation code
- All test/verification commands are explicit

**3. Type consistency:**

- `getAnalyticsMetrics` returns `{ totalContacts, newToday, inNegotiation, avgResponseMs, conversionRate, aiAutomations, weeklyQualified }` — used consistently in Tasks 3 and 4
- `savePrompt` accepts `{ id?, name, content, category? }` — used in Tasks 2 and 5
- `updateLeadStatus` accepts `{ jid, status }` — used in Tasks 2 and 6
- `STATUS_LABELS` kept as `Record<string, string>` in Task 7 (was `Record<Lead["status"], string>` before, but Lead type is removed — the broader type is fine since it's still compatible)
