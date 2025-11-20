import { Home, Languages, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "translate", icon: Home, label: "Home" },
  { id: "training", icon: BookOpen, label: "Contribute" },
  { id: "accuracy", icon: Languages, label: "Accuracy" },
  { id: "management", icon: User, label: "Profile" },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark shadow-extra-large border-t border-border/50 safe-bottom">
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
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
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
