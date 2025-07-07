
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Database, Award, TrendingUp } from "lucide-react";

interface AccuracyStatsProps {
  totalEntries: number;
  goldenEntries: number;
  overallAccuracy: number;
}

const AccuracyStats: React.FC<AccuracyStatsProps> = ({
  totalEntries,
  goldenEntries,
  overallAccuracy
}) => {
  const accuracyColor = overallAccuracy >= 99 ? 'text-green-600' : 
                       overallAccuracy >= 95 ? 'text-blue-600' : 
                       overallAccuracy >= 90 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardContent className="p-6 text-center">
          <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{totalEntries.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Training Entries</div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardContent className="p-6 text-center">
          <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{goldenEntries.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Golden Dataset Entries</div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardContent className="p-6 text-center">
          <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className={`text-2xl font-bold ${accuracyColor}`}>
            {overallAccuracy >= 99 ? 'Ready!' : 'Training'}
          </div>
          <div className="text-sm text-gray-600">AI Integration Status</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccuracyStats;
