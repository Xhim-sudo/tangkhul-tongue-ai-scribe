
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

interface AccuracyHeaderProps {
  overallAccuracy: number;
  targetAccuracy: number;
}

const AccuracyHeader: React.FC<AccuracyHeaderProps> = ({
  overallAccuracy,
  targetAccuracy
}) => {
  return (
    <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Target className="w-12 h-12 text-orange-200" />
            <div>
              <h2 className="text-4xl font-bold">{overallAccuracy}%</h2>
              <p className="text-orange-100">Overall System Accuracy</p>
            </div>
          </div>
          
          <div className="w-full bg-orange-300/30 rounded-full h-4 mb-4">
            <div 
              className="bg-white/80 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(overallAccuracy / targetAccuracy) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-center items-center gap-6 text-sm">
            <div>
              <span className="text-orange-100">Target: </span>
              <span className="font-bold">{targetAccuracy}%</span>
            </div>
            <div>
              <span className="text-orange-100">Progress: </span>
              <span className="font-bold">{Math.round((overallAccuracy / targetAccuracy) * 100)}%</span>
            </div>
            <div>
              <span className="text-orange-100">Status: </span>
              <span className="font-bold">
                {overallAccuracy >= 99 ? 'AI Ready!' : 'Training'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccuracyHeader;
