import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, FolderTree, TrendingUp, Download, 
  UserCheck, UserX, Edit, Trash2, Plus, Upload 
} from "lucide-react";
import CSVImport from './CSVImport';
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

      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Load categories
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

  const exportData = async (type: 'users' | 'categories' | 'translations') => {
    try {
      let data;
      let filename;

      switch (type) {
        case 'users':
          data = users;
          filename = 'users-export.json';
          break;
        case 'categories':
          data = categories;
          filename = 'categories-export.json';
          break;
        case 'translations':
          const { data: translations } = await supabase
            .from('training_entries')
            .select('*');
          data = translations;
          filename = 'translations-export.json';
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold text-gradient-primary">Admin Control Panel</h2>
        <p className="text-muted-foreground mt-1">Manage users, categories, and system settings</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-0 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Users</p>
                <h3 className="text-3xl font-bold mt-1">{users.length}</h3>
              </div>
              <Users className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent to-accent-dark text-accent-foreground border-0 shadow-cyan-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Categories</p>
                <h3 className="text-3xl font-bold mt-1">{categories.length}</h3>
              </div>
              <FolderTree className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success to-success-dark text-success-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Contributors</p>
                <h3 className="text-3xl font-bold mt-1">
                  {users.filter(u => u.role === 'contributor').length}
                </h3>
              </div>
              <UserCheck className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="exports">Export</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-surface-dark transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {user.full_name || 'Anonymous'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      {user.staff_id && (
                        <p className="text-xs text-muted-foreground mt-1">ID: {user.staff_id}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contributor">Contributor</SelectItem>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
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
              <div className="flex items-center justify-between">
                <CardTitle>Category Management</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary-dark">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                    className="flex items-start justify-between p-4 rounded-lg border border-border bg-surface hover:bg-surface-dark transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
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

        {/* Data Export Tab */}
        <TabsContent value="exports" className="space-y-4">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => exportData('users')}
                  variant="outline"
                  className="h-24 flex-col border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Download className="w-8 h-8 mb-2" />
                  <span>Export Users</span>
                </Button>

                <Button
                  onClick={() => exportData('categories')}
                  variant="outline"
                  className="h-24 flex-col border-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="w-8 h-8 mb-2" />
                  <span>Export Categories</span>
                </Button>

                <Button
                  onClick={() => exportData('translations')}
                  variant="outline"
                  className="h-24 flex-col border-success hover:bg-success hover:text-success-foreground"
                >
                  <Download className="w-8 h-8 mb-2" />
                  <span>Export Translations</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
