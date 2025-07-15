
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Target, Award, TrendingUp } from "lucide-react";

interface UserStatsProps {
  stats: {
    totalContributions: number;
    accuracy: number;
    goldenEntries: number;
    rank: number;
  };
}

const UserStats = ({ stats }: UserStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">My Contributions</p>
              <p className="text-2xl font-bold">{stats.totalContributions}</p>
            </div>
            <BookOpen className="w-6 h-6 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">My Accuracy</p>
              <p className="text-2xl font-bold">{stats.accuracy}%</p>
            </div>
            <Target className="w-6 h-6 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Golden Entries</p>
              <p className="text-2xl font-bold">{stats.goldenEntries}</p>
            </div>
            <Award className="w-6 h-6 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">My Rank</p>
              <p className="text-2xl font-bold">#{stats.rank}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-orange-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStats;
