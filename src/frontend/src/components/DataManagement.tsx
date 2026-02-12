import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useExportData, useImportData, useIsCallerAdmin } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { ExportTypes, AcademicEntry, SubjectScores } from '../backend';

export default function DataManagement() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportType, setExportType] = useState<'academic-entries' | 'coding-attempts' | 'full-export'>('full-export');

  const exportMutation = useExportData();
  const importMutation = useImportData();
  const { data: isAdmin } = useIsCallerAdmin();

  const handleExport = async () => {
    try {
      const data = await exportMutation.mutateAsync(exportType);
      
      if (exportFormat === 'json') {
        exportAsJSON(data);
      } else {
        exportAsCSV(data);
      }
      
      toast.success('Data exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data');
    }
  };

  const exportAsJSON = (data: ExportTypes) => {
    const jsonString = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academic-data-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = (data: ExportTypes) => {
    let csvContent = '';
    
    if (exportType === 'academic-entries' || exportType === 'full-export') {
      csvContent += 'Academic Entries\n';
      csvContent += 'Date,Grade,Term,Stream,Subgroup,Math,English,Hindi,EVS,Computer,Kannada,Science,Social,AI,Physics,Chemistry,Biology,Economics,Business Studies,Accountancy,Statistics,Management,Total,Max Marks,Percentage\n';
      
      for (const [principal, entries] of data.academicEntries.academicEntries) {
        for (const entry of entries) {
          const date = new Date(Number(entry.timestamp) / 1000000).toLocaleDateString();
          const subjects = entry.subjects;
          csvContent += `${date},${entry.grade},${entry.term},${entry.stream || ''},${entry.subgroup || ''},`;
          csvContent += `${subjects.math || ''},${subjects.english || ''},${subjects.hindi || ''},${subjects.evs || ''},`;
          csvContent += `${subjects.computer || ''},${subjects.kannada || ''},${subjects.science || ''},${subjects.social || ''},`;
          csvContent += `${subjects.ai || ''},${subjects.physics || ''},${subjects.chemistry || ''},${subjects.biology || ''},`;
          csvContent += `${subjects.economics || ''},${subjects.businessStudies || ''},${subjects.accountancy || ''},`;
          csvContent += `${subjects.statistics || ''},${subjects.management || ''},`;
          csvContent += `${entry.termTotalMarks},${entry.termMaxMarks},${entry.termPercentage}%\n`;
        }
      }
      
      if (data.academicEntries.boardExamResults.length > 0) {
        csvContent += '\nBoard Exam Results\n';
        csvContent += 'Total,Max Marks,Percentage\n';
        for (const [principal, results] of data.academicEntries.boardExamResults) {
          csvContent += `${results.boardExamTotal},${results.maxMarks},${results.percentage}%\n`;
        }
      }
    }
    
    if (exportType === 'coding-attempts' || exportType === 'full-export') {
      if (csvContent) csvContent += '\n';
      csvContent += 'Coding Attempts\n';
      csvContent += 'Date,Challenge ID,Code,Result,Score\n';
      
      for (const [principal, attempts] of data.coding.attempts) {
        for (const attempt of attempts) {
          const date = new Date(Number(attempt.timestamp) / 1000000).toLocaleDateString();
          const code = attempt.code.replace(/"/g, '""');
          const result = attempt.result.replace(/"/g, '""');
          csvContent += `${date},${attempt.challengeId},"${code}","${result}",${attempt.score || ''}\n`;
        }
      }
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academic-data-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    if (!isAdmin) {
      toast.error('Only administrators can import data');
      return;
    }

    try {
      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent, (key, value) => {
        if (typeof value === 'string' && /^\d+$/.test(value) && key !== 'name' && key !== 'title' && key !== 'description' && key !== 'code' && key !== 'result' && key !== 'sampleInput' && key !== 'sampleOutput' && key !== 'gradeText' && key !== 'stream' && key !== 'subgroup') {
          return BigInt(value);
        }
        return value;
      });

      await importMutation.mutateAsync(data);
      toast.success('Data imported successfully!');
      setImportFile(null);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import data. Please check the file format.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json') {
        setImportFile(file);
      } else {
        toast.error('Please upload a JSON file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/json') {
        setImportFile(file);
      } else {
        toast.error('Please upload a JSON file');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Data Management</h2>
        <p className="text-muted-foreground">
          Export your data for backup or import previously saved data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download your academic and coding data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Type</Label>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={exportType === 'full-export' ? 'default' : 'outline'}
                  onClick={() => setExportType('full-export')}
                  className="justify-start"
                >
                  Full Export (All Data)
                </Button>
                <Button
                  variant={exportType === 'academic-entries' ? 'default' : 'outline'}
                  onClick={() => setExportType('academic-entries')}
                  className="justify-start"
                >
                  Academic Entries Only
                </Button>
                <Button
                  variant={exportType === 'coding-attempts' ? 'default' : 'outline'}
                  onClick={() => setExportType('coding-attempts')}
                  className="justify-start"
                >
                  Coding Attempts Only
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={exportFormat === 'json' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('json')}
                  className="gap-2"
                >
                  <FileJson className="w-4 h-4" />
                  JSON
                </Button>
                <Button
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('csv')}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {exportFormat === 'json' 
                  ? 'JSON format preserves all data and can be imported back into the application.'
                  : 'CSV format is suitable for viewing in spreadsheet applications but cannot be imported back.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="w-full gap-2"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Restore data from a previously exported file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAdmin && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only administrators can import data. Please contact an admin if you need to restore data.
                </AlertDescription>
              </Alert>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${!isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your JSON file here, or
              </p>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">browse files</span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!isAdmin}
                />
              </Label>
            </div>

            {importFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileJson className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{importFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImportFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only JSON files exported from this application can be imported. The import will merge with existing data.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleImport}
              disabled={!importFile || importMutation.isPending || !isAdmin}
              className="w-full gap-2"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Data
                </>
              )}
            </Button>

            {importMutation.isSuccess && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Data imported successfully! All views have been refreshed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>Export your data regularly to keep backups of your academic progress</li>
            <li>JSON exports contain all metadata and can be fully restored</li>
            <li>CSV exports are read-only and suitable for analysis in spreadsheet applications</li>
            <li>Only administrators can import data to prevent accidental data overwrites</li>
            <li>Imported data will be merged with your existing data, not replaced</li>
            <li>Make sure to export your data before any major changes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

