import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, BookOpen, Target, Calendar, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserStats {
  totalSubmissions: number;
  goldenData: number;
  accuracyScore: number;
}

export default function ProfileScreenMobile() {
  const { user, userProfile, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats>({ totalSubmissions: 0, goldenData: 0, accuracyScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserStats();
    }
  }, [user?.id]);

  const loadUserStats = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const { count: totalSubmissions } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user.id);

      const { count: goldenData } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user.id)
        .eq('is_golden_data', true);

      const accuracyScore = totalSubmissions 
        ? Math.round((goldenData || 0) / totalSubmissions * 100) 
        : 0;

      setStats({
        totalSubmissions: totalSubmissions || 0,
        goldenData: goldenData || 0,
        accuracyScore
      });
    } catch (error) {
      // Silent fail - stats will show 0
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-background">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-accent p-4 pt-6 -mx-4 -mt-0">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
            <AvatarFallback className="bg-background text-primary text-2xl font-bold">
              {getInitials(userProfile?.full_name || user?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-primary-foreground">
              {userProfile?.full_name || 'User'}
            </h2>
            <Badge variant="secondary" className="mt-1 bg-background/20 text-primary-foreground border-0">
              {userProfile?.role || 'contributor'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-4">
        {/* User Info Card */}
        <Card className="p-4 border-border/50">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            {userProfile?.phone_number && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{userProfile.phone_number}</span>
              </div>
            )}
            {userProfile?.staff_id && (
              <div className="flex items-center gap-3 text-sm">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-mono">{userProfile.staff_id}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Member since {userProfile?.created_at ? formatDate(userProfile.created_at) : 'Unknown'}
              </span>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Contributions</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats.totalSubmissions}</p>
            )}
          </Card>

          <Card className="p-4 border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Accuracy</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats.accuracyScore}%</p>
            )}
          </Card>

          <Card className="p-4 border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Golden Data</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats.goldenData}</p>
            )}
          </Card>

          <Card className="p-4 border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Role</span>
            </div>
            <p className="text-lg font-semibold text-foreground capitalize">
              {userProfile?.role || 'Contributor'}
            </p>
          </Card>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          className="w-full mt-6 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
