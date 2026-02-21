
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  User, 
  Shield, 
  Database, 
  MessageSquare, 
  BarChart3,
  TrendingUp,
  Trophy,
  CheckSquare,
  Menu,
  X,
  Bell,
  PieChart,
  Users,
  Crown
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { user, userProfile, hasRole, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = hasRole('admin');
  const isReviewer = hasRole('reviewer') || hasRole('expert');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      // Sign out failed silently
    }
  };

  // User-facing navigation items
  const userItems = [
    { id: 'translate', label: 'Translate', icon: MessageSquare },
    { id: 'training', label: 'Contribute', icon: Database },
    { id: 'contributor', label: 'My Stats', icon: User },
    { id: 'accuracy', label: 'Accuracy', icon: BarChart3 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  // Reviewer/expert items
  const reviewerItems = [
    { id: 'review', label: 'Review', icon: CheckSquare },
    { id: 'collaborate', label: 'Collaborate', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'charts', label: 'Charts', icon: PieChart },
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
  ];

  // Admin items
  const adminItems = [
    { id: 'admin', label: 'Admin Panel', icon: Shield },
  ];

  const visibleItems = [
    ...userItems,
    ...(isReviewer || isAdmin ? reviewerItems : []),
    ...(isAdmin ? adminItems : []),
  ];

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
    return <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">Contributor</Badge>;
  };

  return (
    <nav className={cn(
      "backdrop-blur-sm border-b sticky top-0 z-50",
      isAdmin 
        ? "bg-gray-900/95 border-red-800/50" 
        : "bg-white/80 border-orange-200"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isAdmin 
                  ? "bg-gradient-to-br from-red-600 to-red-800" 
                  : "bg-gradient-to-br from-orange-500 to-red-600"
              )}>
                {isAdmin ? (
                  <Crown className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-white font-bold text-sm">T</span>
                )}
              </div>
              <div>
                <h1 className={cn(
                  "text-lg font-bold",
                  isAdmin ? "text-white" : "text-gray-900"
                )}>
                  Tangkhul AI
                </h1>
                <p className={cn(
                  "text-xs",
                  isAdmin ? "text-red-300" : "text-gray-600"
                )}>
                  {isAdmin ? "Admin Console" : "Translation Platform"}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList className={cn(
                isAdmin 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-orange-50 border-orange-200"
              )}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        isAdmin 
                          ? "data-[state=active]:bg-red-900/50 data-[state=active]:text-red-300 text-gray-400 hover:text-gray-200"
                          : "data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTabChange('notifications')}
              className={cn(
                "relative",
                isAdmin ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Bell className="w-5 h-5" />
            </Button>

            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className={cn(
                  "text-sm font-medium",
                  isAdmin ? "text-white" : "text-gray-900"
                )}>
                  {userProfile?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-2">
                  {getRoleBadge()}
                  {userProfile?.staff_id && (
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      isAdmin ? "border-gray-600 text-gray-400" : "border-blue-200 text-blue-700"
                    )}>
                      ID: {userProfile.staff_id}
                    </Badge>
                  )}
                </div>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center ring-2",
                isAdmin 
                  ? "bg-gradient-to-br from-red-600 to-red-800 ring-red-500/50" 
                  : "bg-gradient-to-br from-orange-500 to-red-600 ring-transparent"
              )}>
                {isAdmin ? <Crown className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className={cn(
                isAdmin ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:ml-2 sm:inline">Sign Out</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "md:hidden",
                isAdmin ? "text-gray-400" : ""
              )}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={cn(
            "md:hidden border-t py-4",
            isAdmin ? "border-gray-700" : "border-orange-200"
          )}>
            <div className="space-y-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg transition-colors",
                      activeTab === item.id
                        ? isAdmin ? "bg-red-900/50 text-red-300" : "bg-orange-100 text-orange-800"
                        : isAdmin ? "text-gray-400 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            
            <div className={cn(
              "mt-4 pt-4 border-t",
              isAdmin ? "border-gray-700" : "border-orange-200"
            )}>
              <div className="px-4">
                <p className={cn(
                  "font-medium",
                  isAdmin ? "text-white" : "text-gray-900"
                )}>
                  {userProfile?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge()}
                  {userProfile?.staff_id && (
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      isAdmin ? "border-gray-600 text-gray-400" : "border-blue-200 text-blue-700"
                    )}>
                      ID: {userProfile.staff_id}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
