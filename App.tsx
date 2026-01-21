import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { Button } from './components/Button';
import { CSVFile, MergeStatus, MergeResult, AISummary } from './types';
import { mergeFiles, downloadCSV } from './utils/csvUtils';
import { summarizeCSV } from './services/geminiService';
import { 
  FileText, 
  Trash2, 
  Merge, 
  Download, 
  RefreshCw, 
  Bot, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [files, setFiles] = useState<CSVFile[]>([]);
  const [status, setStatus] = useState<MergeStatus>(MergeStatus.IDLE);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    const csvFiles: CSVFile[] = newFiles.map(f => ({
      id: uuidv4(),
      file: f,
      name: f.name,
      size: f.size
    }));
    setFiles(prev => [...prev, ...csvFiles]);
    // Reset state when new files are added
    setResult(null);
    setAiSummary(null);
    setStatus(MergeStatus.IDLE);
    setErrorMsg(null);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResult(null);
    setAiSummary(null);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setStatus(MergeStatus.PROCESSING);
    setErrorMsg(null);

    try {
      // Small delay to let UI show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      const mergeResult = await mergeFiles(files);
      setResult(mergeResult);
      setStatus(MergeStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during the merge.");
      setStatus(MergeStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadCSV(result.data, result.fileName);
    }
  };

  const handleSummarize = async () => {
    if (!result) return;
    setIsSummarizing(true);
    try {
      // Take the first 3000 chars roughly to avoid token limits, enough for header + ~20 rows
      const snippet = result.data.substring(0, 3000);
      const summary = await summarizeCSV(snippet);
      setAiSummary(summary);
    } catch (e) {
      console.error(e);
      // Optional: show a toast or error state for AI failure
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setStatus(MergeStatus.IDLE);
    setAiSummary(null);
    setErrorMsg(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Merge className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              CSV Fusion Pro
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Secure, Client-side Merging
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Hero / Instructions */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Merge multiple CSVs in seconds.
          </h2>
          <p className="text-lg text-slate-600">
            Combine datasets with identical headers instantly. Data stays on your device.
          </p>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & List */}
          <div className="lg:col-span-7 space-y-6">
            <FileUploader onFilesSelected={handleFilesSelected} />
            
            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-medium text-slate-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-primary-500" />
                    Staged Files ({files.length})
                  </h3>
                  <button 
                    onClick={handleReset} 
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={file.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                      <div className="flex items-center min-w-0 flex-1 mr-4">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex-shrink-0 flex items-center justify-center text-primary-600 mr-4 font-mono text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions & Results */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Action Card */}
            <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Merge Options</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-900 flex items-center mb-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Header Handling
                  </h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    The header row from the <strong>first file</strong> will be preserved. Headers from subsequent files are automatically stripped.
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <Button
                    onClick={handleMerge}
                    disabled={files.length < 2}
                    isLoading={status === MergeStatus.PROCESSING}
                    className="w-full py-3 text-base shadow-primary-500/25 shadow-lg"
                    icon={<Merge className="w-5 h-5" />}
                  >
                    {files.length < 2 ? 'Add at least 2 files' : 'Merge Files'}
                  </Button>
                </div>

                {errorMsg && (
                   <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start mt-4">
                     <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                     {errorMsg}
                   </div>
                )}
              </div>
            </div>

            {/* Success / Result Card */}
            {status === MergeStatus.COMPLETED && result && (
              <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center text-emerald-600">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">Merge Complete!</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Total Rows:</span>
                      <span className="font-mono font-medium">{result.rowCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Output Name:</span>
                      <span className="font-mono font-medium truncate max-w-[150px]" title={result.fileName}>{result.fileName}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleDownload}
                    variant="primary"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download Merged CSV
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">AI Features</span>
                    </div>
                  </div>

                  {!aiSummary ? (
                    <Button
                      onClick={handleSummarize}
                      variant="secondary"
                      className="w-full"
                      isLoading={isSummarizing}
                      icon={<Bot className="w-4 h-4 text-purple-500" />}
                    >
                      Summarize Dataset with Gemini
                    </Button>
                  ) : (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 text-sm space-y-3">
                      <div className="flex items-center text-purple-900 font-semibold mb-1">
                        <Bot className="w-4 h-4 mr-2" />
                        AI Insight
                      </div>
                      <p className="text-purple-800 leading-relaxed">
                        {aiSummary.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {aiSummary.keywords.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white text-purple-700 rounded-md border border-purple-200 text-xs font-medium">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;