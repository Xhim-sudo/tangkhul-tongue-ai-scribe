
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
  Bell
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { user, userProfile, hasRole, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigationItems = [
    {
      id: 'translate',
      label: 'Translate',
      icon: MessageSquare,
      roles: ['admin', 'expert', 'reviewer', 'contributor']
    },
    {
      id: 'training',
      label: 'Contribute',
      icon: Database,
      roles: ['admin', 'expert', 'reviewer', 'contributor']
    },
    {
      id: 'contributor',
      label: 'My Stats',
      icon: User,
      roles: ['admin', 'expert', 'reviewer', 'contributor']
    },
    {
      id: 'accuracy',
      label: 'Accuracy Check',
      icon: BarChart3,
      roles: ['admin', 'expert', 'reviewer', 'contributor']
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      roles: ['admin', 'expert', 'reviewer', 'contributor']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      roles: ['admin', 'expert', 'reviewer']
    },
    {
      id: 'review',
      label: 'Review',
      icon: CheckSquare,
      roles: ['admin', 'expert', 'reviewer']
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Shield,
      roles: ['admin', 'expert', 'reviewer']
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      roles: ['admin']
    },
    {
      id: 'management',
      label: 'Old Management',
      icon: Shield,
      roles: ['admin']
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Tangkhul AI</h1>
                <p className="text-xs text-gray-600">Translation Platform</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList className="bg-orange-50 border-orange-200">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTabChange('notifications')}
              className="relative text-gray-600 hover:text-gray-900"
            >
              <Bell className="w-5 h-5" />
            </Button>

            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                    {userProfile?.role || 'contributor'}
                  </Badge>
                  {userProfile?.staff_id && (
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                      ID: {userProfile.staff_id}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:ml-2 sm:inline">Sign Out</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-orange-200 py-4">
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
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-orange-100 text-orange-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            
            {/* Mobile user info */}
            <div className="mt-4 pt-4 border-t border-orange-200">
              <div className="px-4">
                <p className="font-medium text-gray-900">
                  {userProfile?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                    {userProfile?.role || 'contributor'}
                  </Badge>
                  {userProfile?.staff_id && (
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
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
