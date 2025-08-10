
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, CheckCircle, XCircle, Phone, Download, Award, Eye, EyeOff } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useDataExport } from '@/hooks/useDataExport';
import { useError } from '@/contexts/ErrorContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SystemOverview from './SystemOverview';
import CategoryManagement from './CategoryManagement';
import TrainingDataManagement from './TrainingDataManagement';
import EnhancedUserManagement from './EnhancedUserManagement';

const ManagementPortal = () => {
  const { hasRole, userProfile } = useAuth();
  const { sendApprovalNotification } = useWhatsApp();
  const { exportGoldenData, isExporting } = useDataExport();
  const { logError } = useError();
  const [managementPassword, setManagementPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalContributors: 0,
    goldenDataCount: 0,
    overallAccuracy: 0,
    readyForAI: false
  });

  // Check if user has management access
  useEffect(() => {
    if (!hasRole('admin')) {
      logError(
        new Error('Access denied: User does not have admin role'),
        'ManagementPortal'
      );
      return;
    }
  }, [hasRole, logError]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadPendingApprovals();
      loadAccuracyMetrics();
      loadSystemStats();
    }
  }, [isAuthenticated]);

  const authenticateManagement = async () => {
    if (!managementPassword.trim()) {
      toast({
        title: "Password required",
        description: "Please enter the management password.",
        variant: "destructive",
      });
      return;
    }

    setIsAuthenticating(true);

    try {
      // Simple password check - in production, use proper authentication
      const isValidPassword = managementPassword === "000000";

      if (isValidPassword) {
        setIsAuthenticated(true);
        toast({
          title: "Access granted",
          description: "Welcome to the management portal",
        });
      } else {
        toast({
          title: "Invalid password",
          description: "Please check the management password.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      logError(error, 'ManagementPortal.authenticateManagement');
      toast({
        title: "Authentication failed",
        description: "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_approvals')
        .select(`
          *,
          profiles:user_id(full_name, email, staff_id)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error: any) {
      logError(error, 'ManagementPortal.loadPendingApprovals');
    }
  };

  const loadAccuracyMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('accuracy_metrics')
        .select(`
          *,
          profiles:contributor_id(full_name, email, staff_id)
        `)
        .order('accuracy_percentage', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAccuracyMetrics(data || []);
    } catch (error: any) {
      logError(error, 'ManagementPortal.loadAccuracyMetrics');
    }
  };

  const loadSystemStats = async () => {
    try {
      const { data: contributors } = await supabase
        .from('profiles')
        .select('id');

      const { data: goldenData } = await supabase
        .from('contributor_datasets')
        .select('id')
        .eq('is_golden_data', true);

      const { data: accuracyData } = await supabase
        .from('accuracy_metrics')
        .select('accuracy_percentage');

      const averageAccuracy = accuracyData?.length 
        ? accuracyData.reduce((sum: number, metric: any) => sum + parseFloat(metric.accuracy_percentage), 0) / accuracyData.length
        : 0;

      setSystemStats({
        totalContributors: contributors?.length || 0,
        goldenDataCount: goldenData?.length || 0,
        overallAccuracy: Math.round(averageAccuracy * 100) / 100,
        readyForAI: averageAccuracy >= 99
      });
    } catch (error: any) {
      logError(error, 'ManagementPortal.loadSystemStats');
    }
  };

  const approveUser = async (approvalId: string, userId: string, phoneNumber: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('user_approvals')
        .update({
          status: approve ? 'approved' : 'rejected',
          approved_by: userProfile?.id,
          approved_at: new Date().toISOString(),
          approval_notes: approve ? 'Approved by admin' : 'Rejected by admin'
        })
        .eq('id', approvalId);

      if (error) throw error;

      // Send WhatsApp notification
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      await sendApprovalNotification(phoneNumber, userData?.full_name || 'User', approve);

      toast({
        title: approve ? "User approved" : "User rejected",
        description: `WhatsApp notification sent to ${phoneNumber}`,
      });

      loadPendingApprovals();
    } catch (error: any) {
      logError(error, 'ManagementPortal.approveUser');
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markGoldenData = async () => {
    try {
      const { data, error } = await supabase.rpc('mark_golden_data');
      
      if (error) throw error;
      
      toast({
        title: "Golden data updated",
        description: `${data} new entries marked as golden data`,
      });

      loadSystemStats();
    } catch (error: any) {
      logError(error, 'ManagementPortal.markGoldenData');
      toast({
        title: "Failed to update golden data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96 bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-600">You don't have permission to access the management portal.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96 bg-white/70 backdrop-blur-sm border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Lock className="w-5 h-5" />
              Management Portal Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter management password"
                value={managementPassword}
                onChange={(e) => setManagementPassword(e.target.value)}
                className="border-orange-200 focus:border-orange-400 pr-10"
                onKeyPress={(e) => e.key === 'Enter' && !isAuthenticating && authenticateManagement()}
                disabled={isAuthenticating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button 
              onClick={authenticateManagement}
              disabled={isAuthenticating}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <SystemOverview systemStats={systemStats} />

      {/* Category Management */}
      <CategoryManagement />

      {/* Invitations & User Management */}
      <EnhancedUserManagement />

      {/* Management Actions */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => exportGoldenData('json')}
              disabled={isExporting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Golden Dataset'}
            </Button>
            <Button 
              onClick={markGoldenData}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Golden Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending User Approvals */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Pending User Approvals ({pendingApprovals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="border border-orange-200 rounded-lg p-4 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{approval.profiles?.full_name || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-600">{approval.profiles?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{approval.phone_number}</span>
                        {approval.profiles?.staff_id && (
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            ID: {approval.profiles.staff_id}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          Pending Approval
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Applied: {new Date(approval.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => approveUser(approval.id, approval.user_id, approval.phone_number, true)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => approveUser(approval.id, approval.user_id, approval.phone_number, false)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Award className="w-5 h-5" />
            Top Contributors by Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accuracyMetrics.map((metric, index) => (
              <div key={metric.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{metric.profiles?.full_name || 'Anonymous'}</span>
                    <Badge className={
                      metric.accuracy_percentage >= 95 ? "bg-green-100 text-green-800" :
                      metric.accuracy_percentage >= 90 ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }>
                      {metric.accuracy_percentage}% accuracy
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{metric.total_contributions} contributions</span>
                    <span>{metric.golden_data_count} golden entries</span>
                    {metric.profiles?.staff_id && (
                      <span>ID: {metric.profiles.staff_id}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementPortal;
