
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Tag } from "lucide-react";

interface TrainingEntry {
  id: string;
  english_text: string;
  tangkhul_text: string;
  category: string;
  status: string;
  confidence_score: number;
  tags?: string[];
  context?: string;
  created_at: string;
  profiles?: {
    full_name: string;
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
                <Badge variant="outline" className="border-orange-200">
                  {entry.category}
                </Badge>
                <Badge variant={
                  entry.status === 'approved' ? "default" :
                  entry.status === 'pending' ? "secondary" : "destructive"
                }>
                  {entry.status}
                </Badge>
                <Badge variant="outline" className={
                  entry.confidence_score >= 90 ? "border-green-200 text-green-700" :
                  entry.confidence_score >= 75 ? "border-yellow-200 text-yellow-700" :
                  "border-red-200 text-red-700"
                }>
                  {entry.confidence_score}% confidence
                </Badge>
                {entry.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-orange-100 text-orange-700">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {entry.context && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Context:</span> {entry.context}
                </p>
              )}
              
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
