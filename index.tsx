import { createIcons, icons } from 'lucide';
import { v4 as uuidv4 } from 'uuid';
import { mergeFiles, downloadCSV } from './utils/csvUtils';
import { summarizeCSV } from './services/geminiService';
import { CSVFile } from './types';

// Initialize Lucide icons
const initIcons = () => createIcons({ icons });

// State
let stagedFiles: CSVFile[] = [];
let mergeResult: { data: string; rowCount: number; fileName: string } | null = null;

// DOM Elements
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileListContainer = document.getElementById('file-list-container') as HTMLDivElement;
const fileList = document.getElementById('file-list') as HTMLUListElement;
const fileCountSpan = document.getElementById('file-count') as HTMLSpanElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const mergeBtn = document.getElementById('merge-btn') as HTMLButtonElement;
const errorMsg = document.getElementById('error-msg') as HTMLDivElement;
const errorText = document.getElementById('error-text') as HTMLSpanElement;

const resultCard = document.getElementById('result-card') as HTMLDivElement;
const resultRows = document.getElementById('result-rows') as HTMLSpanElement;
const resultFilename = document.getElementById('result-filename') as HTMLSpanElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const summarizeBtn = document.getElementById('summarize-btn') as HTMLButtonElement;
const aiResult = document.getElementById('ai-result') as HTMLDivElement;
const aiSummaryText = document.getElementById('ai-summary-text') as HTMLParagraphElement;
const aiKeywords = document.getElementById('ai-keywords') as HTMLDivElement;

// Helper: Format Bytes
const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Render File List
const renderFiles = () => {
    fileList.innerHTML = '';
    fileCountSpan.textContent = stagedFiles.length.toString();

    if (stagedFiles.length > 0) {
        fileListContainer.classList.remove('hidden');
        mergeBtn.disabled = stagedFiles.length < 2;
    } else {
        fileListContainer.classList.add('hidden');
        mergeBtn.disabled = true;
    }

    stagedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors';
        li.innerHTML = `
            <div class="flex items-center min-w-0 flex-1 mr-4">
                <div class="w-8 h-8 rounded-lg bg-primary-50 flex-shrink-0 flex items-center justify-center text-primary-600 mr-3 font-mono text-xs font-bold">
                    ${index + 1}
                </div>
                <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">${file.name}</p>
                    <p class="text-xs text-slate-500">${formatSize(file.size)}</p>
                </div>
            </div>
            <button class="remove-file-btn p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" data-id="${file.id}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        fileList.appendChild(li);
    });
    
    // Re-init icons for new elements
    initIcons();

    // Attach listeners to remove buttons
    document.querySelectorAll('.remove-file-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLButtonElement).dataset.id;
            if (id) removeFile(id);
        });
    });
};

const addFiles = (files: File[]) => {
    const newFiles = files.map(f => ({
        id: uuidv4(),
        file: f,
        name: f.name,
        size: f.size
    }));
    stagedFiles = [...stagedFiles, ...newFiles];
    
    // Reset results when files change
    mergeResult = null;
    resultCard.classList.add('hidden');
    errorMsg.classList.add('hidden');
    
    renderFiles();
};

const removeFile = (id: string) => {
    stagedFiles = stagedFiles.filter(f => f.id !== id);
    mergeResult = null;
    resultCard.classList.add('hidden');
    renderFiles();
};

// Event Listeners
fileInput.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
        const files = Array.from(input.files).filter(f => f.name.endsWith('.csv'));
        addFiles(files);
        input.value = ''; // Reset
    }
});

clearBtn.addEventListener('click', () => {
    stagedFiles = [];
    mergeResult = null;
    resultCard.classList.add('hidden');
    errorMsg.classList.add('hidden');
    renderFiles();
});

mergeBtn.addEventListener('click', async () => {
    if (stagedFiles.length < 2) return;
    
    const originalText = mergeBtn.innerHTML;
    mergeBtn.disabled = true;
    mergeBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Processing...`;
    initIcons();
    errorMsg.classList.add('hidden');

    try {
        // Small delay to allow UI update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        mergeResult = await mergeFiles(stagedFiles);
        
        // Show result
        resultRows.textContent = mergeResult.rowCount.toLocaleString();
        resultFilename.textContent = mergeResult.fileName;
        resultCard.classList.remove('hidden');
        
        // Reset AI part
        aiResult.classList.add('hidden');
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML = `<i data-lucide="bot" class="w-4 h-4 mr-2 text-purple-500"></i> Summarize with Gemini`;

        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth' });

    } catch (err: any) {
        errorText.textContent = err.message || "Merge failed";
        errorMsg.classList.remove('hidden');
    } finally {
        mergeBtn.disabled = false;
        mergeBtn.innerHTML = originalText;
        initIcons(); // Re-render icon
    }
});

downloadBtn.addEventListener('click', () => {
    if (mergeResult) {
        downloadCSV(mergeResult.data, mergeResult.fileName);
    }
});

summarizeBtn.addEventListener('click', async () => {
    if (!mergeResult) return;

    const originalText = summarizeBtn.innerHTML;
    summarizeBtn.disabled = true;
    summarizeBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Analyzing...`;
    initIcons();

    try {
        const snippet = mergeResult.data.substring(0, 3000);
        const summary = await summarizeCSV(snippet);
        
        aiSummaryText.textContent = summary.summary;
        aiKeywords.innerHTML = summary.keywords.map(k => 
            `<span class="px-2 py-0.5 bg-white text-purple-700 rounded-md border border-purple-200 text-xs font-medium">#${k}</span>`
        ).join('');
        
        aiResult.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        alert("Failed to generate summary. Check console.");
    } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML = originalText;
        initIcons();
    }
});

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary-500', 'bg-primary-50');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary-500', 'bg-primary-50');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary-500', 'bg-primary-50');
    if (e.dataTransfer?.files.length) {
        const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
        addFiles(files);
    }
});

// Initial load
initIcons();