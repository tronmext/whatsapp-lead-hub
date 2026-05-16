import { useEffect, useMemo, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Sparkles, Bell } from "lucide-react";
import { TextMono } from "./Typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInstanceAiStatus } from "@/lib/server-functions";

type HeaderUserProfile = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

const PROFILE_STORAGE_KEYS = ["user", "auth.user", "leadflow.user", "google.user", "session.user"];
const ACTIVE_INSTANCE_KEY = "evolution.activeInstance";

function extractProfile(raw: unknown): HeaderUserProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name : undefined;
  const email = typeof obj.email === "string" ? obj.email : undefined;
  const avatarUrl =
    typeof obj.picture === "string"
      ? obj.picture
      : typeof obj.photoURL === "string"
        ? obj.photoURL
        : typeof obj.avatarUrl === "string"
          ? obj.avatarUrl
          : typeof obj.image === "string"
            ? obj.image
            : undefined;

  if (!name && !email && !avatarUrl) return null;
  return { name, email, avatarUrl };
}

function readProfileFromStorage(): HeaderUserProfile | null {
  if (typeof window === "undefined") return null;

  for (const key of PROFILE_STORAGE_KEYS) {
    const rawValue = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (!rawValue) continue;
    try {
      const parsed = JSON.parse(rawValue);
      const profile = extractProfile(parsed);
      if (profile) return profile;
    } catch {
      // Ignore invalid JSON and continue checking other keys.
    }
  }

  return null;
}

function getInitials(name?: string, email?: string): string {
  const base = (name || email || "").trim();
  if (!base) return "US";
  const pieces = base.split(/[\s@._-]+/).filter(Boolean);
  if (pieces.length === 0) return "US";
  if (pieces.length === 1) return pieces[0].slice(0, 2).toUpperCase();
  return `${pieces[0][0]}${pieces[1][0]}`.toUpperCase();
}

function readActiveInstance(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_INSTANCE_KEY);
}

export function AppShell() {
  const [profile, setProfile] = useState<HeaderUserProfile | null>(null);
  const [activeInstance, setActiveInstance] = useState<string | null>(null);
  const getInstanceAiStatusFn = useServerFn(getInstanceAiStatus);

  useEffect(() => {
    const syncProfile = () => setProfile(readProfileFromStorage());
    syncProfile();
    window.addEventListener("storage", syncProfile);
    return () => window.removeEventListener("storage", syncProfile);
  }, []);

  const userInitials = useMemo(
    () => getInitials(profile?.name, profile?.email),
    [profile?.email, profile?.name],
  );
  const userLabel = profile?.name || profile?.email || "Usuário";

  useEffect(() => {
    const syncActive = () => setActiveInstance(readActiveInstance());
    syncActive();
    window.addEventListener("storage", syncActive);
    const i = window.setInterval(syncActive, 1500);
    return () => {
      window.removeEventListener("storage", syncActive);
      window.clearInterval(i);
    };
  }, []);

  const aiStatusQ = useQuery({
    queryKey: ["header", "ai-status", activeInstance],
    queryFn: () => getInstanceAiStatusFn({ data: { instanceId: activeInstance! } }),
    enabled: !!activeInstance,
    staleTime: 15000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const aiStatusMeta = useMemo(() => {
    if (!activeInstance) return { label: "IA sem instância", className: "text-muted-foreground" };
    if (aiStatusQ.isLoading || aiStatusQ.isFetching) {
      return { label: "IA verificando", className: "text-orange-10/80" };
    }
    const total = Number(aiStatusQ.data?.total ?? 0);
    const enabled = Number(aiStatusQ.data?.enabled ?? 0);

    if (total <= 0) return { label: "IA sem leads", className: "text-muted-foreground" };
    if (enabled <= 0) return { label: "IA inativa", className: "text-red-5/85" };
    if (enabled >= total) return { label: "IA ativa", className: "text-green-4/85" };
    return { label: `IA parcial ${enabled}/${total}`, className: "text-orange-10/85" };
  }, [
    activeInstance,
    aiStatusQ.data?.enabled,
    aiStatusQ.data?.total,
    aiStatusQ.isFetching,
    aiStatusQ.isLoading,
  ]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-void text-near-white animate-in fade-in duration-500 overflow-hidden">
        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1 bg-void relative overflow-hidden">
          {/* Decorative backdrop for Inset */}
          <div className="absolute inset-0 bg-void pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Premium Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-frost-border/30 bg-void/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-near-white transition-colors" />
            </div>

            <div className="flex items-center gap-3">
              <div 
                className="hidden sm:flex items-center gap-2 mr-4"
                title={
                  activeInstance
                    ? `Instância ativa: ${activeInstance}`
                    : "Nenhuma instância ativa"
                }
              >
                <Sparkles className={`size-3 ${aiStatusMeta.className}`} />
                <TextMono className={`text-[10px] font-black uppercase tracking-[0.2em] ${aiStatusMeta.className}`}>
                  {aiStatusMeta.label}
                </TextMono>
              </div>

              <button className="size-9 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all relative">
                <Bell className="size-4.5" />
                <span className="absolute top-2.5 right-2.5 size-1.5 bg-red-5 rounded-full shadow-[0_0_8px_rgba(255,32,71,0.5)]" />
              </button>

              <div className="size-9 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all cursor-pointer">
                <Avatar className="size-8">
                  {profile?.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={userLabel} />
                  ) : null}
                  <AvatarFallback className="bg-white/5 text-[10px] font-semibold text-near-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden scroll-smooth">
            <Outlet />
          </main>
        </SidebarInset>

        <Toaster />
      </div>
    </SidebarProvider>
  );
}
