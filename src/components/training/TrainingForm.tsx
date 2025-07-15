
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Upload, Mic } from "lucide-react";

interface TrainingFormProps {
  onSubmit: (data: {
    englishText: string;
    tangkhulText: string;
    category: string;
    context: string;
    tags: string;
  }) => void;
  isLoading?: boolean;
}

const TrainingForm = ({ onSubmit, isLoading = false }: TrainingFormProps) => {
  const [englishText, setEnglishText] = useState("");
  const [tangkhulText, setTangkhulText] = useState("");
  const [category, setCategory] = useState("");
  const [context, setContext] = useState("");
  const [tags, setTags] = useState("");

  const categories = [
    "greetings", "expressions", "numbers", "colors", "family", 
    "food", "nature", "time", "directions", "emotions"
  ];

  const handleSubmit = () => {
    if (!englishText.trim() || !tangkhulText.trim()) return;
    
    onSubmit({
      englishText,
      tangkhulText,
      category: category || "general",
      context,
      tags
    });

    // Clear form
    setEnglishText("");
    setTangkhulText("");
    setCategory("");
    setContext("");
    setTags("");
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Plus className="w-5 h-5" />
          Contribute High-Quality Training Data
        </CardTitle>
        <p className="text-sm text-gray-600">
          Your contributions help build the AI model. Accuracy is key for reaching our 99% target!
        </p>
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
              placeholder="Enter accurate Tangkhul translation..."
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
            <label className="text-sm font-medium">Context/Usage</label>
            <Textarea
              placeholder="When and how is this used?"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="border-orange-200 focus:border-orange-400 h-10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Textarea
              placeholder="formal, casual, question"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border-orange-200 focus:border-orange-400 h-10"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-orange-200">
              <Upload className="w-4 h-4 mr-2" />
              Batch Upload
            </Button>
            <Button variant="outline" size="sm" className="border-orange-200">
              <Mic className="w-4 h-4 mr-2" />
              Record Audio
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              💡 Tip: High-accuracy contributions become part of the golden dataset
            </div>
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              disabled={!englishText.trim() || !tangkhulText.trim() || isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingForm;
