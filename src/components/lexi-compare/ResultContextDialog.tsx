"use client";

import type { UploadedFile } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ResultContextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    file: UploadedFile;
    term: string;
    matches: { lineNumber: number; context: string }[];
  } | null;
}

const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-primary-foreground rounded px-1">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export function ResultContextDialog({ isOpen, onClose, data }: ResultContextDialogProps) {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            Context for <span className="text-primary">&quot;{data.term}&quot;</span>
          </DialogTitle>
          <DialogDescription>
            Found in file: <strong>{data.file.file.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="space-y-4 pr-6">
            {data.matches.map((match, index) => (
              <div key={index} className="flex items-start gap-4">
                <Badge variant="outline" className="mt-1 font-mono text-xs">
                  {match.lineNumber}
                </Badge>
                <p className="font-mono text-sm bg-muted p-2 rounded-md flex-1 overflow-x-auto">
                  <HighlightedText text={match.context} highlight={data.term} />
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
