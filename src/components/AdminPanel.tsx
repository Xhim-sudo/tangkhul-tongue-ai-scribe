import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, FolderTree, Download, 
  UserCheck, Plus, Trash2, Activity, LayoutDashboard,
  Shield, CheckCircle, XCircle, Award, CheckSquare, Mail
} from "lucide-react";
import ReviewerWorkflow from './ReviewerWorkflow';
import CSVImport from './CSVImport';
import AdminDashboard from './admin/AdminDashboard';
import AdvancedExport from './admin/AdvancedExport';
import LiveActivityPanel from './admin/LiveActivityPanel';
import SystemOverview from './SystemOverview';
import CategoryManagement from './CategoryManagement';
import EnhancedUserManagement from './EnhancedUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useDataExport } from '@/hooks/useDataExport';
import { useError } from '@/contexts/ErrorContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AdminPanel = () => {
  const { hasRole, userProfile } = useAuth();
  const { sendApprovalNotification } = useWhatsApp();
  const { exportGoldenData, isExporting } = useDataExport();
  const { logError } = useError();

  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalContributors: 0,
    goldenDataCount: 0,
    overallAccuracy: 0,
    readyForAI: false
  });

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  // Access check - after all hooks
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96 border-destructive/50">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadData = async () => {
    try {
      setLoading(true);

      const [usersRes, categoriesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('training_categories').select('*').order('created_at', { ascending: false }),
      ]);

      setUsers(usersRes.data || []);
      setCategories(categoriesRes.data || []);

      // Load management data in parallel
      loadPendingApprovals();
      loadAccuracyMetrics();
      loadSystemStats();
    } catch (error) {
      logError(error as Error, 'AdminPanel.loadData');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_approvals')
        .select(`*, profiles:user_id(full_name, email, staff_id)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error: any) {
      logError(error, 'AdminPanel.loadPendingApprovals');
    }
  };

  const loadAccuracyMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('accuracy_metrics')
        .select(`*, profiles:contributor_id(full_name, email, staff_id)`)
        .order('score', { ascending: false })
        .limit(10);
      if (error) throw error;
      setAccuracyMetrics(data || []);
    } catch (error: any) {
      logError(error, 'AdminPanel.loadAccuracyMetrics');
    }
  };

  const loadSystemStats = async () => {
    try {
      const [contributors, goldenData, accuracyData] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('training_entries').select('id').eq('is_golden_data', true),
        supabase.from('accuracy_metrics').select('score'),
      ]);

      const avgAccuracy = accuracyData.data?.length
        ? accuracyData.data.reduce((sum, m) => sum + (m.score || 0), 0) / accuracyData.data.length
        : 0;

      setSystemStats({
        totalContributors: contributors.data?.length || 0,
        goldenDataCount: goldenData.data?.length || 0,
        overallAccuracy: Math.round(avgAccuracy * 100),
        readyForAI: avgAccuracy >= 0.99,
      });
    } catch (error: any) {
      logError(error, 'AdminPanel.loadSystemStats');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as 'admin' | 'expert' | 'reviewer' | 'contributor' })
        .eq('id', userId);
      if (error) throw error;
      toast({ title: "Role updated", description: "User role updated successfully." });
      loadData();
    } catch (error) {
      toast({ title: "Failed", description: "Failed to update user role.", variant: "destructive" });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast({ title: "Required", description: "Category name is required.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from('training_categories')
        .insert({ name: newCategory.name, description: newCategory.description });
      if (error) throw error;
      toast({ title: "Created", description: "Category created successfully." });
      setNewCategory({ name: '', description: '' });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: "Failed", description: "Failed to create category.", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const { error } = await supabase.from('training_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Category deleted." });
      loadData();
    } catch (error) {
      toast({ title: "Failed", description: "Failed to delete category.", variant: "destructive" });
    }
  };

  const approveUser = async (approvalId: string, userId: string, approve: boolean) => {
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

      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, email, phone_number')
        .eq('id', userId)
        .maybeSingle();

      // Send WhatsApp notification if phone number available
      if (userData?.phone_number) {
        await sendApprovalNotification(userData.phone_number, userData?.full_name || 'User', approve);
      }

      toast({
        title: approve ? "User approved" : "User rejected",
        description: `Status updated for ${userData?.email || 'user'}`,
      });
      loadPendingApprovals();
    } catch (error: any) {
      logError(error, 'AdminPanel.approveUser');
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  const markGoldenData = async () => {
    try {
      const { data, error } = await supabase.rpc('mark_golden_data');
      if (error) throw error;
      toast({ title: "Golden data updated", description: `${data} new entries marked as golden data` });
      loadSystemStats();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:p-6">
      <div>
        <h2 className="text-xl sm:text-3xl font-bold text-gradient-primary">Admin Control Panel</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage users, categories, approvals, and system settings</p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1 h-auto p-1">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm py-2">
            <LayoutDashboard className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
            <Shield className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-2">
            <Users className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm py-2">
            <FolderTree className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs sm:text-sm py-2">
            <UserCheck className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Approvals</span>
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs h-5 w-5 p-0 flex items-center justify-center">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="import" className="text-xs sm:text-sm py-2">
            <Plus className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Import</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="text-xs sm:text-sm py-2">
            <Download className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="text-xs sm:text-sm py-2">
            <Activity className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Live</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2">
            <CheckSquare className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        {/* System Overview Tab (from ManagementPortal) */}
        <TabsContent value="overview" className="space-y-4">
          <SystemOverview systemStats={systemStats} />
          
          {/* Quick Actions */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => exportGoldenData('json')}
                  disabled={isExporting}
                  variant="default"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Golden Dataset'}
                </Button>
                <Button onClick={markGoldenData} variant="secondary">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Golden Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Top Contributors */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="w-5 h-5" />
                Top Contributors by Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accuracyMetrics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No accuracy data yet</p>
                ) : (
                  accuracyMetrics.map((metric, index) => (
                    <div key={metric.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{metric.profiles?.full_name || 'Anonymous'}</span>
                          <Badge variant={
                            (metric.score || 0) >= 0.95 ? "default" :
                            (metric.score || 0) >= 0.90 ? "secondary" : "outline"
                          }>
                            {Math.round((metric.score || 0) * 100)}% accuracy
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{metric.metric_type || 'accuracy'}</span>
                          {metric.profiles?.staff_id && <span>ID: {metric.profiles.staff_id}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <EnhancedUserManagement />
          
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                        {user.full_name || 'Anonymous'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                      {user.staff_id && (
                        <p className="text-xs text-muted-foreground mt-1">ID: {user.staff_id}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-[120px] sm:w-[140px] text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contributor">Contributor</SelectItem>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement />

          <Card className="glass border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5" />
                  All Categories ({categories.length})
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="mx-4 sm:mx-0">
                    <DialogHeader>
                      <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Category Name</Label>
                        <Input
                          id="name"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="Enter category name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          placeholder="Enter category description (optional)"
                        />
                      </div>
                      <Button onClick={handleCreateCategory} className="w-full">
                        Create Category
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-start justify-between p-3 sm:p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">{category.name}</h3>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab (from ManagementPortal) */}
        <TabsContent value="approvals" className="space-y-4">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-foreground">Pending User Approvals ({pendingApprovals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{approval.profiles?.full_name || 'Unknown User'}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{approval.profiles?.email}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {approval.profiles?.staff_id && (
                              <Badge variant="outline" className="text-xs">
                                ID: {approval.profiles.staff_id}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied: {new Date(approval.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveUser(approval.id, approval.user_id, true)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => approveUser(approval.id, approval.user_id, false)}
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
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <CSVImport />
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="exports" className="space-y-4">
          <AdvancedExport />
        </TabsContent>

        {/* Live Activity Tab */}
        <TabsContent value="live" className="space-y-4">
          <LiveActivityPanel />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <ReviewerWorkflow />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
