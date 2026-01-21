import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '../utils/cn';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    // Explicitly cast to File[] to avoid 'unknown' type errors
    const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(
      file => file.type === 'text/csv' || file.name.endsWith('.csv')
    );
    
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Explicitly cast to File[] to avoid 'unknown' type errors
      const selectedFiles = (Array.from(e.target.files) as File[]).filter(
        file => file.type === 'text/csv' || file.name.endsWith('.csv')
      );
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
    }
  }, [onFilesSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer overflow-hidden group",
        isDragActive 
          ? "border-primary-500 bg-primary-50" 
          : "border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50"
      )}
    >
      <input
        type="file"
        multiple
        accept=".csv"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleFileInput}
      />
      
      <div className="flex flex-col items-center space-y-4 text-center p-6 z-0 pointer-events-none">
        <div className={cn(
          "p-4 rounded-full transition-colors",
          isDragActive ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500"
        )}>
          <UploadCloud className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-700">
            {isDragActive ? "Drop files now" : "Click or drag CSV files here"}
          </p>
          <p className="text-sm text-slate-500">
            Support for standard CSV format. Drag multiple files to merge.
          </p>
        </div>
      </div>
    </div>
  );
};