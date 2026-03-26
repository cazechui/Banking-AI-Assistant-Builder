
import React, { useState } from 'react';
import { Sliders, Layers, BarChart3, History, Settings, LucideIcon, MessageSquare, Github, Bot, Shield, Database } from 'lucide-react';
import { BotConfigurator } from './components/BotConfigurator';
import { ChatPreview } from './components/ChatPreview';
import { DepartmentHub } from './components/DepartmentHub';
import { BotConfiguration } from './types';
import { DEFAULT_CONFIG } from './constants';

// Mock Analytics Component
const AnalyticsDashboard = ({ config }: { config: BotConfiguration }) => (
  <div className="flex flex-col min-h-full pb-10">
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
      <div className="relative z-10 px-4 lg:px-8 py-8 lg:py-12 max-w-4xl mx-auto w-full flex flex-col items-start text-left">
        <h2 className="text-xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Performance Analytics
        </h2>
        <p className="text-slate-600 text-sm lg:text-base max-w-xl">
          Monitor chatbot performance and user interactions for <strong className="text-blue-600">{config.department || 'your service'}</strong>.
        </p>
      </div>
    </div>

    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-2">
        <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2.5">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Quarter</option>
        </select>
      </div>
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Sessions</p>
        <p className="text-3xl font-bold text-slate-800 mt-2">1,248</p>
        <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          12% vs last week
        </div>
      </div>
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Escalation Rate</p>
        <p className="text-3xl font-bold text-slate-800 mt-2">8.4%</p>
        <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          -2.1% improvement
        </div>
      </div>
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Avg. CSAT Score</p>
        <p className="text-3xl font-bold text-slate-800 mt-2">4.8<span className="text-lg text-slate-400 font-normal">/5</span></p>
        <div className="flex items-center mt-2 text-xs text-slate-500 font-medium">
           Based on 850 reviews
        </div>
      </div>
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Avg. Response Time</p>
        <p className="text-3xl font-bold text-slate-800 mt-2">1.2s</p>
        <div className="flex items-center mt-2 text-xs text-blue-600 font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          +0.1s slower
        </div>
      </div>
    </div>

    {/* Charts Area */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Top User Intents</h3>
        <div className="space-y-4">
          {[
            { label: 'Check Balance', width: '85%', val: '45%' },
            { label: 'Transaction History', width: '65%', val: '28%' },
            { label: 'Report Fraud', width: '35%', val: '12%' },
            { label: 'Branch Location', width: '25%', val: '8%' },
            { label: 'Other', width: '15%', val: '7%' },
          ].map((item, i) => (
             <div key={i}>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-slate-600">{item.label}</span>
                 <span className="font-medium text-slate-800">{item.val}</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2.5">
                 <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: item.width }}></div>
               </div>
             </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Escalation Reasons</h3>
        <div className="flex items-center justify-center h-48">
           <div className="text-center text-slate-400 text-sm italic">
             Visual Chart Placeholder <br/>
             (Integration with Analytics API required)
           </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
           <div className="text-center p-3 bg-red-50 rounded-lg">
             <div className="text-red-800 font-bold text-lg">62%</div>
             <div className="text-xs text-red-600">Compliance Flag</div>
           </div>
           <div className="text-center p-3 bg-blue-50 rounded-lg">
             <div className="text-blue-800 font-bold text-lg">28%</div>
             <div className="text-xs text-blue-600">Negative Sentiment</div>
           </div>
        </div>
      </div>
    </div>
  </div>
  </div>
);

const PlaceholderView = ({ title, config }: { title: string; config: BotConfiguration }) => (
  <div className="flex flex-col min-h-full pb-10">
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
      <div className="relative z-10 px-4 lg:px-8 py-8 lg:py-12 max-w-4xl mx-auto w-full flex flex-col items-start text-left">
        <h2 className="text-xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          {title}
        </h2>
        <p className="text-slate-600 text-sm lg:text-base max-w-xl">
          Configure {title.toLowerCase()} for <strong className="text-blue-600">{config.department || 'your department'}</strong>.
        </p>
      </div>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
      <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2">This module is coming soon.</p>
    </div>
  </div>
);

export default function App() {
  const [config, setConfig] = useState<BotConfiguration>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(true);

  return (
    <div className="flex h-[100dvh] w-full bg-[#f8f9fc] text-slate-900 font-sans flex-col">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block w-20 flex-shrink-0 z-30 relative group/sidebar">
          <div className="absolute inset-y-0 left-0 w-20 hover:w-64 transition-all duration-300 ease-in-out bg-white py-8 flex flex-col justify-between border-r border-slate-100 shadow-xl overflow-hidden">
            <div className="flex flex-col gap-10 w-full">
              {/* Nav Items */}
              <nav className="flex flex-col gap-2 w-full px-3">
                <NavButton 
                  active={activeTab === 'config'} 
                  onClick={() => setActiveTab('config')} 
                  icon={Bot}
                  label="Assistant Config"
                />
                <NavButton 
                  active={activeTab === 'departments'} 
                  onClick={() => setActiveTab('departments')} 
                  icon={Database}
                  label="Knowledge Base"
                />
                <NavButton 
                  active={activeTab === 'analytics'} 
                  onClick={() => setActiveTab('analytics')} 
                  icon={BarChart3}
                  label="Analytics"
                />
                <NavButton 
                  active={activeTab === 'settings'} 
                  onClick={() => setActiveTab('settings')} 
                  icon={Settings}
                  label="Settings"
                />
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-4 w-full px-3">
              <div className="flex items-center gap-4 px-2 py-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center text-blue-700 font-semibold text-sm">
                   JD
                </div>
                <div className="flex flex-col opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 overflow-hidden">
                  <span className="text-sm font-bold text-slate-800 whitespace-nowrap">John Doe</span>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">Admin Account</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area: Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Left Panel: Dynamic Content based on Tab */}
          <div className={`w-full lg:w-7/12 h-full overflow-y-auto bg-[#f8f9fc] scrollbar-hide ${showPreviewOnMobile ? 'hidden lg:block' : 'block'}`}>
            {activeTab === 'config' && (
               <BotConfigurator 
                config={config} 
                onUpdate={setConfig} 
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                onGoToPreview={() => setShowPreviewOnMobile(true)}
                onNavigateToKnowledgeBase={() => setActiveTab('departments')}
              />
            )}
            {activeTab === 'analytics' && <AnalyticsDashboard config={config} />}
            {activeTab === 'departments' && <DepartmentHub config={config} onUpdate={setConfig} />}
            {activeTab === 'history' && <PlaceholderView title="Version History" config={config} />}
            {activeTab === 'settings' && <PlaceholderView title="Settings" config={config} />}
            
            {/* Footer Credit for Left Panel */}
            <div className="p-8 text-center border-t border-slate-100 space-y-4">
              <p className="text-[10px] lg:text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                This is a personal portfolio prototype. Do not enter real personal or financial information.
              </p>
              <div className="flex items-center justify-center gap-4">
                <p className="text-xs text-slate-400">
                  Built by <a href="https://linkedin.com/in/cazechui" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">Caze Chui</a>
                </p>
                <div className="w-px h-3 bg-slate-200"></div>
                <a 
                  href="https://github.com/cazechui" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </div>

          {/* Right Panel: Preview (Always visible for Config, optional for others) */}
          <div className={`w-full lg:w-5/12 h-full bg-[#f8f9fc] border-l border-slate-100 z-10 flex-col p-2 lg:p-4 ${showPreviewOnMobile ? 'flex' : 'hidden lg:flex'}`}>
            <div className="w-full h-full bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col relative">
              <ChatPreview config={config} onGoToConfig={() => setShowPreviewOnMobile(false)} />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden flex items-center justify-around bg-white border-t border-slate-200 p-2 pb-4 z-40 shrink-0">
        <MobileNavButton active={activeTab === 'config' && !showPreviewOnMobile} onClick={() => {setActiveTab('config'); setShowPreviewOnMobile(false);}} icon={Sliders} label="Config" />
        <MobileNavButton active={activeTab === 'departments' && !showPreviewOnMobile} onClick={() => {setActiveTab('departments'); setShowPreviewOnMobile(false);}} icon={Layers} label="Depts" />
        <MobileNavButton active={activeTab === 'analytics' && !showPreviewOnMobile} onClick={() => {setActiveTab('analytics'); setShowPreviewOnMobile(false);}} icon={BarChart3} label="Stats" />
        <MobileNavButton active={showPreviewOnMobile} onClick={() => setShowPreviewOnMobile(true)} icon={MessageSquare} label="Chatbot Preview" />
      </div>
    </div>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: LucideIcon, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-2 ${
        active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon className="w-5 h-5 mb-1" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: LucideIcon, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 w-full px-3.5 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      <Icon className={`w-6 h-6 shrink-0 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
      <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 overflow-hidden`}>
        {label}
      </span>
    </button>
  );
}
