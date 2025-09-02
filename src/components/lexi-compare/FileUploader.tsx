"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
}

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragging(false);
    if (rejectedFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: 'File type not supported',
        description: 'Please upload TXT, CSV, or JSON files.',
      });
    }
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200',
        'border-border hover:border-primary/50 bg-background hover:bg-primary/5',
        isDragActive || isDragging ? 'border-primary bg-primary/10' : ''
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <UploadCloud className="w-10 h-10 text-primary" />
        <p className="font-semibold">
          {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs">Supported file types: TXT, CSV, JSON</p>
      </div>
    </div>
  );
}
