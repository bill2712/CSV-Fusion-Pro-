export interface CSVFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview?: string[][]; // First few rows for preview
}

export enum MergeStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface MergeResult {
  data: string; // The raw CSV string
  rowCount: number;
  fileName: string;
}

export interface AISummary {
  summary: string;
  keywords: string[];
}
