import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, 
  Trophy, 
  BarChart3, 
  TrendingUp, 
  PieChart,
  CheckSquare, 
  Users, 
  Shield, 
  Settings,
  LogOut,
  User,
  Bell,
  Download,
  Crown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MobileDrawerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
}

export default function MobileDrawer({ activeTab, onTabChange, notificationCount = 0 }: MobileDrawerProps) {
  const { userProfile, hasRole, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = hasRole('admin');

  const secondaryItems = [
    { id: "leaderboard", icon: Trophy, label: "Leaderboard", roles: ['admin', 'expert', 'reviewer', 'contributor'], badge: 0 },
    { id: "accuracy", icon: BarChart3, label: "Accuracy Check", roles: ['admin', 'expert', 'reviewer', 'contributor'], badge: 0 },
    { id: "notifications", icon: Bell, label: "Notifications", roles: ['admin', 'expert', 'reviewer', 'contributor'], badge: notificationCount },
  ];

  const reviewerItems = [
    { id: "review", icon: CheckSquare, label: "Review Submissions", roles: ['admin', 'expert', 'reviewer'], badge: 0 },
    { id: "collaborate", icon: Users, label: "Collaborative Review", roles: ['admin', 'expert', 'reviewer'], badge: 0 },
    { id: "analytics", icon: TrendingUp, label: "Analytics", roles: ['admin', 'expert', 'reviewer'], badge: 0 },
    { id: "charts", icon: PieChart, label: "Detailed Charts", roles: ['admin', 'expert', 'reviewer'], badge: 0 },
    { id: "dashboard", icon: Shield, label: "Dashboard", roles: ['admin', 'expert', 'reviewer'], badge: 0 },
  ];

  const adminItems = [
    { id: "admin", icon: Shield, label: "Admin Panel", roles: ['admin'], badge: 0 },
    { id: "management", icon: Settings, label: "Management", roles: ['admin'], badge: 0 },
  ];

  const utilityItems = [
    { id: "install", icon: Download, label: "Install App", roles: ['admin', 'expert', 'reviewer', 'contributor'], badge: 0 },
  ];

  const filterByRole = (items: typeof secondaryItems) => 
    items.filter(item => item.roles.some(role => hasRole(role)));

  const handleItemClick = (id: string) => {
    if (id === 'install') {
      window.location.href = '/install';
    } else {
      onTabChange(id);
    }
    setOpen(false);
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <Badge className="bg-red-600 text-white border-red-700 text-xs gap-1">
          <Crown className="w-3 h-3" />
          Admin
        </Badge>
      );
    }
    if (hasRole('expert')) {
      return <Badge className="bg-purple-600 text-white border-purple-700 text-xs">Expert</Badge>;
    }
    if (hasRole('reviewer')) {
      return <Badge className="bg-blue-600 text-white border-blue-700 text-xs">Reviewer</Badge>;
    }
    return <Badge variant="secondary" className="text-xs capitalize">Contributor</Badge>;
  };

  const NavItem = ({ item, isActive }: { item: typeof secondaryItems[0], isActive: boolean }) => {
    const Icon = item.icon;
    return (
      <button
        onClick={() => handleItemClick(item.id)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
          "active:scale-[0.98]",
          isActive 
            ? isAdmin ? "bg-red-900/30 text-red-400" : "bg-primary/10 text-primary"
            : isAdmin ? "text-gray-300 hover:bg-gray-800" : "text-foreground hover:bg-accent"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </div>
        {item.badge > 0 && (
          <Badge variant="destructive" className="text-xs">
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(
          "relative",
          isAdmin && "text-gray-400 hover:text-white"
        )}>
          <Menu className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className={cn(
        "w-[300px] p-0",
        isAdmin && "bg-gray-900 border-gray-700"
      )}>
        <SheetHeader className={cn(
          "p-6 pb-4 border-b",
          isAdmin ? "border-gray-700" : "border-border"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center ring-2",
              isAdmin 
                ? "bg-gradient-to-br from-red-600 to-red-800 ring-red-500/50" 
                : "bg-gradient-to-br from-primary to-primary/70 ring-transparent"
            )}>
              {isAdmin ? (
                <Crown className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <div className="text-left">
              <SheetTitle className={cn(
                "text-base",
                isAdmin && "text-white"
              )}>
                {userProfile?.full_name || 'User'}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                {getRoleBadge()}
                {userProfile?.staff_id && (
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    isAdmin ? "border-gray-600 text-gray-400" : ""
                  )}>
                    {userProfile.staff_id}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Secondary Navigation */}
          <div className="space-y-1">
            <p className={cn(
              "px-4 text-xs font-semibold uppercase tracking-wider mb-2",
              isAdmin ? "text-gray-500" : "text-muted-foreground"
            )}>
              Quick Access
            </p>
            {filterByRole(secondaryItems).map(item => (
              <NavItem key={item.id} item={item} isActive={activeTab === item.id} />
            ))}
          </div>

          {/* Reviewer Tools */}
          {filterByRole(reviewerItems).length > 0 && (
            <>
              <Separator className={isAdmin ? "bg-gray-700" : ""} />
              <div className="space-y-1">
                <p className={cn(
                  "px-4 text-xs font-semibold uppercase tracking-wider mb-2",
                  isAdmin ? "text-gray-500" : "text-muted-foreground"
                )}>
                  Reviewer Tools
                </p>
                {filterByRole(reviewerItems).map(item => (
                  <NavItem key={item.id} item={item} isActive={activeTab === item.id} />
                ))}
              </div>
            </>
          )}

          {/* Admin Tools */}
          {filterByRole(adminItems).length > 0 && (
            <>
              <Separator className={isAdmin ? "bg-gray-700" : ""} />
              <div className="space-y-1">
                <p className={cn(
                  "px-4 text-xs font-semibold uppercase tracking-wider mb-2",
                  isAdmin ? "text-red-400/70" : "text-muted-foreground"
                )}>
                  Administration
                </p>
                {filterByRole(adminItems).map(item => (
                  <NavItem key={item.id} item={item} isActive={activeTab === item.id} />
                ))}
              </div>
            </>
          )}

          {/* Utility */}
          <Separator className={isAdmin ? "bg-gray-700" : ""} />
          <div className="space-y-1">
            {filterByRole(utilityItems).map(item => (
              <NavItem key={item.id} item={item} isActive={activeTab === item.id} />
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 border-t",
          isAdmin ? "border-gray-700 bg-gray-900" : "border-border bg-background"
        )}>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
