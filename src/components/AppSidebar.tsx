import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { 
  Inbox, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Wifi,
  ChevronRight,
  PanelLeft
} from "lucide-react"

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
      <SidebarHeader className={cn("p-4 transition-all duration-300", collapsed ? "items-center" : "items-start")}>
        <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95 overflow-hidden">
          <div className="size-8 shrink-0 rounded-lg bg-near-white text-void grid place-items-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Sparkles className="size-5" strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <span className="font-section text-[18px] font-semibold tracking-[-1px] text-near-white animate-in fade-in slide-in-from-left-2 duration-300">
              leadflow<span className="text-orange-10">.</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-2">
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
                        "h-10 transition-all duration-200",
                        active 
                          ? "bg-white/[0.05] text-near-white frost-border" 
                          : "text-muted-foreground hover:text-near-white hover:bg-white/[0.02]"
                      )}
                    >
                      <Link to={item.url} className={cn("flex items-center w-full", collapsed && "justify-center")}>
                        <item.icon className={cn("size-4.5 shrink-0", active ? "text-near-white" : "text-muted-foreground")} strokeWidth={1.8} />
                        {!collapsed && (
                          <span className={cn(
                            "ml-3 tracking-[0.35px] font-section font-medium",
                            active ? "text-near-white" : "text-muted-foreground"
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
        <div className="space-y-3">
          <LineStatus label="L1" phone="99887-1100" online collapsed={collapsed} color="orange" />
          <LineStatus label="L2" phone="99700-2244" online collapsed={collapsed} color="blue" />
        </div>
        
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

function LineStatus({
  label,
  phone,
  online,
  collapsed,
  color
}: {
  label: string
  phone: string
  online: boolean
  collapsed: boolean
  color: "orange" | "blue"
}) {
  const accentColor = color === "orange" ? "text-orange-10" : "text-blue-10"
  
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
        <div className={cn("size-2 rounded-full", online ? "bg-green-4 animate-pulse shadow-[0_0_8px_rgba(17,255,153,0.4)]" : "bg-muted")} />
        <span className={cn("text-[9px] font-black font-mono", accentColor)}>{label}</span>
      </div>
    )
  }

  return (
    <div className="frost-border rounded-xl px-3 py-3 bg-white/[0.01] group/status hover:bg-white/[0.03] transition-all shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] font-black font-mono px-1.5 rounded border border-current bg-current/5", accentColor)}>
            {label}
          </span>
          <TextSmall className="text-[9px] opacity-40">INSTÂNCIA ACTIVE</TextSmall>
        </div>
        <span className="flex items-center gap-1 text-[9px] text-green-4 font-mono font-bold">
          <span className="size-1.5 rounded-full bg-green-4 animate-pulse" />
          {online ? "LIVE" : "OFF"}
        </span>
      </div>
      <div className="flex items-center gap-2 transition-colors">
        <Wifi className="size-3 text-muted-foreground group-hover/status:text-blue-10" strokeWidth={2.5} />
        <TextMono className="text-[11px] group-hover/status:text-near-white tracking-tighter">
          +55 11 {phone}
        </TextMono>
      </div>
    </div>
  )
}
