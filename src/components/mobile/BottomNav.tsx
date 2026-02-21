import { Home, BookOpen, User, BarChart3, Shield, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Admin gets different bottom nav with admin-specific shortcuts
  const adminNavItems = [
    { id: "dashboard", icon: Shield, label: "Dashboard" },
    { id: "admin", icon: Crown, label: "Admin" },
    { id: "translate", icon: Home, label: "Translate" },
    { id: "training", icon: BookOpen, label: "Contribute" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const userNavItems = [
    { id: "translate", icon: Home, label: "Translate" },
    { id: "training", icon: BookOpen, label: "Contribute" },
    { id: "contributor", icon: BarChart3, label: "Stats" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 shadow-extra-large border-t safe-bottom",
      isAdmin 
        ? "bg-gray-900/95 backdrop-blur-sm border-red-800/50" 
        : "glass-dark border-border/50"
    )}>
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-xl",
                "transition-all duration-300 touch-target active:scale-95",
                "min-w-[60px] px-2",
                isActive 
                  ? isAdmin ? "text-red-400" : "text-primary"
                  : isAdmin 
                    ? "text-gray-500 hover:text-gray-300" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full",
                  isAdmin ? "bg-red-500" : "bg-primary"
                )} />
              )}
              <Icon className={cn(
                "w-6 h-6 transition-all duration-300",
                isActive && "scale-110 drop-shadow-lg"
              )} />
              <span className={cn(
                "text-xs transition-all duration-200",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
