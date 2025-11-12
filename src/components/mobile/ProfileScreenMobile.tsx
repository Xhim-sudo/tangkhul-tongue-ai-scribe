import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, BookOpen, Target, Settings } from "lucide-react";

export default function ProfileScreenMobile() {
  const { user, userProfile, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary/20 to-orange-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(userProfile?.full_name || user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{userProfile?.full_name || 'User'}</h2>
              <Badge variant="secondary" className="mt-1">
                {userProfile?.role || 'contributor'}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        
        {userProfile?.staff_id && (
          <p className="text-sm text-muted-foreground">
            Staff ID: <span className="font-mono font-semibold">{userProfile.staff_id}</span>
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Contributions</span>
            </div>
            <p className="text-2xl font-bold">47</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Accuracy</span>
            </div>
            <p className="text-2xl font-bold">94%</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Rank</span>
            </div>
            <p className="text-2xl font-bold">#12</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Points</span>
            </div>
            <p className="text-2xl font-bold">1,247</p>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Recent Achievements
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-accent rounded-lg">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                🏆
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">First Contribution</p>
                <p className="text-xs text-muted-foreground">Completed 3 days ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-accent rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                🔥
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">7 Day Streak</p>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-sm">Contributed translation for "Hello"</p>
                  <p className="text-xs text-muted-foreground">{i + 1} days ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
