import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Star, MessageSquare, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Submission {
  id: string;
  english_text: string;
  tangkhul_text: string;
  contributor_id: string;
  category_id: string | null;
  grammar_features: any;
  linguistic_notes: string | null;
  is_golden_data: boolean | null;
  created_at: string;
  contributor_name: string | null;
  contributor_email: string;
}

const ReviewerWorkflow = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);

      const { data: submissionsData } = await supabase
        .from('training_submissions_log')
        .select(`
          *,
          profiles!training_submissions_log_contributor_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      const formatted = (submissionsData || []).map((sub: any) => ({
        id: sub.id,
        english_text: sub.english_text,
        tangkhul_text: sub.tangkhul_text,
        contributor_id: sub.contributor_id,
        category_id: sub.category_id,
        grammar_features: sub.grammar_features,
        linguistic_notes: sub.linguistic_notes,
        is_golden_data: sub.is_golden_data,
        created_at: sub.created_at,
        contributor_name: sub.profiles?.full_name || null,
        contributor_email: sub.profiles?.email || ''
      }));

      setSubmissions(formatted);
    } catch (error) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submission: Submission) => {
    if (!user?.id) return;
    
    setProcessing({ ...processing, [submission.id]: true });

    try {
      // Insert into training_entries
      const { error: insertError } = await supabase
        .from('training_entries')
        .insert({
          english_text: submission.english_text,
          tangkhul_text: submission.tangkhul_text,
          contributor_id: submission.contributor_id,
          category_id: submission.category_id,
          is_golden_data: submission.is_golden_data || false,
          confidence_score: 85,
          review_count: 1
        });

      if (insertError) throw insertError;

      // Update contributor dataset
      const { data: dataset } = await supabase
        .from('contributor_datasets')
        .select('*')
        .eq('contributor_id', submission.contributor_id)
        .single();

      if (dataset) {
        await supabase
          .from('contributor_datasets')
          .update({
            approved_submissions: (dataset.approved_submissions || 0) + 1,
            total_submissions: (dataset.total_submissions || 0) + 1,
            accuracy_score: Math.round(((dataset.approved_submissions || 0) + 1) / ((dataset.total_submissions || 0) + 1) * 100)
          })
          .eq('contributor_id', submission.contributor_id);
      }

      toast.success('Submission approved and added to training data');
      
      // Refresh list
      loadSubmissions();
    } catch (error) {
      toast.error('Failed to approve submission');
    } finally {
      setProcessing({ ...processing, [submission.id]: false });
    }
  };

  const handleReject = async (submission: Submission) => {
    if (!user?.id) return;
    
    setProcessing({ ...processing, [submission.id]: true });

    try {
      // Update contributor dataset for rejection
      const { data: dataset } = await supabase
        .from('contributor_datasets')
        .select('*')
        .eq('contributor_id', submission.contributor_id)
        .single();

      if (dataset) {
        await supabase
          .from('contributor_datasets')
          .update({
            rejected_submissions: (dataset.rejected_submissions || 0) + 1,
            total_submissions: (dataset.total_submissions || 0) + 1,
            accuracy_score: Math.round((dataset.approved_submissions || 0) / ((dataset.total_submissions || 0) + 1) * 100)
          })
          .eq('contributor_id', submission.contributor_id);
      }

      // Feedback is stored in the UI state for now

      toast.success('Submission rejected');
      
      // Refresh list
      loadSubmissions();
    } catch (error) {
      toast.error('Failed to reject submission');
    } finally {
      setProcessing({ ...processing, [submission.id]: false });
    }
  };

  const handleMarkGolden = async (submission: Submission) => {
    if (!user?.id) return;
    
    setProcessing({ ...processing, [submission.id]: true });

    try {
      // Update submission to mark as golden
      const { error: updateError } = await supabase
        .from('training_submissions_log')
        .update({ is_golden_data: true })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      toast.success('Marked as golden data');
      
      // Refresh list
      loadSubmissions();
    } catch (error) {
      toast.error('Failed to mark as golden data');
    } finally {
      setProcessing({ ...processing, [submission.id]: false });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reviewer Workflow</h2>
          <p className="text-muted-foreground mt-1">Review and approve community submissions</p>
        </div>
        <Button onClick={loadSubmissions} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Submissions</p>
            <h3 className="text-2xl font-bold text-foreground">{submissions.length}</h3>
          </CardContent>
        </Card>
        <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Golden Data</p>
            <h3 className="text-2xl font-bold text-foreground">
              {submissions.filter(s => s.is_golden_data).length}
            </h3>
          </CardContent>
        </Card>
        <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <h3 className="text-2xl font-bold text-foreground">
              {submissions.filter(s => !s.is_golden_data).length}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <Card key={submission.id} className="bg-surface/70 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-foreground">{submission.english_text}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      → {submission.tangkhul_text}
                    </p>
                  </div>
                  {submission.is_golden_data && (
                    <Badge className="bg-accent text-accent-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Golden
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contributor Info */}
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Submitted by: <span className="text-foreground font-medium">
                      {submission.contributor_name || submission.contributor_email}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Date: {new Date(submission.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Linguistic Notes */}
                {submission.linguistic_notes && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Notes: {submission.linguistic_notes}
                    </p>
                  </div>
                )}

                {/* Feedback */}
                <div>
                  <Textarea
                    placeholder="Add feedback (optional)"
                    value={feedback[submission.id] || ''}
                    onChange={(e) => setFeedback({ ...feedback, [submission.id]: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleApprove(submission)}
                    disabled={processing[submission.id]}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(submission)}
                    disabled={processing[submission.id]}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  {!submission.is_golden_data && (
                    <Button
                      onClick={() => handleMarkGolden(submission)}
                      disabled={processing[submission.id]}
                      variant="outline"
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Mark as Golden
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No submissions to review</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewerWorkflow;
