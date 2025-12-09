import { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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

      // Hide on scroll down, show on scroll up
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
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 safe-top bg-background/95 backdrop-blur-sm",
        isScrolled && "shadow-md",
        isHidden && "-translate-y-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
        <div className="flex items-center gap-3 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-accent/80 rounded-xl transition-all active:scale-95 touch-target"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-bold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="p-2.5 hover:bg-accent/80 rounded-xl transition-all active:scale-95 touch-target"
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
