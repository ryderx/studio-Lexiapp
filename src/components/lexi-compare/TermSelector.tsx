
"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TermSelectorProps {
  terms: string[];
  selectedTerms: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
  manualTerms: string;
  onManualTermsChange: (value: string) => void;
  disabled?: boolean;
}

export function TermSelector({ terms, selectedTerms, onSelectionChange, manualTerms, onManualTermsChange, disabled = false }: TermSelectorProps) {
  const handleToggleTerm = (term: string) => {
    const newSelection = new Set(selectedTerms);
    if (newSelection.has(term)) {
      newSelection.delete(term);
    } else {
      newSelection.add(term);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(new Set(terms));
  };

  const handleDeselectAll = () => {
    onSelectionChange(new Set());
  };

  return (
    <div className={cn("space-y-4", disabled && "opacity-50 pointer-events-none")}>
      <div>
        <Label htmlFor="manual-terms">Add Manual Terms (comma-separated)</Label>
        <Input 
          id="manual-terms"
          placeholder="e.g. keyword1, another keyword" 
          value={manualTerms}
          onChange={(e) => onManualTermsChange(e.target.value)}
          className="mt-1"
        />
      </div>

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-2">
            <div>
                <h3 className="text-sm font-medium">Extracted Terms from Master</h3>
                <p className="text-xs text-muted-foreground">{selectedTerms.size} of {terms.length} selected</p>
            </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={terms.length === 0}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={terms.length === 0}>
              Deselect All
            </Button>
          </div>
        </div>

        <ScrollArea className="h-48 w-full rounded-md border">
          <div className="p-4 space-y-2">
            {terms.length > 0 ? (
              terms.map(term => (
                <div key={term} className="flex items-center space-x-2">
                  <Checkbox
                    id={`term-${term}`}
                    checked={selectedTerms.has(term)}
                    onCheckedChange={() => handleToggleTerm(term)}
                  />
                  <label
                    htmlFor={`term-${term}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {term}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">No terms extracted. Select a master file.</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
