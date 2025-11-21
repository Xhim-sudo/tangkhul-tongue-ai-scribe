import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, Mail, Phone, Calendar, Award, 
  Star, TrendingUp, Edit2, Save, X 
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: ''
  });
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    goldenData: 0,
    accuracyScore: 0
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        phone_number: userProfile.phone_number || ''
      });
      loadUserStats();
    }
  }, [userProfile]);

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      // Get total submissions
      const { count: totalSubmissions } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user.id);

      // Get golden data count
      const { count: goldenData } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user.id)
        .eq('is_golden_data', true);

      // Calculate accuracy
      const accuracyScore = totalSubmissions ? 
        Math.round((goldenData || 0) / totalSubmissions * 100) : 0;

      setStats({
        totalSubmissions: totalSubmissions || 0,
        goldenData: goldenData || 0,
        accuracyScore
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const getInitials = () => {
    if (formData.full_name) {
      return formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header with Avatar */}
      <Card className="glass border-primary/20 shadow-glow overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary via-primary-glow to-accent" />
        <CardContent className="pt-0 px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-20 md:pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground">
                    {formData.full_name || 'Anonymous User'}
                  </h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" className="bg-success hover:bg-success-dark">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      onClick={() => setIsEditing(false)} 
                      variant="outline" 
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
                  {userProfile?.role || 'contributor'}
                </Badge>
                {userProfile?.staff_id && (
                  <Badge variant="outline" className="border-accent text-accent">
                    ID: {userProfile.staff_id}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-0 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Submissions</p>
                <h3 className="text-3xl font-bold mt-1">{stats.totalSubmissions}</h3>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent to-accent-dark text-accent-foreground border-0 shadow-cyan-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Golden Data</p>
                <h3 className="text-3xl font-bold mt-1">{stats.goldenData}</h3>
              </div>
              <Star className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success to-success-dark text-success-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Accuracy Score</p>
                <h3 className="text-3xl font-bold mt-1">{stats.accuracyScore}%</h3>
              </div>
              <Award className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  className="border-primary/50 focus:border-primary"
                />
              ) : (
                <p className="text-foreground p-2 rounded bg-muted/50">
                  {formData.full_name || 'Not set'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                Email
              </Label>
              <p className="text-foreground p-2 rounded bg-muted/50">{user?.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-success" />
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Enter your phone number"
                  className="border-primary/50 focus:border-primary"
                />
              ) : (
                <p className="text-foreground p-2 rounded bg-muted/50">
                  {formData.phone_number || 'Not set'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Member Since
              </Label>
              <p className="text-foreground p-2 rounded bg-muted/50">
                {userProfile?.created_at ? 
                  new Date(userProfile.created_at).toLocaleDateString() : 
                  'Unknown'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
