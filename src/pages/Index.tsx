import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import TranslationInterface from "@/components/TranslationInterface";
import KnowledgeLogger from "@/components/KnowledgeLogger";
import AccuracyDashboard from "@/components/AccuracyDashboard";
import ContributorDashboard from "@/components/ContributorDashboard";
import AccuracyChecker from "@/components/AccuracyChecker";
import TranslationAnalytics from "@/components/TranslationAnalytics";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import Leaderboard from "@/components/Leaderboard";
import ReviewerWorkflow from "@/components/ReviewerWorkflow";
import CollaborativeReview from "@/components/CollaborativeReview";
import AdminPanel from "@/components/AdminPanel";
import ProfilePage from "@/components/ProfilePage";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useError } from "@/contexts/ErrorContext";
import { useIsMobileView } from "@/lib/breakpoints";
import BottomNav from "@/components/mobile/BottomNav";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileRouter from "@/components/mobile/MobileRouter";
import MobileSearchDrawer from "@/components/mobile/MobileSearchDrawer";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { hasRole, user } = useAuth();
  const { logError } = useError();
  const isAdmin = hasRole('admin');
  const [activeTab, setActiveTab] = useState(isAdmin ? "dashboard" : "translate");
  const [showSearch, setShowSearch] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const isMobile = useIsMobileView();

  // Load unread notification count
  useEffect(() => {
    if (user?.id) {
      loadNotificationCount();
      
      const channel = supabase
        .channel('notification-count')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `to_user_id=eq.${user.id}`
        }, () => {
          loadNotificationCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const loadNotificationCount = async () => {
    if (!user?.id) return;
    
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', user.id)
      .eq('read', false);
    
    setNotificationCount(count || 0);
  };

  const renderContent = () => {
    const content = (() => {
      switch (activeTab) {
        case "translate":
          return <TranslationInterface />;
        case "training":
          return <KnowledgeLogger />;
        case "contributor":
          return <ContributorDashboard />;
        case "accuracy":
          return <AccuracyChecker />;
        case "leaderboard":
          return <Leaderboard />;
        case "profile":
          return <ProfilePage />;
        case "notifications":
          return <NotificationsPanel />;
        case "analytics":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <TranslationAnalytics /> : <div className="p-4 text-center">Access denied</div>;
        case "charts":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <AnalyticsCharts /> : <div className="p-4 text-center">Access denied</div>;
        case "review":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <ReviewerWorkflow /> : <div className="p-4 text-center">Access denied</div>;
        case "collaborate":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <CollaborativeReview /> : <div className="p-4 text-center">Access denied</div>;
        case "dashboard":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <AccuracyDashboard /> : <div className="p-4 text-center">Access denied</div>;
        case "admin":
          return hasRole('admin') ? 
            <AdminPanel /> : <div className="p-4 text-center">Access denied</div>;
        default:
          return <TranslationInterface />;
      }
    })();

    return (
      <ErrorBoundary 
        onError={(error, errorInfo) => logError(error, `Index.${activeTab}`)}
        key={activeTab}
      >
        {content}
      </ErrorBoundary>
    );
  };

  // Mobile layout
  if (isMobile) {
    const getHeaderTitle = () => {
      switch (activeTab) {
        case "translate": return "Translate";
        case "training": return "Contribute";
        case "contributor": return "My Stats";
        case "accuracy": return "Accuracy Check";
        case "leaderboard": return "Leaderboard";
        case "profile": return "Profile";
        case "notifications": return "Notifications";
        case "analytics": return "Analytics";
        case "charts": return "Detailed Charts";
        case "review": return "Review Submissions";
        case "collaborate": return "Collaborative Review";
        case "dashboard": return "Dashboard";
        case "admin": return "Admin Panel";
        default: return "Tangkhul Translator";
      }
    };

    return (
      <div className={cn("min-h-screen", isAdmin ? "bg-gray-950" : "bg-background")}>
        <MobileHeader 
          title={getHeaderTitle()} 
          showSearch 
          onSearchClick={() => setShowSearch(true)}
          notificationCount={notificationCount}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <MobileRouter activeTab={activeTab}>
          {renderContent()}
        </MobileRouter>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        <MobileSearchDrawer 
          isOpen={showSearch} 
          onClose={() => setShowSearch(false)} 
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={cn(
      "min-h-screen",
      isAdmin 
        ? "bg-gray-950" 
        : "bg-gradient-to-br from-orange-50 to-red-50 dark:from-background dark:to-background"
    )}>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;