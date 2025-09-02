"use client";

import type { UploadedFile } from '@/types';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Trash2 } from 'lucide-react';

interface FileListProps {
  files: UploadedFile[];
  masterFileId: string | null;
  onSetMaster: (id: string) => void;
  onDeleteFile: (id: string) => void;
}

export function FileList({ files, masterFileId, onSetMaster, onDeleteFile }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
      <ScrollArea className="h-48 w-full rounded-md border p-2">
        <RadioGroup value={masterFileId ?? undefined} onValueChange={onSetMaster}>
          <div className="space-y-2">
            {files.map(uploadedFile => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={uploadedFile.id} id={`radio-${uploadedFile.id}`} />
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor={`radio-${uploadedFile.id}`} className="cursor-pointer">
                    <p className="font-medium text-sm truncate max-w-[120px]">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(uploadedFile.file.size)}</p>
                  </Label>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteFile(uploadedFile.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </RadioGroup>
      </ScrollArea>
      <p className="text-xs text-muted-foreground mt-2">Select a master file to extract terms for comparison.</p>
    </div>
  );
}
