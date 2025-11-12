import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Award, Flame, Target } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";

export default function TrainingScreenMobile() {
  const { submitTrainingData, isLoading } = useTranslation();
  const [englishText, setEnglishText] = useState("");
  const [tangkhulText, setTangkhulText] = useState("");
  const [category, setCategory] = useState("general");
  const [context, setContext] = useState("");

  const handleSubmit = async () => {
    if (!englishText.trim() || !tangkhulText.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both English and Tangkhul text",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitTrainingData(englishText, tangkhulText, category, context);
      
      // Reset form
      setEnglishText("");
      setTangkhulText("");
      setContext("");
      
      toast({
        title: "Success!",
        description: "Your contribution has been submitted for review",
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Stats Header */}
      <div className="sticky top-14 z-30 bg-gradient-to-r from-primary/10 to-orange-500/10 border-b border-border">
        <div className="flex items-center justify-around py-4 px-4">
          <div className="flex flex-col items-center">
            <Flame className="w-6 h-6 text-orange-500 mb-1" />
            <span className="text-sm font-semibold">7 Day</span>
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <div className="flex flex-col items-center">
            <Target className="w-6 h-6 text-primary mb-1" />
            <span className="text-sm font-semibold">124</span>
            <span className="text-xs text-muted-foreground">Points</span>
          </div>
          <div className="flex flex-col items-center">
            <Award className="w-6 h-6 text-yellow-500 mb-1" />
            <span className="text-sm font-semibold">Gold</span>
            <span className="text-xs text-muted-foreground">Rank</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Contribute Translation</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="english">English Text</Label>
              <Textarea
                id="english"
                placeholder="Enter English text..."
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                className="min-h-[100px] text-base"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tangkhul">Tangkhul Translation</Label>
              <Textarea
                id="tangkhul"
                placeholder="Enter Tangkhul translation..."
                value={tangkhulText}
                onChange={(e) => setTangkhulText(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="greetings">Greetings</SelectItem>
                  <SelectItem value="food">Food & Drink</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="numbers">Numbers</SelectItem>
                  <SelectItem value="directions">Directions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context (Optional)</Label>
              <Input
                id="context"
                placeholder="e.g., Formal, Casual, Religious..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="text-base"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoading ? "Submitting..." : "Submit Contribution"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
