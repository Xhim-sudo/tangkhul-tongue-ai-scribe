
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportIndividualData = async (contributorId: string, format: 'csv' | 'json' | 'xlsx' = 'json') => {
    setIsExporting(true);
    try {
      // Fetch contributor's data
      const { data: contributorData } = await supabase
        .from('contributor_datasets')
        .select('*')
        .eq('contributor_id', contributorId);

      const { data: trainingData } = await supabase
        .from('training_entries')
        .select('*')
        .eq('contributor_id', contributorId);

      const exportData = {
        contributor_id: contributorId,
        datasets: contributorData || [],
        training_entries: trainingData || [],
        exported_at: new Date().toISOString(),
        total_entries: (contributorData?.length || 0) + (trainingData?.length || 0)
      };

      // Log the export
      await supabase
        .from('data_exports')
        .insert({
          user_id: contributorId,
          export_type: 'individual',
          file_format: format,
          record_count: exportData.total_entries
        });

      // Create and download file
      const fileName = `contributor_data_${contributorId}_${Date.now()}.${format}`;
      const fileContent = format === 'json' 
        ? JSON.stringify(exportData, null, 2)
        : convertToCSV(exportData);

      downloadFile(fileContent, fileName, format === 'json' ? 'application/json' : 'text/csv');

      toast({
        title: "Data exported successfully",
        description: `${exportData.total_entries} records exported as ${format.toUpperCase()}`,
      });

      return exportData;
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportGoldenData = async (format: 'csv' | 'json' | 'xlsx' = 'json') => {
    setIsExporting(true);
    try {
      const { data: goldenData } = await supabase
        .from('training_entries')
        .select('id, english_text, tangkhul_text, contributor_id')
        .eq('is_golden_data', true)
        .order('confidence_score', { ascending: false });

      const exportData = {
        type: 'golden_dataset',
        entries: goldenData || [],
        exported_at: new Date().toISOString(),
        total_entries: goldenData?.length || 0
      };

      // Log the export
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await supabase
          .from('data_exports')
          .insert({
            user_id: user.data.user.id,
            export_type: 'golden',
            file_format: format,
            record_count: exportData.total_entries
          });
      }

      const fileName = `golden_dataset_${Date.now()}.${format}`;
      const fileContent = format === 'json' 
        ? JSON.stringify(exportData, null, 2)
        : convertToCSV(exportData);

      downloadFile(fileContent, fileName, format === 'json' ? 'application/json' : 'text/csv');

      toast({
        title: "Golden dataset exported",
        description: `${exportData.total_entries} high-accuracy entries exported`,
      });

      return exportData;
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any) => {
    if (!data.entries || data.entries.length === 0) return '';
    
    const headers = Object.keys(data.entries[0]).join(',');
    const rows = data.entries.map((entry: any) => 
      Object.values(entry).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    exportIndividualData,
    exportGoldenData,
    isExporting
  };
};
