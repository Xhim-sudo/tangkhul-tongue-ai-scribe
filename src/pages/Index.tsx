
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import TranslationInterface from "@/components/TranslationInterface";
import TrainingDashboard from "@/components/TrainingDashboard";
import AccuracyDashboard from "@/components/AccuracyDashboard";
import EnhancedUserManagement from "@/components/EnhancedUserManagement";
import ManagementPortal from "@/components/ManagementPortal";
import { useError } from "@/contexts/ErrorContext";

const Index = () => {
  const { hasRole } = useAuth();
  const { logError } = useError();
  const [activeTab, setActiveTab] = useState("translate");

  const renderContent = () => {
    const content = (() => {
      switch (activeTab) {
        case "translate":
          return <TranslationInterface />;
        case "training":
          return <TrainingDashboard />;
        case "accuracy":
          return hasRole('admin') || hasRole('expert') || hasRole('reviewer') ? 
            <AccuracyDashboard /> : <div>Access denied</div>;
        case "users":
          return hasRole('admin') ? 
            <EnhancedUserManagement /> : <div>Access denied</div>;
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
