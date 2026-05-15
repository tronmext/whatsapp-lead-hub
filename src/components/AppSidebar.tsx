import * as React from "react"
import { useMemo } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useQuery } from "@tanstack/react-query"
import { 
  Inbox, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Wifi,
  ChevronRight,
  PanelLeft,
  Loader2
} from "lucide-react"
import logoFull from "@/assets/logo-full.png"
import logoIcon from "@/assets/logo-icon.png"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { TextMono, TextSmall } from "@/components/Typography"
import { listInstances } from "@/lib/evolution.functions"
import { getInstances } from "@/lib/server-functions"

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inbox", url: "/inbox", icon: Inbox },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  })

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-frost-border bg-void">
      <SidebarHeader className={cn("h-20 flex items-center justify-center transition-all duration-300", collapsed && "h-16 p-1")}>
        <Link to="/" className="flex items-center justify-center group transition-transform active:scale-95 w-full">
          <img 
            src={collapsed ? logoIcon : logoFull}
            alt="Leadflow Logo"
            className={cn(
              "object-contain transition-all duration-300",
              collapsed ? "size-8" : "h-10 w-auto"
            )}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("px-2 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-2 transition-all", collapsed && "opacity-0 h-0 mb-0 overflow-hidden")}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "h-12 transition-all duration-200 rounded-xl mx-auto",
                        active 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                      )}
                    >
                      <Link to={item.url} className="flex items-center w-full">
                        <item.icon className={cn("size-4.5 shrink-0", active ? "text-near-white" : "text-muted-foreground")} strokeWidth={1.8} />
                        {!collapsed && (
                          <span className={cn(
                            "ml-3 tracking-[0.35px] font-section font-medium",
                            active ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {item.title}
                          </span>
                        )}
                        {active && !collapsed && (
                          <ChevronRight className="ml-auto size-3.5 opacity-50" strokeWidth={3} />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        <InstanceStatuses collapsed={collapsed} />
        
        {!collapsed && (
          <div className="pt-4 border-t border-frost-border/20">
            <TextMono className="text-[9px] uppercase tracking-[0.3em] font-black opacity-30 text-center block">
              Leadflow v1.0.8
            </TextMono>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function InstanceStatuses({ collapsed }: { collapsed: boolean }) {
  const listFn = useServerFn(listInstances)
  const getInstancesFn = useServerFn(getInstances)
  
  const { data, isLoading } = useQuery({
    queryKey: ["sidebar", "instances"],
    queryFn: () => listFn(),
    refetchInterval: 10000,
  })

  const { data: dbInstances, isLoading: dbLoading } = useQuery({
    queryKey: ["sidebar", "db-instances"],
    queryFn: () => getInstancesFn(),
    refetchInterval: 10000,
  })

  const aliasMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (dbInstances) {
      dbInstances.forEach((inst: any) => {
        map[inst.name] = inst.alias ?? ""
      })
    }
    return map
  }, [dbInstances])

  const instances = (data?.instances ?? []) as Array<{
    instanceName?: string
    state?: string
    ownerJid?: string
    profileName?: string
    connectionStatus?: string
  }>

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (instances.length === 0) {
    if (!collapsed) {
      return (
        <TextSmall className="text-[9px] opacity-40 text-center block">
          Nenhuma instância conectada
        </TextSmall>
      )
    }
    return null
  }

  return (
    <div className="space-y-3">
      {instances.map((inst) => {
        const name = inst.instanceName ?? "—"
        const state = inst.state ?? inst.connectionStatus ?? "close"
        const isOnline = state === "open"
        const phone = inst.ownerJid ? inst.ownerJid.split("@")[0] : ""
        const formattedPhone = phone.length > 4 
          ? `${phone.slice(0, -4)}-${phone.slice(-4)}` 
          : phone
        
        if (collapsed) {
          const display = aliasMap[name] || name.slice(0, 2)
          return (
            <div key={name} className="flex flex-col items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity min-h-[40px]">
              <div className={cn("size-2 rounded-full", isOnline ? "bg-green-4 animate-pulse shadow-[0_0_8px_rgba(17,255,153,0.4)]" : "bg-muted")} />
              <span className="text-[9px] font-black font-mono text-muted-foreground">{display}</span>
            </div>
          )
        }

        const stateColor = isOnline ? "text-green-4" : state === "connecting" ? "text-orange-10" : "text-red-5"
        const stateLabel = isOnline ? "LIVE" : state === "connecting" ? "CONECTANDO" : "OFF"
        const displayName = aliasMap[name] || name

        return (
          <div key={name} className="frost-border rounded-xl px-3 py-3 bg-white/[0.01] group/status hover:bg-white/[0.03] transition-all shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black font-mono px-1.5 rounded border border-current bg-current/5 text-muted-foreground">
                  {displayName}
                </span>
                <TextSmall className="text-[9px] opacity-40">INSTÂNCIA</TextSmall>
              </div>
              <span className={cn("flex items-center gap-1 text-[9px] font-mono font-bold", stateColor)}>
                <span className={cn("size-1.5 rounded-full", isOnline ? "bg-green-4 animate-pulse" : state === "connecting" ? "bg-orange-10 animate-pulse" : "bg-red-5")} />
                {stateLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 transition-colors">
              <Wifi className="size-3 text-muted-foreground group-hover/status:text-blue-10" strokeWidth={2.5} />
              <TextMono className="text-[11px] group-hover/status:text-foreground tracking-tighter">
                {formattedPhone ? `+${formattedPhone}` : "Sem número"}
              </TextMono>
            </div>
          </div>
        )
      })}
    </div>
  )
}
