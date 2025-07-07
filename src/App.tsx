
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorProvider } from "@/contexts/ErrorContext";
import AuthGuard from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthPage from "@/components/AuthPage";
import Index from "@/pages/Index";
import { useError } from "@/contexts/ErrorContext";

const queryClient = new QueryClient();

// Component to handle global error logging
const AppWithErrorHandling = () => {
  const { logError } = useError();

  return (
    <ErrorBoundary onError={(error, errorInfo) => logError(error, 'AppErrorBoundary')}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/auth" 
            element={
              <AuthGuard requireAuth={false}>
                <AuthPage />
              </AuthGuard>
            } 
          />
          <Route 
            path="/" 
            element={
              <AuthGuard requireAuth={true}>
                <Index />
              </AuthGuard>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <AuthProvider>
          <AppWithErrorHandling />
          <Toaster />
        </AuthProvider>
      </ErrorProvider>
    </QueryClientProvider>
  );
}

export default App;
