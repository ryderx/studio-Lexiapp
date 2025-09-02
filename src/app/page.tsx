"use client";

import type { FC } from 'react';
import React, { useState, useMemo, useCallback } from 'react';
import { FileUploader } from '@/components/lexi-compare/FileUploader';
import { FileList } from '@/components/lexi-compare/FileList';
import { TermSelector } from '@/components/lexi-compare/TermSelector';
import { ComparisonMatrix } from '@/components/lexi-compare/ComparisonMatrix';
import { ResultContextDialog } from '@/components/lexi-compare/ResultContextDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { parseFileContent } from '@/lib/parser';
import { exportToCsv } from '@/lib/exporter';
import type { UploadedFile, ComparisonResult, ResultCell } from '@/types';
import { FileText, Tags, Rows3, Loader2, Download } from 'lucide-react';

const IconWrapper: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-primary/10 text-primary p-3 rounded-full">{children}</div>
);

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [masterFileId, setMasterFileId] = useState<string | null>(null);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [manualTerms, setManualTerms] = useState<string>('');
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [contextData, setContextData] = useState<{ file: UploadedFile; term: string; matches: { lineNumber: number; context: string }[] } | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      content: '',
    }));
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const handleSetMaster = async (id: string) => {
    setMasterFileId(id);
    setResults(null);
    const masterFile = files.find(f => f.id === id);
    if (masterFile) {
      try {
        const content = await masterFile.file.text();
        masterFile.content = content;
        const terms = await parseFileContent(masterFile.file);
        setExtractedTerms(terms);
        setSelectedTerms(new Set(terms));
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error reading master file',
          description: 'Could not read or parse the selected master file.',
        });
        setExtractedTerms([]);
        setSelectedTerms(new Set());
      }
    }
  };

  const handleDeleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (masterFileId === id) {
      setMasterFileId(null);
      setExtractedTerms([]);
      setSelectedTerms(new Set());
      setResults(null);
    }
  };

  const handleComparison = async () => {
    const finalTerms = new Set([...selectedTerms, ...manualTerms.split(',').map(t => t.trim()).filter(Boolean)]);
    
    if (!masterFileId) {
      toast({ variant: 'destructive', title: 'No Master File', description: 'Please select a master file.' });
      return;
    }
    if (finalTerms.size === 0) {
      toast({ variant: 'destructive', title: 'No Terms', description: 'Please select or enter terms to search for.' });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setResults(null);

    const comparisonFiles = files.filter(f => f.id !== masterFileId);
    const newResults: ComparisonResult = { terms: Array.from(finalTerms), files: comparisonFiles, matrix: new Map() };

    for (let i = 0; i < comparisonFiles.length; i++) {
      const file = comparisonFiles[i];
      try {
        if (!file.content) {
          file.content = await file.file.text();
        }

        finalTerms.forEach(term => {
          const lines = file.content.split('\n');
          const matches: { lineNumber: number; context: string }[] = [];
          
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(term.toLowerCase())) {
              matches.push({ lineNumber: index + 1, context: line });
            }
          });

          const key = `${term}-${file.id}`;
          newResults.matrix.set(key, { found: matches.length > 0, matches });
        });

      } catch (error) {
        toast({ variant: 'destructive', title: 'File Read Error', description: `Could not read file: ${file.file.name}` });
      }
      setProgress(((i + 1) / comparisonFiles.length) * 100);
    }

    setResults(newResults);
    setIsLoading(false);
  };
  
  const handleShowContext = useCallback((file: UploadedFile, term: string) => {
    const key = `${term}-${file.id}`;
    const cellData = results?.matrix.get(key);
    if (cellData && cellData.matches) {
      setContextData({ file, term, matches: cellData.matches });
    }
  }, [results]);

  const masterFile = useMemo(() => files.find(f => f.id === masterFileId), [files, masterFileId]);
  const comparisonFiles = useMemo(() => files.filter(f => f.id !== masterFileId), [files, masterFileId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-6 px-4 md:px-8 border-b">
        <h1 className="text-3xl font-bold text-primary font-headline">LexiCompare</h1>
        <p className="text-muted-foreground mt-1">Your advanced cross-file text comparison tool.</p>
      </header>

      <main className="p-4 md:p-8 grid gap-8">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center gap-4">
              <IconWrapper><FileText size={24} /></IconWrapper>
              <div>
                <CardTitle>1. Upload Files</CardTitle>
                <CardDescription>Upload multiple files and select one as the master.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <FileUploader onFileUpload={handleFileUpload} />
              <FileList files={files} masterFileId={masterFileId} onSetMaster={handleSetMaster} onDeleteFile={handleDeleteFile} />
            </CardContent>
          </Card>

          <Card className={`md:col-span-2 transition-opacity duration-300 ${masterFileId ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <CardHeader className="flex flex-row items-center gap-4">
              <IconWrapper><Tags size={24} /></IconWrapper>
              <div>
                <CardTitle>2. Select Terms</CardTitle>
                <CardDescription>Select terms from the master file or add your own.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <TermSelector 
                terms={extractedTerms} 
                selectedTerms={selectedTerms} 
                onSelectionChange={setSelectedTerms} 
                manualTerms={manualTerms}
                onManualTermsChange={setManualTerms}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center">
            <Button
                size="lg"
                onClick={handleComparison}
                disabled={isLoading || !masterFileId || files.length < 2}
                className="w-full max-w-md bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Comparing...</> : 'Run Comparison'}
            </Button>
        </div>

        {isLoading && (
            <div className="flex flex-col items-center gap-4">
                <Progress value={progress} className="w-full max-w-2xl" />
                <p className="text-sm text-muted-foreground">Processing {comparisonFiles.length} files...</p>
            </div>
        )}

        {results && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <IconWrapper><Rows3 size={24} /></IconWrapper>
                <div>
                  <CardTitle>3. Comparison Results</CardTitle>
                  <CardDescription>
                    Found {Array.from(results.matrix.values()).filter(v => v.found).length} matches across {results.files.length} files.
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={() => exportToCsv(results)}>
                <Download className="mr-2 h-4 w-4" /> Export to CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ComparisonMatrix results={results} onShowContext={handleShowContext} />
            </CardContent>
          </Card>
        )}
      </main>

      <ResultContextDialog
        isOpen={!!contextData}
        onClose={() => setContextData(null)}
        data={contextData}
      />
    </div>
  );
}
