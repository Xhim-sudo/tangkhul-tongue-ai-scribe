
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, BarChart3, Settings, Globe } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import TranslationInterface from '../components/TranslationInterface';
import KnowledgeLogger from '../components/KnowledgeLogger';
import TrainingDashboard from '../components/TrainingDashboard';
import UserManagement from '../components/UserManagement';
import UserProfile from '../components/UserProfile';

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("translate");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Tangkhul AI Translator
                </h1>
                <p className="text-sm text-gray-600">English ↔ Tangkhul Language Bridge</p>
              </div>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="translate" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Translate
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Knowledge Log
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="translate" className="space-y-6">
            <TranslationInterface />
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <KnowledgeLogger />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <TrainingDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-orange-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 Tangkhul AI Translation Project</p>
            <p>Preserving and promoting Tangkhul language through AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
