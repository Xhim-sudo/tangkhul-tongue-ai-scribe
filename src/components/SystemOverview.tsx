
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle, XCircle } from "lucide-react";

interface SystemOverviewProps {
  systemStats: {
    totalContributors: number;
    goldenDataCount: number;
    overallAccuracy: number;
    readyForAI: boolean;
  };
}

const SystemOverview: React.FC<SystemOverviewProps> = ({ systemStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Contributors</p>
              <p className="text-3xl font-bold">{systemStats.totalContributors}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Golden Data</p>
              <p className="text-3xl font-bold">{systemStats.goldenDataCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Overall Accuracy</p>
              <p className="text-3xl font-bold">{systemStats.overallAccuracy}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${systemStats.readyForAI ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-600'} text-white border-0`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">AI Ready Status</p>
              <p className="text-xl font-bold">{systemStats.readyForAI ? 'Ready!' : 'In Progress'}</p>
            </div>
            {systemStats.readyForAI ? 
              <CheckCircle className="w-8 h-8 text-white/80" /> :
              <XCircle className="w-8 h-8 text-white/80" />
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemOverview;
