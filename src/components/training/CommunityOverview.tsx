
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Users, BookOpen } from "lucide-react";

interface CommunityOverviewProps {
  stats: {
    totalEntries: number;
    verifiedEntries: number;
    contributors: number;
    averageConfidence: number;
  };
}

const CommunityOverview = ({ stats }: CommunityOverviewProps) => {
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
              <TrendingUp className="w-8 h-8 text-green-200" />
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

      {/* AI Model Training Progress */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <TrendingUp className="w-5 h-5" />
            AI Model Training Progress
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
              <span>Data Verification Progress</span>
              <span>85.2%</span>
            </div>
            <Progress value={85.2} className="h-3" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Model Training Readiness</span>
              <span>68.9%</span>
            </div>
            <Progress value={68.9} className="h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityOverview;
