import React, { useState, useRef, useEffect } from 'react';
import { BotConfiguration, Department } from '../types';
import { DEPARTMENT_DEFAULTS } from '../constants';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  FileCode, 
  Database, 
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  Plus,
  Bot
} from 'lucide-react';

interface DepartmentHubProps {
  config: BotConfiguration;
  onUpdate: (newConfig: BotConfiguration) => void;
}

export const DepartmentHub: React.FC<DepartmentHubProps> = ({ config, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const processFiles = async (newFiles: File[]) => {
    setError(null);
    setIsProcessing(true);
    const MAX_WORDS_PER_DOC = 5000;
    const validFiles: { id: string, name: string, chunks: number, size: number, department: string }[] = [];
    let newKnowledgeBase = config.knowledgeBase || '';
    
    for (const file of newFiles) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const fileId = Math.random().toString(36).substring(2, 9);

      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsText(file);
        });
        
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount > MAX_WORDS_PER_DOC) {
          setError(`File "${file.name}" exceeds the ${MAX_WORDS_PER_DOC} word limit.`);
          continue;
        }
        
        const estimatedChunks = Math.max(1, Math.ceil(wordCount / 250));
        validFiles.push({ id: fileId, name: file.name, chunks: estimatedChunks, size: file.size, department: config.department || 'General' });
        newKnowledgeBase += `\n\n--- Content from ${file.name} ---\n${text}`;
      } else {
        const estimatedChunks = Math.floor(Math.random() * 15) + 5;
        validFiles.push({ id: fileId, name: file.name, chunks: estimatedChunks, size: file.size, department: config.department || 'General' });
        newKnowledgeBase += `\n\n--- Content from ${file.name} ---\n[Simulated extracted text from document]`;
      }
    }

    setIsProcessing(false);

    if (validFiles.length > 0) {
      onUpdate({
        ...config,
        uploadedDocuments: [...(config.uploadedDocuments || []), ...validFiles],
        knowledgeBase: newKnowledgeBase.trim()
      });
    }
  };
  
  const handleDepartmentChange = (department: Department) => {
    onUpdate({
      ...config,
      department,
      ...(DEPARTMENT_DEFAULTS[department] || {}),
      systemInstruction: '' // Reset instruction so user regenerates it for the new service
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleExportAuditLog = () => {
    alert("Exporting audit log for " + (config.department || "General") + "...");
    // In a real app, this would generate a CSV/PDF download
  };

  const handleRemoveFile = (idToRemove: string) => {
    const fileToRemove = (config.uploadedDocuments || []).find(doc => doc.id === idToRemove);
    if (!fileToRemove) return;

    const newUploadedDocuments = (config.uploadedDocuments || []).filter(doc => doc.id !== idToRemove);
    
    // Remove content from knowledge base
    let newKnowledgeBase = config.knowledgeBase || '';
    const contentMarker = `\n\n--- Content from ${fileToRemove.name} ---\n`;
    const startIndex = newKnowledgeBase.indexOf(contentMarker);
    
    if (startIndex !== -1) {
      let endIndex = newKnowledgeBase.indexOf('\n\n--- Content from ', startIndex + contentMarker.length);
      if (endIndex === -1) {
        endIndex = newKnowledgeBase.length;
      }
      newKnowledgeBase = newKnowledgeBase.substring(0, startIndex) + newKnowledgeBase.substring(endIndex);
    }
    
    onUpdate({
      ...config,
      uploadedDocuments: newUploadedDocuments,
      knowledgeBase: newKnowledgeBase.trim()
    });
  };

  const docs = (config.uploadedDocuments || []).filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <div className="p-2 bg-red-50 text-red-500 rounded-lg"><FileText className="w-5 h-5" /></div>;
    if (ext === 'csv' || ext === 'xlsx') return <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Database className="w-5 h-5" /></div>;
    if (ext === 'docx' || ext === 'doc') return <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FileCode className="w-5 h-5" /></div>;
    return <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><LinkIcon className="w-5 h-5" /></div>;
  };

  const getFileType = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'Structured PDF';
    if (ext === 'csv') return 'Dataset';
    if (ext === 'docx' || ext === 'doc') return 'Document';
    return 'Direct Link';
  };

  const getStatusPill = (id: string) => {
    // Mocking status based on ID for visual variety
    const statuses = [
      { label: 'Processed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
      { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
      { label: 'Failed', color: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500' }
    ];
    const status = statuses[id.charCodeAt(0) % 3];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
        {status.label}
      </span>
    );
  };

  const getConfidentialityPill = (id: string) => {
    const levels = ['RESTRICTED_L3', 'CONFIDENTIAL', 'INTERNAL_USE'];
    const level = levels[id.charCodeAt(0) % 3];
    return (
      <span className="px-2 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded text-[9px] font-bold tracking-[0.1em]">
        {level}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8f9fc]">
      {/* Hero Banner */}
      <div className="relative w-full bg-white overflow-hidden border-b border-slate-200">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?q=80&w=2342&auto=format&fit=crop" 
            alt="Modern Office Interior" 
            className="w-full h-full object-cover object-center opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>

        {/* Banner Content */}
        <div className="relative z-10 px-6 lg:px-8 py-8 lg:py-12 max-w-6xl mx-auto w-full">
          <div className="text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              Knowledge Base
            </h2>
            <p className="text-slate-600 text-sm lg:text-base max-w-xl">
              Manage knowledge base documents and settings for <strong className="text-blue-600">{config.department || 'your service'}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Persistent Service Selector (Matching BotConfigurator) */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto w-full px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Target Service</h3>
              <p className="text-xs text-slate-500">Choose which service's documents this assistant will learn from</p>
            </div>
          </div>
          <div className="relative min-w-[280px]">
            <select 
              className="w-full appearance-none rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm cursor-pointer"
              value={config.department}
              onChange={(e) => handleDepartmentChange(e.target.value as Department)}
            >
              <option value="">Select a Service...</option>
              {Object.values(Department).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center justify-end gap-4 mb-6">
            <button 
              onClick={handleExportAuditLog}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95 group"
            >
              <Download className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              Export Audit Log
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Add New Source
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              multiple 
            />
          </div>

          {/* Search and Table Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Integrated Info Bar */}
            <div className="px-6 py-4 bg-blue-50/30 border-b border-slate-100 flex items-center gap-3">
              <Bot className="w-4 h-4 text-blue-500" />
              <p className="text-[11px] font-medium text-slate-600">
                The AI chatbot generates its answers to customers by referencing the documents from your service you provided.
              </p>
            </div>

            {/* Search Bar Row */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search knowledge sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-10 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => alert('Filter options for ' + config.department + ' coming soon.')}
                    className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => alert('Additional management options coming soon.')}
                    className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="divide-y divide-slate-100/50">
              {docs.length === 0 ? (
                <div className="py-40 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Search className="w-12 h-12 text-slate-200" />
                  </div>
                  <h3 className="text-slate-900 text-xl font-bold tracking-tight">No sources found</h3>
                  <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto">
                    The AI chatbot generates its answers by referencing the documents you provide. Add a new source to get started.
                  </p>
                </div>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="grid grid-cols-[3fr,1fr,40px] gap-x-8 px-10 py-5 items-center hover:bg-slate-50/30 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        {getFileIcon(doc.name)}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-slate-50 flex items-center justify-center">
                          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-slate-400">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                          <span className="opacity-30">•</span>
                          <span className="text-blue-500/70 font-bold uppercase tracking-tighter">{config.department || 'General'}</span>
                          <span className="opacity-30">•</span>
                          <span className="uppercase tracking-widest opacity-60">ID: {doc.id.slice(0, 4)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      {getStatusPill(doc.id)}
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleRemoveFile(doc.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Pagination */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Showing 1 to {docs.length} of {docs.length} Sources
              </span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => alert('Pagination is not implemented in this demo.')}
                  className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button 
                  onClick={() => alert('Pagination is not implemented in this demo.')}
                  className="flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
