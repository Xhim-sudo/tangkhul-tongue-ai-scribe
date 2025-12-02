import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ParsedRow {
  english_text: string;
  tangkhul_text: string;
  category?: string;
  is_golden?: boolean;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

const CSVImport = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const englishIdx = headers.findIndex(h => h.includes('english') || h === 'source');
    const tangkhulIdx = headers.findIndex(h => h.includes('tangkhul') || h === 'target' || h === 'translation');
    const categoryIdx = headers.findIndex(h => h.includes('category'));
    const goldenIdx = headers.findIndex(h => h.includes('golden') || h.includes('verified'));

    if (englishIdx === -1 || tangkhulIdx === -1) {
      toast.error('CSV must have English and Tangkhul columns');
      return [];
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return {
        english_text: values[englishIdx] || '',
        tangkhul_text: values[tangkhulIdx] || '',
        category: categoryIdx !== -1 ? values[categoryIdx] : undefined,
        is_golden: goldenIdx !== -1 ? values[goldenIdx]?.toLowerCase() === 'true' : false,
        status: 'pending' as const
      };
    }).filter(row => row.english_text && row.tangkhul_text);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
      if (parsed.length > 0) {
        toast.success(`Parsed ${parsed.length} translation pairs`);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user?.id || parsedData.length === 0) return;

    setImporting(true);
    setProgress(0);

    const results = [...parsedData];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      
      try {
        const { error } = await supabase
          .from('training_entries')
          .insert({
            english_text: row.english_text,
            tangkhul_text: row.tangkhul_text,
            contributor_id: user.id,
            is_golden_data: row.is_golden || false,
            confidence_score: row.is_golden ? 0.95 : 0.7,
            review_count: 0
          });

        if (error) throw error;

        results[i] = { ...row, status: 'success' };
        successCount++;
      } catch (err: any) {
        results[i] = { ...row, status: 'error', error: err.message };
        errorCount++;
      }

      setProgress(Math.round(((i + 1) / results.length) * 100));
      setParsedData([...results]);
    }

    setImporting(false);
    toast.success(`Imported ${successCount} entries. ${errorCount} failed.`);
  };

  const downloadTemplate = () => {
    const template = 'english,tangkhul,category,is_golden\nhello,Ngala,greetings,true\nthank you,Kazo,greetings,true\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setParsedData([]);
    setFileName(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          CSV Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileText className="w-12 h-12 mx-auto text-primary/60 mb-4" />
          {fileName ? (
            <p className="text-foreground font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-foreground font-medium">Click to upload CSV file</p>
              <p className="text-sm text-muted-foreground mt-1">
                Required columns: english, tangkhul
              </p>
            </>
          )}
        </div>

        {/* Template Download */}
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download CSV Template
        </Button>

        {/* Preview */}
        {parsedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <Badge variant="outline">{parsedData.length} entries ready</Badge>
              <Button variant="ghost" size="sm" onClick={clearData}>Clear</Button>
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">{progress}% complete</p>
              </div>
            )}

            <ScrollArea className="h-[200px] rounded-md border border-border">
              <div className="p-4 space-y-2">
                <AnimatePresence>
                  {parsedData.slice(0, 50).map((row, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2 rounded bg-surface/50"
                    >
                      {row.status === 'pending' && (
                        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      {row.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      )}
                      {row.status === 'error' && (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate text-foreground">{row.english_text}</p>
                        <p className="text-xs text-muted-foreground truncate">→ {row.tangkhul_text}</p>
                      </div>
                      {row.is_golden && (
                        <Badge variant="outline" className="text-accent shrink-0">Golden</Badge>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {parsedData.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    ...and {parsedData.length - 50} more
                  </p>
                )}
              </div>
            </ScrollArea>

            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-dark"
            >
              {importing ? 'Importing...' : `Import ${parsedData.length} Entries`}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVImport;
