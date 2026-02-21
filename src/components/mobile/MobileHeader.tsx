import { useState, useEffect } from "react";
import { ArrowLeft, Search, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import MobileDrawer from "./MobileDrawer";

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  showSearch?: boolean;
  onSearchClick?: () => void;
  notificationCount?: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function MobileHeader({
  title,
  onBack,
  showSearch = false,
  onSearchClick,
  notificationCount = 0,
  activeTab = "translate",
  onTabChange = () => {},
}: MobileHeaderProps) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 safe-top backdrop-blur-sm",
        isAdmin 
          ? "bg-gray-900/95 border-b border-red-800/50" 
          : "bg-background/95 border-b border-border/50",
        isScrolled && "shadow-md",
        isHidden && "-translate-y-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className={cn(
                "p-2 -ml-2 rounded-xl transition-all active:scale-95 touch-target",
                isAdmin ? "hover:bg-gray-800" : "hover:bg-accent/80"
              )}
              aria-label="Go back"
            >
              <ArrowLeft className={cn("w-5 h-5", isAdmin && "text-gray-300")} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className={cn(
              "text-lg font-bold truncate",
              isAdmin ? "text-white" : ""
            )}>
              {title}
            </h1>
            {isAdmin && (
              <Badge className="bg-red-600 text-white border-red-700 text-[10px] gap-0.5 px-1.5 py-0">
                <Crown className="w-2.5 h-2.5" />
                Admin
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className={cn(
                "p-2.5 rounded-xl transition-all active:scale-95 touch-target",
                isAdmin ? "hover:bg-gray-800 text-gray-400" : "hover:bg-accent/80"
              )}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          
          <MobileDrawer 
            activeTab={activeTab}
            onTabChange={onTabChange}
            notificationCount={notificationCount}
          />
        </div>
      </div>
    </header>
  );
}
