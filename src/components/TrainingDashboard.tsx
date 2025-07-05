
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Users, BookOpen, Target, Award } from "lucide-react";

const TrainingDashboard = () => {
  const stats = {
    totalEntries: 1247,
    verifiedEntries: 892,
    contributors: 15,
    categories: 12,
    averageConfidence: 87,
    weeklyGrowth: 23
  };

  const categoryData = [
    { name: "Greetings", count: 156, accuracy: 94 },
    { name: "Expressions", count: 203, accuracy: 89 },
    { name: "Numbers", count: 87, accuracy: 98 },
    { name: "Colors", count: 45, accuracy: 92 },
    { name: "Family", count: 134, accuracy: 86 },
    { name: "Food", count: 178, accuracy: 91 },
    { name: "Nature", count: 112, accuracy: 88 },
    { name: "Time", count: 98, accuracy: 93 }
  ];

  const topContributors = [
    { name: "Dr. Sarah Tangkhul", contributions: 234, accuracy: 96 },
    { name: "Community Elder John", contributions: 189, accuracy: 94 },
    { name: "Language Teacher Mary", contributions: 156, accuracy: 92 },
    { name: "Student Volunteer Alex", contributions: 134, accuracy: 89 },
    { name: "Researcher David", contributions: 112, accuracy: 91 }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Entries</p>
                <p className="text-3xl font-bold">{stats.totalEntries.toLocaleString()}</p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Verified Entries</p>
                <p className="text-3xl font-bold">{stats.verifiedEntries.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Contributors</p>
                <p className="text-3xl font-bold">{stats.contributors}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg. Confidence</p>
                <p className="text-3xl font-bold">{stats.averageConfidence}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Progress */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <TrendingUp className="w-5 h-5" />
            Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Dataset Completion</span>
              <span>71.5%</span>
            </div>
            <Progress value={71.5} className="h-3" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span>85.2%</span>
            </div>
            <Progress value={85.2} className="h-3" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Model Training Ready</span>
              <span>68.9%</span>
            </div>
            <Progress value={68.9} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="outline" className="border-orange-200">
                        {category.count} entries
                      </Badge>
                    </div>
                    <Progress value={category.accuracy} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">{category.accuracy}% accuracy</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Award className="w-5 h-5" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={contributor.name} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{contributor.name}</span>
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        {contributor.accuracy}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{contributor.contributions} contributions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Recent Training Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "New entry added", user: "Dr. Sarah Tangkhul", time: "2 minutes ago", category: "Expressions" },
              { action: "Entry verified", user: "Language Expert", time: "15 minutes ago", category: "Greetings" },
              { action: "Batch upload completed", user: "Community Elder John", time: "1 hour ago", category: "Food" },
              { action: "Translation corrected", user: "Language Teacher Mary", time: "2 hours ago", category: "Family" },
              { action: "New contributor joined", user: "Student Alex", time: "3 hours ago", category: "General" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-orange-200 rounded-lg bg-white/30">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-gray-600">
                    by {activity.user} • {activity.time} • {activity.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingDashboard;
