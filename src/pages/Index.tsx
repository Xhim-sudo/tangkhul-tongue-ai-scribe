import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import TranslationInterface from "@/components/TranslationInterface";
import KnowledgeLogger from "@/components/KnowledgeLogger";
import AccuracyDashboard from "@/components/AccuracyDashboard";
import ManagementPortal from "@/components/ManagementPortal";
import ContributorDashboard from "@/components/ContributorDashboard";
import AccuracyChecker from "@/components/AccuracyChecker";
import TranslationAnalytics from "@/components/TranslationAnalytics";
import Leaderboard from "@/components/Leaderboard";
import ReviewerWorkflow from "@/components/ReviewerWorkflow";
import { useError } from "@/contexts/ErrorContext";
import { useIsMobileView } from "@/lib/breakpoints";
import BottomNav from "@/components/mobile/BottomNav";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileRouter from "@/components/mobile/MobileRouter";
import TrainingScreenMobile from "@/components/mobile/TrainingScreenMobile";
import ProfileScreenMobile from "@/components/mobile/ProfileScreenMobile";

const Index = () => {
  const { hasRole } = useAuth();
  const { logError } = useError();
  const [activeTab, setActiveTab] = useState("translate");
  const isMobile = useIsMobileView();

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
        case "analytics":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <TranslationAnalytics /> : <div>Access denied</div>;
        case "review":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <ReviewerWorkflow /> : <div>Access denied</div>;
        case "dashboard":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <AccuracyDashboard /> : <div>Access denied</div>;
        case "management":
          return hasRole('admin') ? 
            <ManagementPortal /> : <div>Access denied</div>;
        default:
          return <TranslationInterface />;
      }
    })();

    return (
      <ErrorBoundary 
        onError={(error, errorInfo) => logError(error, `Index.${activeTab}`)}
        key={activeTab} // Force remount on tab change
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
        case "analytics": return "Analytics";
        case "review": return "Review Submissions";
        case "dashboard": return "Dashboard";
        case "management": return "Management";
        default: return "Tangkhul Translator";
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title={getHeaderTitle()} showSearch />
        <MobileRouter activeTab={activeTab}>
          {renderContent()}
        </MobileRouter>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
