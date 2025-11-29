import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star } from "lucide-react";

interface TrainingEntry {
  id: string;
  english_text: string;
  tangkhul_text: string;
  category_id: string | null;
  is_golden_data: boolean | null;
  confidence_score: number | null;
  review_count: number | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
  training_categories?: {
    name: string;
  };
}

interface TrainingEntriesListProps {
  entries: TrainingEntry[];
}

const TrainingEntriesList = ({ entries }: TrainingEntriesListProps) => {
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <BookOpen className="w-5 h-5" />
          Recent Community Contributions ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="border border-orange-200 rounded-lg p-4 bg-white/50">
              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">English</label>
                  <p className="font-medium">{entry.english_text}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tangkhul</label>
                  <p className="font-medium text-orange-700">{entry.tangkhul_text}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                {entry.training_categories?.name && (
                  <Badge variant="outline" className="border-orange-200">
                    {entry.training_categories.name}
                  </Badge>
                )}
                {entry.is_golden_data && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    <Star className="w-3 h-3 mr-1" />
                    Golden Data
                  </Badge>
                )}
                {entry.confidence_score !== null && (
                  <Badge variant="outline" className={
                    entry.confidence_score >= 90 ? "border-green-200 text-green-700" :
                    entry.confidence_score >= 75 ? "border-yellow-200 text-yellow-700" :
                    "border-red-200 text-red-700"
                  }>
                    {entry.confidence_score}% confidence
                  </Badge>
                )}
                {entry.review_count !== null && entry.review_count > 0 && (
                  <Badge variant="secondary">
                    {entry.review_count} reviews
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                By {entry.profiles?.full_name || 'Anonymous'} • {new Date(entry.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingEntriesList;
