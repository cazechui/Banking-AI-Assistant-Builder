import React, { useState } from 'react';
import { BotConfiguration, Department } from '../types';

interface DepartmentHubProps {
  config: BotConfiguration;
  onUpdate: (newConfig: BotConfiguration) => void;
}

export const DepartmentHub: React.FC<DepartmentHubProps> = ({ config, onUpdate }) => {
  const [sortBy, setSortBy] = useState<'department' | 'name' | 'size'>('department');

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

  const currentDepartment = config.department || 'No Department Selected';
  
  const docs = [...(config.uploadedDocuments || [])].sort((a, b) => {
    if (sortBy === 'department') {
      const deptA = a.department || '';
      const deptB = b.department || '';
      return deptA.localeCompare(deptB);
    }
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return b.size - a.size;
    return 0;
  });

  return (
    <div className="p-4 lg:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Department Hub</h2>
          <p className="text-slate-500 mt-2 text-sm">Manage knowledge base documents and settings for <strong className="text-blue-600">{currentDepartment}</strong>.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Department Documents</h3>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border-slate-200 rounded-lg text-slate-600 bg-slate-50 px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="department">Sort by Department</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full">
              {docs.length} {docs.length === 1 ? 'File' : 'Files'}
            </span>
          </div>
        </div>
        
        <div className="p-6 lg:p-8">
          {docs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h4 className="text-slate-700 font-medium mb-1">No documents uploaded yet</h4>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Go to the Bot Configurator tab to upload policy documents, FAQs, and rate sheets for this department.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all group">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{doc.name}</h4>
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        {doc.department}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                        {doc.chunks} Vector Chunks
                      </span>
                      <span>•</span>
                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFile(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove from knowledge base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
