
import React, { useState } from 'react';
import { BotConfiguration, Department, EscalationTrigger } from '../types';
import { DEPARTMENT_DEFAULTS, INITIAL_GUARDRAILS, ESCALATION_OPTIONS, BANKING_TOOLS } from '../constants';
import { generateSystemPrompt } from '../services/geminiService';

interface BotConfiguratorProps {
  config: BotConfiguration;
  onUpdate: (newConfig: BotConfiguration) => void;
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
  onGoToPreview?: () => void;
}

export const BotConfigurator: React.FC<BotConfiguratorProps> = ({ 
  config, 
  onUpdate, 
  isGenerating,
  setIsGenerating,
  onGoToPreview
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<{status: 'idle' | 'chunking' | 'embedding', filename: string}>({status: 'idle', filename: ''});

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const processFiles = async (newFiles: File[]) => {
    setError(null);
    const MAX_WORDS_PER_DOC = 5000;
    const validFiles: { id: string, name: string, chunks: number, size: number, department: string }[] = [];
    let newKnowledgeBase = config.knowledgeBase || '';
    
    for (const file of newFiles) {
      setProcessingState({ status: 'chunking', filename: file.name });
      
      // Simulate chunking delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingState({ status: 'embedding', filename: file.name });
      
      // Simulate vector embedding delay
      await new Promise(resolve => setTimeout(resolve, 1200));

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
          continue; // Skip this file
        }
        
        const estimatedChunks = Math.max(1, Math.ceil(wordCount / 250)); // roughly 250 words per chunk
        validFiles.push({ id: fileId, name: file.name, chunks: estimatedChunks, size: file.size, department: config.department || 'General' });
        newKnowledgeBase += `\n\n--- Content from ${file.name} ---\n${text}`;
      } else {
        // For simulated non-text files, we just accept them for demo purposes
        const estimatedChunks = Math.floor(Math.random() * 15) + 5; // Fake chunk count between 5 and 20
        validFiles.push({ id: fileId, name: file.name, chunks: estimatedChunks, size: file.size, department: config.department || 'General' });
        newKnowledgeBase += `\n\n--- Content from ${file.name} ---\n[Simulated extracted text from document]`;
      }
    }

    setProcessingState({ status: 'idle', filename: '' });

    if (validFiles.length > 0) {
      onUpdate({
        ...config,
        uploadedDocuments: [...(config.uploadedDocuments || []), ...validFiles],
        knowledgeBase: newKnowledgeBase.trim()
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
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

  const handleDepartmentChange = (department: Department) => {
    onUpdate({
      ...config,
      department,
      ...(DEPARTMENT_DEFAULTS[department] || {}),
      systemInstruction: '' // Reset instruction so user regenerates it for the new department
    });
  };

  const handleGenerateInstruction = async () => {
    setError(null);
    if (!config.goal) {
      setError("Please define a primary goal first.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const instruction = await generateSystemPrompt({
        role: config.role,
        tone: config.tone,
        goal: config.goal,
        complianceLevel: config.complianceLevel,
        guardrails: config.guardrails,
        escalationTriggers: config.escalationTriggers,
        handoffDepartment: config.handoffDepartment,
        activeTools: config.activeTools,
        knowledgeBase: config.knowledgeBase,
        model: config.model
      });
      
      onUpdate({
        ...config,
        systemInstruction: instruction
      });
    } catch (error) {
      console.error(error);
      setError("Failed to generate instructions. Check API Key in Settings.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGuardrail = (text: string) => {
    const exists = config.guardrails.includes(text);
    let newGuardrails;
    if (exists) {
      newGuardrails = config.guardrails.filter(g => g !== text);
    } else {
      newGuardrails = [...config.guardrails, text];
    }
    onUpdate({ ...config, guardrails: newGuardrails });
  };

  const toggleEscalation = (trigger: EscalationTrigger) => {
    const exists = config.escalationTriggers.includes(trigger);
    let newTriggers;
    if (exists) {
      newTriggers = config.escalationTriggers.filter(t => t !== trigger);
    } else {
      newTriggers = [...config.escalationTriggers, trigger];
    }
    onUpdate({ ...config, escalationTriggers: newTriggers });
  };

  const toggleTool = (toolId: string) => {
    const exists = config.activeTools.includes(toolId);
    let newTools;
    if (exists) {
      newTools = config.activeTools.filter(t => t !== toolId);
    } else {
      newTools = [...config.activeTools, toolId];
    }
    onUpdate({ ...config, activeTools: newTools });
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Hero Banner */}
      <div className="relative w-full bg-white overflow-hidden border-b border-slate-200">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80" 
            alt="Banking Professional Background" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>

        {/* Banner Content */}
        <div className="relative z-10 px-4 lg:px-8 py-8 lg:py-12 max-w-4xl mx-auto w-full flex flex-col items-start text-left">
          <h2 className="text-xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Financial AI Chatbots
          </h2>
          <p className="text-slate-600 text-sm lg:text-base max-w-xl">
            Create a helpful AI chatbot to assist end customers using your department's specific documents and rules.
          </p>
        </div>
      </div>

      {/* Persistent Department Selector */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Target Department</h3>
              <p className="text-xs text-slate-500">Choose which department's documents this assistant will learn from</p>
            </div>
          </div>
          <div className="relative min-w-[280px]">
            <select 
              className="w-full appearance-none rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm cursor-pointer"
              value={config.department}
              onChange={(e) => handleDepartmentChange(e.target.value as Department)}
            >
              <option value="">Select a Department...</option>
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

      <div className="px-4 lg:px-8 pb-10 pt-8 flex flex-col max-w-4xl mx-auto w-full">
        {error && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-white border-2 border-red-500 text-red-700 px-6 py-4 rounded-2xl flex items-center justify-between shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-sm font-bold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0 ml-4 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        
        {/* SECTION 1: IDENTITY */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Agent Persona & AI Engine</h3>
          </div>
          
          <div className="p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bot Name</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={(e) => onUpdate({...config, name: e.target.value})}
                  className="w-full rounded-2xl bg-slate-50 border-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  placeholder="e.g. NeoBank Assistant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">AI Model</label>
                <select 
                  value={config.model}
                  onChange={(e) => onUpdate({...config, model: e.target.value})}
                  className="w-full rounded-2xl bg-slate-50 border-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</option>
                  <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Next Gen)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (High Intelligence)</option>
                  <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite (Cost Effective)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role / Persona</label>
                <input 
                  type="text" 
                  value={config.role}
                  onChange={(e) => onUpdate({...config, role: e.target.value})}
                  className="w-full rounded-2xl bg-slate-50 border-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  placeholder="e.g. Senior Mortgage Advisor"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center py-2 lg:py-3 opacity-60">
          <svg className="w-6 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>

        {/* SECTION 2: KNOWLEDGE BASE */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">Department Knowledge Base (RAG)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Retrieval-Augmented Generation: The AI generates its answers by referencing the documents you provide.
              </p>
            </div>
          </div>
          <div className="p-6 lg:p-8 space-y-8">
            {/* Prototype Warning */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="text-red-500 mt-0.5 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-800">Important: This is just a test version</h4>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">
                  This tool is currently a prototype for testing. <strong>Please do not upload any real customer info, passwords, or secret company documents.</strong> Instead, try uploading some fake example files or public information to see how it works!
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Department Documents</label>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Upload PDFs, Word docs, or spreadsheets containing product details, rate sheets, and internal policies. <strong className="text-blue-600">Max 5,000 words per document</strong> for optimal retrieval performance.
              </p>
              <div 
                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                  processingState.status !== 'idle' 
                    ? 'border-blue-400 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-blue-50/50 hover:border-blue-300 cursor-pointer group'
                }`}
                onClick={() => processingState.status === 'idle' && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  disabled={processingState.status !== 'idle'}
                />
                
                {processingState.status !== 'idle' ? (
                  <div className="flex flex-col items-center animate-pulse">
                    <div className="p-4 bg-blue-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {processingState.status === 'chunking' ? 'Chunking Document...' : 'Generating Vector Embeddings...'}
                    </span>
                    <span className="text-xs text-slate-500 mt-2">{processingState.filename}</span>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-slate-50 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
                      <svg className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <span className="text-sm font-bold text-blue-600">Click to upload</span>
                    <span className="text-xs text-slate-500 mt-2">or drag and drop files here</span>
                  </>
                )}
              </div>
              {(config.uploadedDocuments || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {(config.uploadedDocuments || []).map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <span className="truncate font-medium">{item.name}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                          {item.chunks} Chunks
                        </span>
                        <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                          {(item.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveFile(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 ml-1"
                        title="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Manual Policy Entry & FAQs</label>
              <textarea 
                value={config.knowledgeBase}
                onChange={(e) => onUpdate({...config, knowledgeBase: e.target.value})}
                rows={4}
                placeholder="e.g. Overdraft fee is $35. ATM withdrawal limit is $500/day. Branch hours are 9am-5pm..."
                className="w-full rounded-2xl bg-slate-50 border-transparent p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-mono leading-relaxed"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-center py-2 lg:py-3 opacity-60">
          <svg className="w-6 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>

        {/* SECTION 3: STRATEGY */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Strategy & Behavior</h3>
          </div>
          <div className="p-6 lg:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Goal</label>
              <textarea 
                value={config.goal}
                onChange={(e) => onUpdate({...config, goal: e.target.value})}
                rows={2}
                placeholder="What is the main purpose of this bot?"
                className="w-full rounded-2xl bg-slate-50 border-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tone of Voice</label>
                <input 
                  type="text" 
                  value={config.tone}
                  onChange={(e) => onUpdate({...config, tone: e.target.value})}
                  className="w-full rounded-2xl bg-slate-50 border-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  placeholder="e.g. Professional, Empathetic"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center py-2 lg:py-3 opacity-60">
          <svg className="w-6 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>

        {/* SECTION 4: AGENT SKILLS (TOOLS) */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Agent Skills & Tools</h3>
          </div>
          <div className="p-6 lg:p-8 space-y-6">
            <p className="text-sm text-slate-600 mb-4">
              Enable "Agentic" capabilities. When enabled, the bot can call these tools to perform actions or fetch real-time data.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {BANKING_TOOLS.map((tool) => {
                const isActive = config.activeTools.includes(tool.id);
                return (
                  <div 
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                       isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400'
                    }`}>
                       {isActive && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div>
                      <h4 className={`font-mono text-sm font-bold ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                        {tool.name}()
                      </h4>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{tool.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex justify-center py-2 lg:py-3 opacity-60">
          <svg className="w-6 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>

         {/* SECTION 5: ESCALATION & HANDOFF */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Human Handoff & Escalation</h3>
          </div>
          <div className="p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Department for Handoff</label>
                <input 
                  type="text" 
                  value={config.handoffDepartment}
                  onChange={(e) => onUpdate({...config, handoffDepartment: e.target.value})}
                  className="w-full rounded-2xl bg-slate-50 border-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  placeholder="e.g. Customer Support, Fraud Team, Senior Advisors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-3">Escalation Triggers</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ESCALATION_OPTIONS.map((opt) => {
                     const isActive = config.escalationTriggers.includes(opt.id);
                     return (
                      <div 
                        key={opt.id}
                        onClick={() => toggleEscalation(opt.id)}
                        className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative ${
                          isActive 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-100 hover:bg-slate-50 bg-white'
                        }`}
                      >
                         <div className="flex items-start justify-between mb-2">
                            <span className={`font-bold text-sm ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>{opt.label}</span>
                            {isActive && <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                         </div>
                         <p className={`text-xs leading-relaxed ${isActive ? 'text-blue-700/80' : 'text-slate-500'}`}>{opt.description}</p>
                      </div>
                     );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center py-2 lg:py-3 opacity-60">
          <svg className="w-6 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>

        {/* SECTION 6: SECURITY */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Safety & Compliance</h3>
          </div>
          <div className="p-6 lg:p-8 space-y-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Compliance Level</label>
              <div className="flex gap-4">
                {['Standard', 'Strict', 'High-Security'].map((level) => (
                  <label key={level} className={`flex-1 relative flex cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                    config.complianceLevel === level ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="compliance-level" 
                      value={level} 
                      className="sr-only" 
                      checked={config.complianceLevel === level}
                      onChange={(e) => onUpdate({...config, complianceLevel: e.target.value as any})}
                    />
                    <div className="flex flex-col">
                      <span className={`block text-sm font-bold ${config.complianceLevel === level ? 'text-blue-900' : 'text-slate-700'}`}>{level}</span>
                      <span className={`block text-xs mt-1 leading-relaxed ${config.complianceLevel === level ? 'text-blue-700/80' : 'text-slate-500'}`}>
                        {level === 'Standard' ? 'Basic PII filtering' : level === 'Strict' ? 'No financial advice' : 'Max lockdown'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Active Guardrails</label>
              <div className="grid grid-cols-1 gap-3">
                {INITIAL_GUARDRAILS.map((g, idx) => {
                  const isActive = config.guardrails.includes(g);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleGuardrail(g)}
                      className={`relative flex items-center px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isActive 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors ${
                        isActive ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200' : 'bg-slate-100 border-transparent text-slate-400'
                      }`}>
                         {isActive && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`ml-4 text-sm ${isActive ? 'text-blue-900 font-bold' : 'text-slate-600 font-medium'}`}>{g}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center py-2 lg:py-3 opacity-60">
          <svg className="w-6 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>

        {/* SECTION 7: CORE SYSTEM */}
        <section className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden relative">
          <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-xl text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-white text-lg">AI Core Directives</h3>
            </div>
            
            <div className="flex items-center gap-2">
              {onGoToPreview && config.systemInstruction && (
                <button
                  onClick={onGoToPreview}
                  className="lg:hidden flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Chatbot Preview
                </button>
              )}
              <button 
                onClick={handleGenerateInstruction}
                disabled={isGenerating}
                className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Generate Directives
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="p-0">
             <div className="relative">
              <textarea 
                value={config.systemInstruction}
                onChange={(e) => onUpdate({...config, systemInstruction: e.target.value})}
                rows={12}
                className="w-full p-6 lg:p-8 text-sm font-mono bg-transparent text-slate-300 focus:outline-none resize-none leading-relaxed custom-scrollbar"
                placeholder="// Generate directives to see the system prompt here..."
              />
              <div className="absolute bottom-4 right-6 text-xs text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm">
                {config.systemInstruction.length} chars
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
