"use client";

import type { ComparisonResult, UploadedFile } from '@/types';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ComparisonMatrixProps {
  results: ComparisonResult;
  onShowContext: (file: UploadedFile, term: string) => void;
}

export function ComparisonMatrix({ results, onShowContext }: ComparisonMatrixProps) {
  return (
    <TooltipProvider>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card z-10 min-w-[200px]">Term</TableHead>
              {results.files.map(file => (
                <TableHead key={file.id} className="min-w-[150px] truncate">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate">{file.file.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{file.file.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.terms.map(term => (
              <TableRow key={term}>
                <TableCell className="font-medium sticky left-0 bg-card z-10">{term}</TableCell>
                {results.files.map(file => {
                  const key = `${term}-${file.id}`;
                  const cellData = results.matrix.get(key);
                  
                  if (!cellData) {
                    return (
                      <TableCell key={key} className="text-center">
                        <HelpCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                      </TableCell>
                    );
                  }

                  const canShowContext = cellData.found && cellData.matches && cellData.matches.length > 0;
                  
                  return (
                    <TableCell 
                      key={key} 
                      className={cn(
                        'text-center transition-colors',
                        canShowContext && 'cursor-pointer hover:bg-muted'
                      )}
                      onClick={() => canShowContext && onShowContext(file, term)}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {cellData.found ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {canShowContext && <Badge variant="secondary">{cellData.matches?.length}</Badge>}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </TooltipProvider>
  );
}
