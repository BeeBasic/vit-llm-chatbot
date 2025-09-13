import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "./ChatSidebar";
import { ChatInterface } from "../chat/ChatInterface";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gradient-subtle">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed md:relative z-50 h-full transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <ChatSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shadow-card">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">VIT</span>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">VIT AI Assistant</h1>
                  <p className="text-xs text-muted-foreground">Your Academic Companion</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </header>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
