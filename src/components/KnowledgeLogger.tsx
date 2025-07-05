
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, BookOpen, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TrainingEntry {
  id: string;
  english: string;
  tangkhul: string;
  category: string;
  context: string;
  contributor: string;
  confidence: number;
  tags: string[];
  timestamp: Date;
}

const KnowledgeLogger = () => {
  const [englishText, setEnglishText] = useState("");
  const [tangkhulText, setTangkhulText] = useState("");
  const [category, setCategory] = useState("");
  const [context, setContext] = useState("");
  const [tags, setTags] = useState("");
  const [contributor, setContributor] = useState("");
  const [confidence, setConfidence] = useState("high");

  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([
    {
      id: "1",
      english: "Hello, how are you?",
      tangkhul: "Naga, nangvei thina?",
      category: "greetings",
      context: "Formal greeting",
      contributor: "Language Expert 1",
      confidence: 95,
      tags: ["greeting", "formal", "question"],
      timestamp: new Date()
    },
    {
      id: "2",
      english: "Thank you very much",
      tangkhul: "Kaphara mapham",
      category: "expressions",
      context: "Expressing gratitude",
      contributor: "Community Member",
      confidence: 90,
      tags: ["gratitude", "polite", "common"],
      timestamp: new Date()
    }
  ]);

  const handleSaveEntry = () => {
    if (!englishText.trim() || !tangkhulText.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both English and Tangkhul text.",
        variant: "destructive",
      });
      return;
    }

    const newEntry: TrainingEntry = {
      id: Date.now().toString(),
      english: englishText,
      tangkhul: tangkhulText,
      category: category || "general",
      context: context,
      contributor: contributor || "Anonymous",
      confidence: confidence === "high" ? 95 : confidence === "medium" ? 75 : 50,
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
      timestamp: new Date()
    };

    setTrainingEntries(prev => [newEntry, ...prev]);

    // Clear form
    setEnglishText("");
    setTangkhulText("");
    setCategory("");
    setContext("");
    setTags("");

    toast({
      title: "Training entry saved",
      description: "Your contribution has been added to the knowledge base.",
    });
  };

  const categories = [
    "greetings", "expressions", "numbers", "colors", "family", 
    "food", "nature", "time", "directions", "emotions"
  ];

  return (
    <div className="space-y-6">
      {/* Add New Entry */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Plus className="w-5 h-5" />
            Add Training Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">English Text</label>
              <Textarea
                placeholder="Enter English text..."
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tangkhul Translation</label>
              <Textarea
                placeholder="Enter Tangkhul translation..."
                value={tangkhulText}
                onChange={(e) => setTangkhulText(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confidence Level</label>
              <Select value={confidence} onValueChange={setConfidence}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High (95%)</SelectItem>
                  <SelectItem value="medium">Medium (75%)</SelectItem>
                  <SelectItem value="low">Low (50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contributor Name</label>
              <Input
                placeholder="Your name"
                value={contributor}
                onChange={(e) => setContributor(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Context/Usage Notes</label>
            <Input
              placeholder="When and how this phrase is used..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="border-orange-200 focus:border-orange-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <Input
              placeholder="formal, greeting, question"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border-orange-200 focus:border-orange-400"
            />
          </div>

          <Button 
            onClick={handleSaveEntry}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Training Entry
          </Button>
        </CardContent>
      </Card>

      {/* Training Data List */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <BookOpen className="w-5 h-5" />
            Training Knowledge Base ({trainingEntries.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingEntries.map((entry) => (
              <div key={entry.id} className="border border-orange-200 rounded-lg p-4 bg-white/50">
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">English</label>
                    <p className="font-medium">{entry.english}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Tangkhul</label>
                    <p className="font-medium text-orange-700">{entry.tangkhul}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <Badge variant="outline" className="border-orange-200">
                    {entry.category}
                  </Badge>
                  <Badge variant="outline" className={
                    entry.confidence >= 90 ? "border-green-200 text-green-700" :
                    entry.confidence >= 75 ? "border-yellow-200 text-yellow-700" :
                    "border-red-200 text-red-700"
                  }>
                    {entry.confidence}% confidence
                  </Badge>
                  {entry.tags.map(tag => (
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
                  By {entry.contributor} • {entry.timestamp.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeLogger;
