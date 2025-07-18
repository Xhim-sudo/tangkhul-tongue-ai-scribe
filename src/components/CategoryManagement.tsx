import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { hasRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await (supabase as any)
        .from('training_categories')
        .select('*')
        .order('name');
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const addCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await (supabase as any)
        .from('training_categories')
        .insert({
          name: newCategory.name.toLowerCase(),
          description: newCategory.description,
          is_active: true
        });

      setNewCategory({ name: '', description: '' });
      loadCategories();
      
      toast({
        title: "Success",
        description: "Category added successfully"
      });
    } catch (error) {
      console.error('Failed to add category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = async (id: string, currentStatus: boolean) => {
    try {
      await (supabase as any)
        .from('training_categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      loadCategories();
      
      toast({
        title: "Success",
        description: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Failed to toggle category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };

  if (!hasRole('admin')) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Tag className="w-5 h-5" />
            Category Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Category */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  placeholder="e.g., greetings"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of the category"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="border-orange-200 focus:border-orange-400 h-10"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={addCategory}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Existing Categories</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      category.is_active 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.name}
                      </Badge>
                      {category.description && (
                        <span className="text-xs text-gray-500">
                          {category.description}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(category.id, category.is_active)}
                      className={category.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {category.is_active ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagement;