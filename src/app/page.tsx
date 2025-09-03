
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { UploadedFile, ComparisonResult, ResultCell } from '@/types';
import { FileUploader } from '@/components/lexi-compare/FileUploader';
import { FileList } from '@/components/lexi-compare/FileList';
import { TermSelector } from '@/components/lexi-compare/TermSelector';
import { ComparisonMatrix } from '@/components/lexi-compare/ComparisonMatrix';
import { ResultContextDialog } from '@/components/lexi-compare/ResultContextDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/exporter';
import { Search, Download, FileText, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { parseFile } from '@/ai/flows/parser-flow';

type DialogData = {
  file: UploadedFile;
  term: string;
  matches: { lineNumber: number; context: string }[];
};

export default function HomePage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [masterFileId, setMasterFileId] = useState<string | null>(null);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [manualTerms, setManualTerms] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dialogData, setDialogData] = useState<DialogData | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (uploadedFiles: File[]) => {
    setIsProcessing(true);
    setProgress(0);
    const newFiles: UploadedFile[] = await Promise.all(
      uploadedFiles.map(async (file, i) => {
        try {
          const isTextBased = file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('csv');
          const content = isTextBased ? await file.text() : '';
          setProgress(((i + 1) / uploadedFiles.length) * 50);
          return {
            id: `${file.name}-${Date.now()}`,
            file,
            content: content, 
          };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          toast({
            variant: 'destructive',
            title: 'File Process Error',
            description: `Could not process ${file.name}.`,
          });
          return null;
        }
      })
    );
  
    const validFiles = newFiles.filter((f): f is UploadedFile => f !== null);
  
    // Sequentially read and update content for all files to ensure UI is responsive
    const updatedFiles = await Promise.all(
      [...files, ...validFiles].map(async (uploadedFile) => {
        if (!uploadedFile.content) {
          const content = await uploadedFile.file.text();
          return { ...uploadedFile, content };
        }
        return uploadedFile;
      })
    );
    
    setFiles(prev => [...prev, ...validFiles]);
    setProgress(100);
    setIsProcessing(false);
  };
  
  const handleDeleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (id === masterFileId) {
      setMasterFileId(null);
      setExtractedTerms([]);
      setSelectedTerms(new Set());
      setComparisonResult(null);
    }
  };

  useEffect(() => {
    const extractTerms = async () => {
      if (!masterFileId) {
        setExtractedTerms([]);
        return;
      }
      const masterFile = files.find(f => f.id === masterFileId);
      if (masterFile) {
        setIsProcessing(true);
        setProgress(50);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    const dataUri = e.target.result;
                    const terms = await parseFile({
                        fileName: masterFile.file.name,
                        fileType: masterFile.file.type,
                        fileDataUri: dataUri,
                    });
                    setExtractedTerms(terms);
                    setSelectedTerms(new Set(terms));
                } else {
                    throw new Error("Failed to read file as Data URL.");
                }
            };
            reader.onerror = (error) => {
                console.error("FileReader Error:", error);
                throw new Error("Could not read file for parsing.");
            }
            reader.readAsDataURL(masterFile.file);

        } catch (error) {
            console.error("Term extraction error:", error);
            toast({
                variant: 'destructive',
                title: 'Term Extraction Error',
                description: `Could not parse terms from ${masterFile.file.name}. Ensure it's not corrupted.`,
            });
            setExtractedTerms([]);
            setSelectedTerms(new Set());
        } finally {
            setIsProcessing(false);
            setProgress(100);
        }
      }
    };
    extractTerms();
  }, [masterFileId, files, toast]);

  const allTerms = useMemo(() => {
    const manual = manualTerms.split(',').map(t => t.trim()).filter(Boolean);
    return [...new Set([...Array.from(selectedTerms), ...manual])];
  }, [selectedTerms, manualTerms]);

  const handleCompare = async () => {
    if (allTerms.length === 0 || files.length < 1) {
      toast({
        variant: 'destructive',
        title: 'Comparison Error',
        description: 'Please upload at least one file and select terms to compare.',
      });
      return;
    }
    if (!masterFileId && files.length > 1) {
        toast({
            variant: 'destructive',
            title: 'Master File Required',
            description: 'Please select a master file when comparing multiple documents.',
        });
        return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Lazily read content for comparison
    const filesWithContent = await Promise.all(
        files.map(async (file) => {
            if (file.content) {
                return file;
            }
            try {
                const content = await file.file.text();
                return { ...file, content };
            } catch (e) {
                console.error(`Failed to read content of ${file.file.name}`, e);
                return { ...file, content: "" }; // Fallback to empty content
            }
        })
    );
    setFiles(filesWithContent);
    
    // Use a timeout to allow the UI to update before blocking the main thread
    setTimeout(() => {
        const matrix = new Map<string, ResultCell>();
        
        filesWithContent.forEach((file, fileIndex) => {
          allTerms.forEach(term => {
            const key = `${term}-${file.id}`;
            const matches: { lineNumber: number; context: string }[] = [];
            
            if (file.content) {
              const lines = file.content.split('\n');
              lines.forEach((line, index) => {
                if(line.toLowerCase().includes(term.toLowerCase())) {
                    matches.push({ lineNumber: index + 1, context: line });
                }
              });
            }
            
            matrix.set(key, { found: matches.length > 0, matches });
          });
          setProgress(((fileIndex + 1) / filesWithContent.length) * 100);
        });

        setComparisonResult({
          terms: allTerms,
          files: filesWithContent,
          matrix,
        });
        setIsProcessing(false);
    }, 100);
  };
  
  const handleShowContext = (file: UploadedFile, term: string) => {
    const resultCell = comparisonResult?.matrix.get(`${term}-${file.id}`);
    if (resultCell && resultCell.matches) {
      setDialogData({ file, term, matches: resultCell.matches });
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 font-body">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline tracking-tight">LexiCompare</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your documents, designate a master file to extract terms, and instantly see where those terms appear across all your files.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>1. Upload Files</CardTitle>
              <CardDescription>Add documents to start your comparison.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onFileUpload={handleFileUpload} />
              <FileList 
                files={files} 
                masterFileId={masterFileId} 
                onSetMaster={setMasterFileId} 
                onDeleteFile={handleDeleteFile} 
              />
            </CardContent>
          </Card>

          <Card className="shadow-md">
             <CardHeader>
                <CardTitle>2. Select Terms</CardTitle>
                <CardDescription>Choose terms to search for across files.</CardDescription>
            </CardHeader>
            <CardContent>
                <TermSelector
                    terms={extractedTerms}
                    selectedTerms={selectedTerms}
                    onSelectionChange={setSelectedTerms}
                    manualTerms={manualTerms}
                    onManualTermsChange={setManualTerms}
                    disabled={!masterFileId}
                />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>3. Run Comparison</CardTitle>
              <CardDescription>
                Click the button below to generate the comparison matrix based on your selections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCompare} disabled={isProcessing || files.length < 1 || allTerms.length === 0} className="w-full">
                {isProcessing ? <Loader2 className="animate-spin" /> : <Search />}
                <span>{isProcessing ? 'Processing...' : 'Run Comparison'}</span>
              </Button>
            </CardContent>
          </Card>
          
          {isProcessing && progress > 0 && <Progress value={progress} className="w-full mt-4" />}

          {comparisonResult && (
            <Card className="mt-8 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Comparison Results</CardTitle>
                    <CardDescription>Click a checkmark to see the term in context.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => exportToCsv(comparisonResult)} >
                    <Download />
                    Export to CSV
                </Button>
              </CardHeader>
              <CardContent>
                <ComparisonMatrix results={comparisonResult} onShowContext={handleShowContext} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <ResultContextDialog 
        isOpen={!!dialogData} 
        onClose={() => setDialogData(null)} 
        data={dialogData} 
      />
    </main>
  );
}

    