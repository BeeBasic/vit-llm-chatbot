import { useState } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Users, 
  MapPin, 
  Briefcase, 
  Clock, 
  FileText,
  History,
  Upload,
  Star,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ChatSidebarProps {
  onClose: () => void;
}

const navigationItems = [
  { icon: GraduationCap, label: "Credits Policy", badge: "New" },
  { icon: BookOpen, label: "NPTEL Policy", badge: null },
  { icon: Calendar, label: "Attendance & Exams", badge: null },
  { icon: MapPin, label: "Hostel & Mess Rules", badge: null },
  { icon: Users, label: "Clubs & Extra-Curriculars", badge: null },
  { icon: Briefcase, label: "Placement Cell", badge: "Hot" },
  { icon: Clock, label: "VITOL Deadlines", badge: "3" },
  { icon: FileText, label: "Regulations JSON", badge: null },
];

const recentChats = [
  "Credit requirements for B.Tech",
  "NPTEL course registration",
  "Hostel room allocation process",
  "Placement drive schedule",
  "Club registration deadlines"
];

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  return (
    <div className="w-80 h-full bg-sidebar border-r border-sidebar-border shadow-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sidebar-foreground">Navigation</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Quick Links</h3>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.label}
                  variant={activeItem === item.label ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => setActiveItem(item.label)}
                >
                  <item.icon className="h-4 w-4 text-sidebar-primary" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant={item.badge === "New" ? "default" : item.badge === "Hot" ? "destructive" : "secondary"}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Recent Chats */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-sidebar-foreground">Recent Chats</h3>
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              {recentChats.map((chat, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2 text-sm"
                >
                  <div className="truncate">{chat}</div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Uploaded Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-sidebar-foreground">Documents</h3>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-sidebar-accent">
                <div className="flex items-center justify-between">
                  <span className="text-sm">VIT_Handbook.pdf</span>
                  <Star className="h-3 w-3 text-accent" />
                </div>
                <div className="text-xs text-muted-foreground">2.3 MB • 3 days ago</div>
              </div>
              <div className="p-2 rounded-lg bg-sidebar-accent">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Exam_Schedule.csv</span>
                </div>
                <div className="text-xs text-muted-foreground">156 KB • 1 week ago</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}