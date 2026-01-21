import Papa from 'papaparse';
import { CSVFile, MergeResult } from '../types';

export const parseFile = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, // We want arrays of strings to handle the merge manually
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as string[][]);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

export const mergeFiles = async (files: CSVFile[]): Promise<MergeResult> => {
  if (files.length === 0) {
    throw new Error("No files to merge.");
  }

  try {
    const allDataPromises = files.map(f => parseFile(f.file));
    const allParsedData = await Promise.all(allDataPromises);

    let mergedRows: string[][] = [];

    // Process first file (keep headers)
    if (allParsedData.length > 0 && allParsedData[0].length > 0) {
      mergedRows = [...allParsedData[0]];
    }

    // Process subsequent files (skip first row/header)
    for (let i = 1; i < allParsedData.length; i++) {
      const fileData = allParsedData[i];
      if (fileData.length > 1) {
        // Slice(1) to remove header, spread to append
        mergedRows.push(...fileData.slice(1));
      }
    }

    const csvString = Papa.unparse(mergedRows);
    
    // Generate a default filename based on the first file + count
    const baseName = files[0].name.replace('.csv', '');
    const fileName = `${baseName}_merged_${files.length}_files.csv`;

    return {
      data: csvString,
      rowCount: mergedRows.length,
      fileName
    };
  } catch (err) {
    console.error("Merge error", err);
    throw new Error("Failed to merge files. Ensure all are valid CSVs.");
  }
};

export const downloadCSV = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};