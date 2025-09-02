export interface UploadedFile {
  id: string;
  file: File;
  content: string;
}

export interface ResultCell {
  found: boolean;
  matches?: { lineNumber: number; context: string }[];
}

export interface ComparisonResult {
  terms: string[];
  files: UploadedFile[];
  matrix: Map<string, ResultCell>; // Key is `${term}-${file.id}`
}
