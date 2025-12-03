import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, FileJson, FileText, Table, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type ExportFormat = 'json' | 'csv' | 'tsx';
type DataType = 'translations' | 'golden' | 'users' | 'categories' | 'analytics' | 'cache';

interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  goldenOnly: boolean;
  categoryId: string;
  contributorId: string;
}

const AdvancedExport = () => {
  const { user } = useAuth();
  const [format, setFormat] = useState<ExportFormat>('json');
  const [dataType, setDataType] = useState<DataType>('translations');
  const [isExporting, setIsExporting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [filters, setFilters] = useState<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    goldenOnly: false,
    categoryId: '',
    contributorId: ''
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    const [categoriesRes, contributorsRes] = await Promise.all([
      supabase.from('training_categories').select('id, name'),
      supabase.from('profiles').select('id, full_name, email')
    ]);
    
    setCategories(categoriesRes.data || []);
    setContributors(contributorsRes.data || []);
  };

  const fetchData = async () => {
    let query;
    
    switch (dataType) {
      case 'translations':
        query = supabase
          .from('training_entries')
          .select(`
            id, english_text, tangkhul_text, is_golden_data, confidence_score, created_at,
            training_categories (name),
            profiles:contributor_id (full_name, email)
          `);
        
        if (filters.goldenOnly) query = query.eq('is_golden_data', true);
        if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
        if (filters.contributorId) query = query.eq('contributor_id', filters.contributorId);
        if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
        if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
        break;
        
      case 'golden':
        query = supabase
          .from('training_entries')
          .select('id, english_text, tangkhul_text, confidence_score, created_at')
          .eq('is_golden_data', true)
          .order('confidence_score', { ascending: false });
        break;
        
      case 'users':
        query = supabase.from('profiles').select('*');
        break;
        
      case 'categories':
        query = supabase.from('training_categories').select('*');
        break;
        
      case 'analytics':
        query = supabase
          .from('translation_analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);
        break;
        
      case 'cache':
        query = supabase
          .from('translation_cache')
          .select('*')
          .order('hit_count', { ascending: false });
        break;
        
      default:
        return [];
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const flattenObject = (obj: any, prefix = ''): any => {
      return Object.keys(obj).reduce((acc: any, key: string) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(acc, flattenObject(obj[key], pre + key));
        } else {
          acc[pre + key] = obj[key];
        }
        return acc;
      }, {});
    };

    const flatData = data.map(item => flattenObject(item));
    const headers = Object.keys(flatData[0]);
    const rows = flatData.map(item => 
      headers.map(header => {
        const value = item[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const convertToTSX = (data: any[]) => {
    const entries = data.map(item => ({
      english: item.english_text || item.source_text,
      tangkhul: item.tangkhul_text || item.target_text,
      category: item.training_categories?.name || item.category || 'general',
      isGolden: item.is_golden_data || false
    }));

    return `// Auto-generated Tangkhul Translation Dataset
// Generated: ${new Date().toISOString()}
// Total entries: ${entries.length}

export interface TranslationEntry {
  english: string;
  tangkhul: string;
  category: string;
  isGolden: boolean;
}

export const translationData: TranslationEntry[] = ${JSON.stringify(entries, null, 2)};

export default translationData;
`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = await fetchData();
      
      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }

      let content: string;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case 'csv':
          content = convertToCSV(data);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'tsx':
          content = convertToTSX(data);
          mimeType = 'text/typescript';
          extension = 'tsx';
          break;
        default:
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          extension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tangkhul_${dataType}_${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log the export
      if (user?.id) {
        await supabase.from('data_exports').insert({
          user_id: user.id,
          export_type: dataType,
          status: 'completed'
        });
      }

      toast.success(`Exported ${data.length} records as ${extension.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Export Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={format === 'json' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
              onClick={() => setFormat('json')}
            >
              <FileJson className="w-6 h-6" />
              <span>JSON</span>
            </Button>
            <Button
              variant={format === 'csv' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
              onClick={() => setFormat('csv')}
            >
              <Table className="w-6 h-6" />
              <span>CSV</span>
            </Button>
            <Button
              variant={format === 'tsx' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
              onClick={() => setFormat('tsx')}
            >
              <FileText className="w-6 h-6" />
              <span>TSX</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Type Selection */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Data Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { value: 'translations', label: 'All Translations' },
              { value: 'golden', label: 'Golden Data' },
              { value: 'users', label: 'Users' },
              { value: 'categories', label: 'Categories' },
              { value: 'analytics', label: 'Analytics' },
              { value: 'cache', label: 'Cache' }
            ].map((option) => (
              <Badge
                key={option.value}
                variant={dataType === option.value ? 'default' : 'outline'}
                className="cursor-pointer py-3 justify-center text-sm"
                onClick={() => setDataType(option.value as DataType)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {dataType === 'translations' && (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contributor</Label>
                <Select
                  value={filters.contributorId}
                  onValueChange={(value) => setFilters({ ...filters, contributorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All contributors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All contributors</SelectItem>
                    {contributors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name || c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="goldenOnly"
                checked={filters.goldenOnly}
                onCheckedChange={(checked) => 
                  setFilters({ ...filters, goldenOnly: checked as boolean })
                }
              />
              <Label htmlFor="goldenOnly">Golden data only</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full h-14 text-lg"
        size="lg"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Export {dataType} as {format.toUpperCase()}
          </>
        )}
      </Button>
    </div>
  );
};

export default AdvancedExport;
