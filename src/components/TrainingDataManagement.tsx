import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';

interface TrainingSubmission {
  id: string;
  english_text: string;
  tangkhul_text: string;
  category: string;
  context?: string;
  tags?: string[];
  contributor_id: string;
  contributor_name?: string;
  contributor_email?: string;
  submission_hash: string;
  is_consensus_correct?: boolean;
  confidence_score: number;
  created_at: string;
  agreement_score?: number;
  submission_count?: number;
  is_golden_data?: boolean;
}

const TrainingDataManagement: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<TrainingSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<TrainingSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubmissions();
      loadCategories();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('admin-training-submissions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'training_submissions_log'
          },
          () => {
            loadSubmissions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, categoryFilter, statusFilter]);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('training_submissions_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Enrich with consensus data and contributor info
      const enrichedSubmissions = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          // Get consensus data
          const { data: consensus } = await supabase
            .from('translation_consensus')
            .select('agreement_score, submission_count, is_golden_data')
            .eq('english_text', submission.english_text)
            .eq('tangkhul_text', submission.tangkhul_text)
            .single();

          // Get contributor info
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', submission.contributor_id)
            .single();

          return {
            ...submission,
            contributor_name: profile?.full_name || 'Unknown',
            contributor_email: profile?.email || '',
            agreement_score: consensus?.agreement_score || 0,
            submission_count: consensus?.submission_count || 1,
            is_golden_data: consensus?.is_golden_data || false
          };
        })
      );

      setSubmissions(enrichedSubmissions);
    } catch (error: any) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error loading submissions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('training_categories')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data?.map(cat => cat.name) || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.english_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.tangkhul_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.contributor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(submission => submission.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'consensus') {
        filtered = filtered.filter(submission => (submission.agreement_score || 0) >= 80);
      } else if (statusFilter === 'golden') {
        filtered = filtered.filter(submission => submission.is_golden_data);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(submission => (submission.agreement_score || 0) < 80);
      }
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusBadge = (submission: TrainingSubmission) => {
    if (submission.is_golden_data) {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">Golden Data</Badge>;
    }
    
    const agreementScore = submission.agreement_score || 0;
    if (agreementScore >= 80) {
      return <Badge variant="default" className="bg-green-500">Consensus ({agreementScore.toFixed(1)}%)</Badge>;
    } else if (agreementScore > 0) {
      return <Badge variant="secondary">Partial Consensus ({agreementScore.toFixed(1)}%)</Badge>;
    } else {
      return <Badge variant="outline">Pending Review</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading submissions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Training Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="consensus">Consensus</SelectItem>
                  <SelectItem value="golden">Golden Data</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{submissions.length}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {submissions.filter(s => (s.agreement_score || 0) >= 80).length}
                </div>
                <div className="text-sm text-muted-foreground">Consensus Reached</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {submissions.filter(s => s.is_golden_data).length}
                </div>
                <div className="text-sm text-muted-foreground">Golden Data</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {new Set(submissions.map(s => s.contributor_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-muted-foreground">No submissions found matching your filters.</div>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(submission)}
                    <Badge variant="outline">{submission.category}</Badge>
                    {(submission.submission_count || 0) > 1 && (
                      <Badge variant="secondary">
                        {submission.submission_count} submissions
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(submission.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="font-medium text-sm text-muted-foreground mb-1">English</div>
                    <div className="p-3 bg-muted rounded-md">{submission.english_text}</div>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-muted-foreground mb-1">Tangkhul</div>
                    <div className="p-3 bg-muted rounded-md">{submission.tangkhul_text}</div>
                  </div>
                </div>

                {submission.context && (
                  <div className="mb-3">
                    <div className="font-medium text-sm text-muted-foreground mb-1">Context</div>
                    <div className="text-sm">{submission.context}</div>
                  </div>
                )}

                {submission.tags && submission.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="font-medium text-sm text-muted-foreground mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {submission.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div>
                    Contributor: {submission.contributor_name}
                    {submission.contributor_email && ` (${submission.contributor_email})`}
                  </div>
                  <div className="flex items-center gap-2">
                    Confidence: {submission.confidence_score}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TrainingDataManagement;