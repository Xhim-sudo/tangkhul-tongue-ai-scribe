import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, XCircle, Star, MessageSquare, Users, 
  Eye, Clock, Send, RefreshCw 
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Submission {
  id: string;
  english_text: string;
  tangkhul_text: string;
  contributor_id: string;
  is_golden_data: boolean | null;
  created_at: string;
  contributor_name: string | null;
}

interface ActiveReviewer {
  id: string;
  name: string;
  email: string;
  viewing: string | null;
  status: 'online' | 'reviewing' | 'idle';
}

interface ReviewComment {
  id: string;
  user_id: string;
  user_name: string;
  submission_id: string;
  comment: string;
  timestamp: Date;
}

const CollaborativeReview = () => {
  const { user, userProfile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeReviewers, setActiveReviewers] = useState<ActiveReviewer[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  // Initialize presence channel
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('review-presence', {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const reviewers: ActiveReviewer[] = [];
        
        Object.entries(state).forEach(([_, presences]) => {
          (presences as any[]).forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              reviewers.push({
                id: presence.user_id,
                name: presence.user_name || 'Anonymous',
                email: presence.user_email || '',
                viewing: presence.viewing,
                status: presence.status || 'online'
              });
            }
          });
        });
        
        setActiveReviewers(reviewers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .on('broadcast', { event: 'comment' }, ({ payload }) => {
        if (payload.submission_id === selectedSubmission) {
          setComments(prev => [...prev, payload as ReviewComment]);
        }
      })
      .on('broadcast', { event: 'action' }, ({ payload }) => {
        toast.info(`${payload.user_name} ${payload.action} "${payload.english_text.substring(0, 30)}..."`);
        loadSubmissions();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: userProfile?.full_name || user.email,
            user_email: user.email,
            viewing: null,
            status: 'online'
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, userProfile?.full_name]);

  // Update presence when viewing submission changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('review-presence');
    channel.track({
      user_id: user.id,
      user_name: userProfile?.full_name || user?.email,
      user_email: user?.email,
      viewing: selectedSubmission,
      status: selectedSubmission ? 'reviewing' : 'online'
    });
  }, [selectedSubmission, user?.id, userProfile?.full_name]);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);

      const { data } = await supabase
        .from('training_submissions_log')
        .select(`
          id, english_text, tangkhul_text, contributor_id, is_golden_data, created_at,
          profiles!training_submissions_log_contributor_id_fkey (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      const formatted = (data || []).map((sub: any) => ({
        id: sub.id,
        english_text: sub.english_text,
        tangkhul_text: sub.tangkhul_text,
        contributor_id: sub.contributor_id,
        is_golden_data: sub.is_golden_data,
        created_at: sub.created_at,
        contributor_name: sub.profiles?.full_name || null
      }));

      setSubmissions(formatted);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const broadcastAction = useCallback((action: string, submission: Submission) => {
    const channel = supabase.channel('review-presence');
    channel.send({
      type: 'broadcast',
      event: 'action',
      payload: {
        user_name: userProfile?.full_name || user?.email,
        action,
        english_text: submission.english_text
      }
    });
  }, [userProfile?.full_name, user?.email]);

  const handleApprove = async (submission: Submission) => {
    if (!user?.id) return;
    setProcessing({ ...processing, [submission.id]: true });

    try {
      await supabase.from('training_entries').insert({
        english_text: submission.english_text,
        tangkhul_text: submission.tangkhul_text,
        contributor_id: submission.contributor_id,
        is_golden_data: submission.is_golden_data || false,
        confidence_score: 85,
        review_count: 1
      });

      broadcastAction('approved', submission);
      toast.success('Submission approved');
      loadSubmissions();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve submission');
    } finally {
      setProcessing({ ...processing, [submission.id]: false });
    }
  };

  const handleReject = async (submission: Submission) => {
    if (!user?.id) return;
    setProcessing({ ...processing, [submission.id]: true });

    try {
      broadcastAction('rejected', submission);
      toast.success('Submission rejected');
      loadSubmissions();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject submission');
    } finally {
      setProcessing({ ...processing, [submission.id]: false });
    }
  };

  const handleMarkGolden = async (submission: Submission) => {
    if (!user?.id) return;
    setProcessing({ ...processing, [submission.id]: true });

    try {
      await supabase
        .from('training_submissions_log')
        .update({ is_golden_data: true })
        .eq('id', submission.id);

      broadcastAction('marked as golden', submission);
      toast.success('Marked as golden data');
      loadSubmissions();
    } catch (error) {
      console.error('Failed to mark golden:', error);
      toast.error('Failed to mark as golden');
    } finally {
      setProcessing({ ...processing, [submission.id]: false });
    }
  };

  const sendComment = () => {
    if (!newComment.trim() || !selectedSubmission || !user?.id) return;

    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      user_id: user.id,
      user_name: userProfile?.full_name || user.email || 'Anonymous',
      submission_id: selectedSubmission,
      comment: newComment,
      timestamp: new Date()
    };

    const channel = supabase.channel('review-presence');
    channel.send({
      type: 'broadcast',
      event: 'comment',
      payload: comment
    });

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const getReviewersForSubmission = (submissionId: string) => {
    return activeReviewers.filter(r => r.viewing === submissionId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading collaborative review...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Collaborative Review</h2>
          <p className="text-muted-foreground mt-1">Review translations with your team in real-time</p>
        </div>
        <Button onClick={loadSubmissions} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Reviewers */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Active Reviewers ({activeReviewers.length + 1})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Current user */}
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {(userProfile?.full_name || user?.email || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">You</span>
            </div>

            {/* Other reviewers */}
            <AnimatePresence>
              {activeReviewers.map((reviewer) => (
                <motion.div
                  key={reviewer.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-full"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    reviewer.status === 'reviewing' ? 'bg-accent' : 'bg-success'
                  } animate-pulse`} />
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {reviewer.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{reviewer.name}</span>
                  {reviewer.viewing && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Reviewing
                    </Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-2 space-y-4">
          {submissions.map((submission) => {
            const reviewers = getReviewersForSubmission(submission.id);
            const isSelected = selectedSubmission === submission.id;

            return (
              <motion.div
                key={submission.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card 
                  className={`bg-surface/70 backdrop-blur-sm border-primary/20 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/40'
                  }`}
                  onClick={() => setSelectedSubmission(isSelected ? null : submission.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-foreground">{submission.english_text}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">→ {submission.tangkhul_text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reviewers.length > 0 && (
                          <div className="flex -space-x-2">
                            {reviewers.slice(0, 3).map((r) => (
                              <Avatar key={r.id} className="w-6 h-6 border-2 border-background">
                                <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                                  {r.name[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {reviewers.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                +{reviewers.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        {submission.is_golden_data && (
                          <Badge className="bg-accent text-accent-foreground">
                            <Star className="w-3 h-3 mr-1" />
                            Golden
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>By: {submission.contributor_name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {isSelected && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-3 border-t border-border space-y-3"
                      >
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleApprove(submission); }}
                            disabled={processing[submission.id]}
                            className="bg-success text-success-foreground hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleReject(submission); }}
                            disabled={processing[submission.id]}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          {!submission.is_golden_data && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleMarkGolden(submission); }}
                              disabled={processing[submission.id]}
                              variant="outline"
                              className="border-accent text-accent"
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Mark Golden
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Live Chat Panel */}
        <Card className="bg-surface/70 backdrop-blur-sm border-primary/20 h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Live Discussion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg ${
                        comment.user_id === user?.id 
                          ? 'bg-primary/10 ml-4' 
                          : 'bg-muted/50 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {comment.user_id === user?.id ? 'You' : comment.user_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.comment}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Select a submission to start discussing
                  </p>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                placeholder={selectedSubmission ? "Type a comment..." : "Select a submission first"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!selectedSubmission}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendComment();
                  }
                }}
              />
              <Button 
                onClick={sendComment}
                disabled={!selectedSubmission || !newComment.trim()}
                size="icon"
                className="h-auto"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CollaborativeReview;
