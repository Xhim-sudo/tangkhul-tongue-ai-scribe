import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, FolderTree, Download, 
  UserCheck, Plus, Trash2, Activity, LayoutDashboard 
} from "lucide-react";
import CSVImport from './CSVImport';
import AdminDashboard from './admin/AdminDashboard';
import AdvancedExport from './admin/AdvancedExport';
import LiveActivityPanel from './admin/LiveActivityPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: categoriesData } = await supabase
        .from('training_categories')
        .select('*')
        .order('created_at', { ascending: false });

      setUsers(usersData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as 'admin' | 'expert' | 'reviewer' | 'contributor' })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User role updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('training_categories')
        .insert({
          name: newCategory.name,
          description: newCategory.description
        });

      if (error) throw error;

      toast.success('Category created successfully');
      setNewCategory({ name: '', description: '' });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('training_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Category deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
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
        <p className="text-sm text-muted-foreground mt-1">Manage users, categories, and system settings</p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm py-2">
            <LayoutDashboard className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-2">
            <Users className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm py-2">
            <FolderTree className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Categories</span>
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
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border bg-surface hover:bg-surface-dark transition-colors"
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

                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'outline'}
                        className="text-xs"
                      >
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
          <Card className="glass border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5" />
                  Categories ({categories.length})
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary-dark w-full sm:w-auto">
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
                    className="flex items-start justify-between p-3 sm:p-4 rounded-lg border border-border bg-surface hover:bg-surface-dark transition-colors"
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
      </Tabs>
    </div>
  );
};

export default AdminPanel;
