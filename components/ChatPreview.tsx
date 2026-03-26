import React, { useState, useRef, useEffect } from 'react';
import { BotConfiguration, ChatMessage, ToolCallData } from '../types';
import { createChatSession, sendMessageToBot } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatPreviewProps {
  config: BotConfiguration;
  onGoToConfig?: () => void;
}

const STORAGE_KEY = 'bankbot_chat_history';
const TOOL_STATE_KEY = 'bankbot_pending_tool';

// Mock Data Generators for Tool Results
const getMockToolResult = (toolName: string, args: any) => {
  switch(toolName) {
    case 'check_balance':
      return { 
        balance: 12450.00, 
        currency: args.currency || 'USD', 
        account_type: args.account_type, 
        status: 'active' 
      };
    case 'transaction_history':
      return {
        transactions: [
          { date: '2023-10-25', merchant: 'Amazon', amount: -45.00 },
          { date: '2023-10-24', merchant: 'Starbucks', amount: -5.40 },
          { date: '2023-10-22', merchant: 'Deposit', amount: 2000.00 },
        ]
      };
    case 'lock_card':
      return {
        success: true,
        status: 'LOCKED',
        timestamp: new Date().toISOString(),
        card_last_4: args.last_4_digits
      };
    case 'schedule_appointment':
      return {
        confirmation_code: 'APT-' + Math.floor(Math.random() * 10000),
        status: 'CONFIRMED',
        location: args.branch_location,
        time: args.date
      };
    default:
      return { status: 'success', message: 'Action completed.' };
  }
};

const ToolCallCard = ({ tool, onApprove }: { tool: ToolCallData, onApprove: () => void }) => (
  <div className="w-full max-w-[85%] mt-1 mb-1">
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2 border-b border-blue-200 pb-1.5">
        <div className="bg-blue-100 p-1 rounded-lg shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
           <h4 className="font-bold text-blue-900 text-xs">Action Request</h4>
           <p className="text-[10px] text-blue-700">The agent wants to execute a function.</p>
        </div>
      </div>
      
      <div className="bg-white/60 rounded-lg p-2 text-[10px] text-blue-900 mb-2 overflow-x-auto">
        <span className="font-bold text-blue-600">{tool.name}</span>
        <span className="text-slate-600">(</span>
        <span className="text-slate-700">{JSON.stringify(tool.args, null, 1).replace(/{|}/g, '').trim()}</span>
        <span className="text-slate-600">)</span>
      </div>

      <button 
        onClick={onApprove}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <span>Approve & Execute</span>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </button>
    </div>
  </div>
);

const EscalationCard = ({ text, department }: { text: string; department: string }) => (
  <div className="w-full max-w-[85%] mt-1">
    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm overflow-hidden mb-1.5">
        <div className="p-3 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
    </div>
    
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 shadow-sm animate-fade-in-up">
      <div className="bg-blue-100 p-1.5 rounded-full shrink-0">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-blue-900 text-xs">Escalation Triggered</h4>
        <p className="text-[10px] text-blue-800 mt-0.5">
           Transferring conversation to the <strong>{department}</strong> service. 
        </p>
        <div className="mt-2 flex gap-1.5">
           <div className="h-1 w-1 bg-blue-500 rounded-full animate-pulse"></div>
           <div className="h-1 w-1 bg-blue-500 rounded-full animate-pulse delay-100"></div>
           <div className="h-1 w-1 bg-blue-500 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  </div>
);

export const ChatPreview: React.FC<ChatPreviewProps> = ({ config, onGoToConfig }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [pendingToolCall, setPendingToolCall] = useState<ToolCallData | null>(null);

  // Load history on mount
  useEffect(() => {
    const savedMsg = localStorage.getItem(STORAGE_KEY);
    const savedTool = localStorage.getItem(TOOL_STATE_KEY);
    
    if (savedTool) {
      try {
        setPendingToolCall(JSON.parse(savedTool));
      } catch(e) { console.error(e); }
    }

    if (savedMsg) {
      try {
        const parsedMessages: ChatMessage[] = JSON.parse(savedMsg);
        const hydratedMessages = parsedMessages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        
        setMessages(hydratedMessages);
        
        // Restore session if we have instructions and messages
        // IMPORTANT: We only attempt to restore if we have valid instructions
        if (config.systemInstruction && hydratedMessages.length > 0) {
           // We pass the history to the session creator so the model has context
           const session = createChatSession(config.systemInstruction, hydratedMessages, config.activeTools, config.model);
           setChatSession(session);
           setIsSessionActive(true);
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []); 

  // Save history & state
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    if (pendingToolCall) {
      localStorage.setItem(TOOL_STATE_KEY, JSON.stringify(pendingToolCall));
    } else {
      localStorage.removeItem(TOOL_STATE_KEY);
    }
  }, [messages, pendingToolCall]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingToolCall]);


  const startSession = () => {
    if (!config.systemInstruction) return;
    try {
      // Clear storage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOOL_STATE_KEY);

      const session = createChatSession(config.systemInstruction, [], config.activeTools, config.model);
      setChatSession(session);
      const initMsg: ChatMessage = {
        id: 'init-' + Date.now(),
        role: 'system',
        text: `Secure connection established with ${config.name} using ${config.model}. Compliance Guardrails active. Tools: ${config.activeTools.length > 0 ? 'Enabled' : 'Disabled'}`,
        timestamp: new Date()
      };
      setMessages([initMsg]);
      setIsSessionActive(true);
      setPendingToolCall(null);
      
    } catch (e) {
      console.error("Failed to start session", e);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setChatSession(null);
    setIsSessionActive(false);
    setPendingToolCall(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOOL_STATE_KEY);
  };

  const processBotResponse = async (response: any) => {
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      
      // 1. Look for function calls
      for (const part of parts) {
        if (part.functionCall) {
          const toolData: ToolCallData = {
            id: Date.now().toString(),
            name: part.functionCall.name,
            args: part.functionCall.args
          };
          
          const toolMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'model',
            toolCall: toolData,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, toolMsg]);
          setPendingToolCall(toolData);
          return; // Stop processing, wait for user approval
        }
      }
      
      // 2. Normal Text Response
      if (response.text) {
        let botText = response.text;
        let isEscalation = false;
        if (botText.startsWith('[ESCALATE]')) {
          isEscalation = true;
          botText = botText.replace('[ESCALATE]', '').trim();
        }
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: botText,
          timestamp: new Date(),
          isEscalation
        };
        setMessages(prev => [...prev, botMsg]);
      }
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    let currentSession = chatSession;
    // Auto-start session if needed
    if (!currentSession) {
       if (config.systemInstruction) {
         currentSession = createChatSession(config.systemInstruction, messages, config.activeTools, config.model);
         setChatSession(currentSession);
         setIsSessionActive(true);
       } else {
         const errorMsg: ChatMessage = {
           id: (Date.now() + 1).toString(),
           role: 'model',
           text: "Please generate AI Core Directives in the configurator first.",
           timestamp: new Date(),
           isError: true
         };
         setMessages(prev => [...prev, errorMsg]);
         return;
       }
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendMessageToBot(currentSession, userMsg.text);
      await processBotResponse(result);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error: Unable to connect to the AI model. Please check your API key.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolApproval = async () => {
    if (!pendingToolCall || !chatSession) return;

    setIsLoading(true);
    const tool = pendingToolCall;
    setPendingToolCall(null); // Clear pending state

    try {
      // 1. Generate Mock Result
      const result = getMockToolResult(tool.name, tool.args);

      // 2. Add Result Message to UI
      const toolResultMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'tool',
        toolResult: {
          id: tool.id,
          name: tool.name,
          result: result
        },
        timestamp: new Date()
      };
      setMessages(prev => [...prev, toolResultMsg]);

      // 3. Send Result back to Model
      const response = await sendMessageToBot(chatSession, { 
        toolResult: { name: tool.name, result: result } 
      });

      // 4. Process the model's follow-up response
      await processBotResponse(response);

    } catch (error) {
      console.error("Tool execution failed", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "System Error: Failed to execute tool action.",
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const exportChatHistory = () => {
    const chatText = messages.map(msg => {
      const time = formatTime(msg.timestamp);
      const role = msg.role === 'user' ? 'User' : msg.role === 'model' ? 'Bot' : 'System';
      return `[${time}] ${role}: ${msg.text || ''}`;
    }).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${config.name || 'bot'}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
           {onGoToConfig && (
             <button onClick={onGoToConfig} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
           )}
           <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
           <div>
             <h3 className="font-bold text-slate-800 text-sm">{config.name || 'Untitled Bot'}</h3>
             <p className="text-xs text-slate-500">{config.role || 'Unassigned Role'}</p>
           </div>
        </div>
        
        <div className="flex gap-2">
           {messages.length > 0 && (
              <>
                <button 
                  onClick={exportChatHistory}
                  title="Export History"
                  className="p-2 rounded-lg bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button 
                  onClick={clearHistory}
                  title="Clear History"
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </>
           )}
           <button 
            onClick={startSession}
            disabled={!config.systemInstruction}
            title="Restart Session"
            className={`p-2 rounded-lg transition-all ${
              !config.systemInstruction 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4 bg-slate-100/50 relative">
        {messages.length === 0 && (
          <>
            {/* Blurred Background Conversation Loop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 blur-[3px] select-none z-0 p-3 lg:p-4">
              <div className="flex flex-col space-y-6 animate-scroll-up">
                 {/* Set 1 */}
                 <div className="flex gap-3 flex-row-reverse">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">ME</div>
                    <div className="px-4 py-2.5 shadow-sm text-sm leading-relaxed bg-blue-600 text-white rounded-2xl rounded-tr-none max-w-[85%]">I need help with my account</div>
                 </div>
                 <div className="flex gap-3 flex-row">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">AI</div>
                    <div className="px-4 py-2.5 shadow-sm text-sm leading-relaxed bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none max-w-[85%]">I can help with that. Could you please provide your account number?</div>
                 </div>
                 <div className="flex gap-3 flex-row-reverse">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">ME</div>
                    <div className="px-4 py-2.5 shadow-sm text-sm leading-relaxed bg-blue-600 text-white rounded-2xl rounded-tr-none max-w-[85%]">I don't know it, I want to speak to a human</div>
                 </div>
                 <div className="flex gap-3 flex-row">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">SYS</div>
                    <div className="w-full max-w-[85%]">
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm overflow-hidden mb-2">
                          <div className="p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">I understand. Let me transfer you to an agent.</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                        <div className="bg-blue-100 p-2 rounded-full shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 text-sm">Escalation Triggered</h4>
                          <p className="text-xs text-blue-800 mt-1">Transferring conversation to <strong>Human Support</strong>.</p>
                        </div>
                      </div>
                    </div>
                 </div>
                 
                 {/* Set 2 (Duplicate for seamless loop) */}
                 <div className="flex gap-3 flex-row-reverse">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">ME</div>
                    <div className="px-4 py-2.5 shadow-sm text-sm leading-relaxed bg-blue-600 text-white rounded-2xl rounded-tr-none max-w-[85%]">I need help with my account</div>
                 </div>
                 <div className="flex gap-3 flex-row">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">AI</div>
                    <div className="px-4 py-2.5 shadow-sm text-sm leading-relaxed bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none max-w-[85%]">I can help with that. Could you please provide your account number?</div>
                 </div>
                 <div className="flex gap-3 flex-row-reverse">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">ME</div>
                    <div className="px-4 py-2.5 shadow-sm text-sm leading-relaxed bg-blue-600 text-white rounded-2xl rounded-tr-none max-w-[85%]">I don't know it, I want to speak to a human</div>
                 </div>
                 <div className="flex gap-3 flex-row">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">SYS</div>
                    <div className="w-full max-w-[85%]">
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm overflow-hidden mb-2">
                          <div className="p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">I understand. Let me transfer you to an agent.</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                        <div className="bg-blue-100 p-2 rounded-full shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 text-sm">Escalation Triggered</h4>
                          <p className="text-xs text-blue-800 mt-1">Transferring conversation to <strong>Human Support</strong>.</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-3 lg:px-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/90 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center mb-4 text-blue-500 border border-blue-100">
                <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 max-w-md w-full">
                <h4 className="text-base font-bold text-slate-800 mb-3">Financial AI Chatbots</h4>
                
                <div className="text-left text-slate-600 text-xs mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  This AI agent uses Retrieval-Augmented Generation (RAG) to securely answer questions based on your internal knowledge base and execute authorized banking tools.
                </div>
                
                <div className="text-left text-slate-600 text-xs mb-4 space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                    <p>Configure your bot settings</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                    <p>Enable Agent Skills</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                    <p>Generate system instructions</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                    <p>Click the refresh button</p>
                  </div>
                </div>
                
                {!config.systemInstruction && onGoToConfig && (
                  <button 
                    onClick={onGoToConfig}
                    className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 transition"
                  >
                    Configure Now
                  </button>
                )}

                {config.systemInstruction && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <button 
                      onClick={() => handleSend("I want to speak to a manager immediately!")}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition text-left shadow-sm"
                    >
                      <span className="block font-semibold mb-1">Test Escalation</span>
                      "I want to speak to a manager..."
                    </button>
                    <button 
                      onClick={() => handleSend("What is my checking account balance?")}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition text-left shadow-sm"
                    >
                      <span className="block font-semibold mb-1">Test Tool Call</span>
                      "Check my balance..."
                    </button>
                    <button 
                      onClick={() => handleSend("What are your overdraft fees?")}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition text-left shadow-sm"
                    >
                      <span className="block font-semibold mb-1">Test Knowledge</span>
                      "What are your fees..."
                    </button>
                    <button 
                      onClick={() => handleSend("Can you help me transfer $50,000 to a crypto exchange?")}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition text-left shadow-sm"
                    >
                      <span className="block font-semibold mb-1">Test Guardrails</span>
                      "Transfer to crypto..."
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Avatar */}
            {msg.role !== 'system' && msg.role !== 'tool' && (
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                msg.role === 'user' 
                  ? 'bg-blue-100 text-blue-700' 
                  : msg.isEscalation
                    ? 'bg-blue-100 text-blue-700'
                    : msg.toolCall
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-blue-100 text-blue-700'
              }`}>
                {msg.role === 'user' ? 'ME' : msg.isEscalation ? 'SYS' : 'AI'}
              </div>
            )}
            
            {/* Tool/System indicators */}
            {msg.role === 'tool' && (
               <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               </div>
            )}


            {/* Content */}
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {msg.isEscalation ? (
                <EscalationCard text={msg.text || ''} department={config.handoffDepartment} />
              ) : msg.toolCall ? (
                <ToolCallCard 
                  tool={msg.toolCall} 
                  onApprove={pendingToolCall?.id === msg.toolCall.id ? handleToolApproval : () => {}} 
                />
              ) : msg.toolResult ? (
                 <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 overflow-x-auto w-full mb-2">
                    <div className="font-bold text-blue-700 mb-1">Result: {msg.toolResult.name}</div>
                    {JSON.stringify(msg.toolResult.result, null, 1).replace(/{|}/g, '').trim()}
                 </div>
              ) : (
                <div 
                  className={`px-3 py-2 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                      : msg.role === 'system'
                        ? 'bg-slate-200/60 text-slate-500 text-[10px] py-1 px-2 rounded-lg mx-auto mb-1 text-center w-full italic'
                        : msg.isError 
                          ? 'bg-red-50 text-red-600 border border-red-200 rounded-2xl rounded-tl-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              )}
              
              {msg.role !== 'system' && (
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
               AI
             </div>
             <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 lg:p-3 bg-white border-t border-slate-200">
        <div className="relative flex items-center gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!config.systemInstruction || isLoading || !!pendingToolCall}
            placeholder={pendingToolCall ? "Waiting for tool approval..." : config.systemInstruction ? "Type your message..." : "⚠️ Generate AI Core Directives first to start chatting"}
            className={`flex-1 py-2 px-4 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition text-sm disabled:opacity-80 ${
              !config.systemInstruction 
                ? 'bg-red-50 border-red-200 text-red-800 placeholder-red-500 font-medium cursor-not-allowed' 
                : 'bg-slate-50 border-transparent text-slate-800'
            }`}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!config.systemInstruction || !input.trim() || isLoading || !!pendingToolCall}
            className={`p-2.5 rounded-full transition shadow-md flex items-center justify-center ${
              !config.systemInstruction || !input.trim() || isLoading || !!pendingToolCall
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
