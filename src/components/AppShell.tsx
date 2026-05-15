import { Link, Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { Sparkles, Search, Bell, User } from "lucide-react"
import { ResendButton } from "./ResendButton"
import { TextMono } from "./Typography"

export function AppShell() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-void text-near-white animate-in fade-in duration-500 overflow-hidden">
        <AppSidebar />
        
        <SidebarInset className="flex flex-col flex-1 bg-void relative overflow-hidden">
          {/* Decorative backdrop for Inset */}
          <div className="absolute inset-0 bg-void pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          
          {/* Premium Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-frost-border/30 bg-void/50 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-near-white transition-colors" />
              <div className="h-4 w-[1px] bg-frost-border/40 mx-2" />
              <div className="hidden md:flex items-center gap-2 group cursor-pointer">
                <Search className="size-3.5 text-muted-foreground group-hover:text-near-white transition-colors" />
                <span className="text-[11px] font-mono font-bold tracking-widest text-muted-foreground/60 uppercase group-hover:text-near-white/60 transition-colors">
                  Search Command <kbd className="ml-2 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-[9px]">⌘K</kbd>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 mr-4">
                <Sparkles className="size-3 text-orange-10" />
                <TextMono className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-10/70">
                  AI Active
                </TextMono>
              </div>
              
              <button className="size-9 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all relative">
                <Bell className="size-4.5" />
                <span className="absolute top-2.5 right-2.5 size-1.5 bg-red-5 rounded-full shadow-[0_0_8px_rgba(255,32,71,0.5)]" />
              </button>
              
              <div className="size-9 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-near-white hover:bg-white/5 transition-all cursor-pointer">
                <User className="size-4.5" />
              </div>
              
              <div className="w-[1px] h-6 bg-frost-border/30 mx-1" />
              
              <ResendButton variant="primary" size="sm" className="hidden lg:flex font-black tracking-widest text-[11px]">
                UPGRADE
              </ResendButton>
            </div>
          </header>

          <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </SidebarInset>
        
        <Toaster />
      </div>
    </SidebarProvider>
  )
}
