import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Flame, Target, WifiOff, Cloud, Save } from "lucide-react";
import { useSubmission } from "@/hooks/useSubmission";
import { toast } from "@/hooks/use-toast";

export default function TrainingScreenMobile() {
  const {
    submitEntry, isSubmitting, categories, categoriesLoading,
    userStats, statsLoading, isOnline, queueLength,
    saveDraft, loadDraft,
  } = useSubmission();

  const [englishText, setEnglishText] = useState("");
  const [tangkhulText, setTangkhulText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [context, setContext] = useState("");

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setEnglishText(draft.englishText || "");
      setTangkhulText(draft.tangkhulText || "");
      setCategoryId(draft.categoryId || "");
      setContext(draft.linguisticNotes || "");
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (englishText || tangkhulText) {
        saveDraft({ englishText, tangkhulText, categoryId, linguisticNotes: context });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [englishText, tangkhulText, categoryId, context]);

  const handleSubmit = async () => {
    const success = await submitEntry({
      englishText,
      tangkhulText,
      categoryId: categoryId || null,
      linguisticNotes: context,
    });

    if (success) {
      setEnglishText("");
      setTangkhulText("");
      setCategoryId("");
      setContext("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Stats Header */}
      <div className="sticky top-14 z-20 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="flex items-center justify-around py-3 px-4">
          {statsLoading ? (
            <>
              <Skeleton className="w-16 h-12" />
              <Skeleton className="w-16 h-12" />
              <Skeleton className="w-16 h-12" />
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <Flame className="w-5 h-5 text-orange-500 mb-0.5" />
                <span className="text-sm font-semibold">{userStats.streak} Day</span>
                <span className="text-xs text-muted-foreground">Streak</span>
              </div>
              <div className="flex flex-col items-center">
                <Target className="w-5 h-5 text-primary mb-0.5" />
                <span className="text-sm font-semibold">{userStats.totalContributions}</span>
                <span className="text-xs text-muted-foreground">Entries</span>
              </div>
              <div className="flex flex-col items-center">
                <Award className="w-5 h-5 text-yellow-500 mb-0.5" />
                <span className="text-sm font-semibold">{userStats.goldenCount}</span>
                <span className="text-xs text-muted-foreground">Golden</span>
              </div>
            </>
          )}
        </div>
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 pb-2 text-xs text-muted-foreground">
            <WifiOff className="w-3 h-3" />
            <span>Offline — entries saved locally</span>
            {queueLength > 0 && <Badge variant="secondary" className="text-xs">{queueLength} pending</Badge>}
          </div>
        )}
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
              {categoriesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category" className="text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
              disabled={isSubmitting || (!englishText.trim() || !tangkhulText.trim())}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isSubmitting ? "Submitting..." : isOnline ? (
                <><Save className="w-4 h-4 mr-2" />Submit Contribution</>
              ) : (
                <><WifiOff className="w-4 h-4 mr-2" />Save Offline</>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
