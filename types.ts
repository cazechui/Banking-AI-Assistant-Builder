
export interface BotConfiguration {
  id: string;
  department: string;
  name: string;
  role: string; // e.g., "Mortgage Advisor", "Fraud Support"
  tone: string; // e.g., "Professional", "Empathetic"
  goal: string;
  systemInstruction: string;
  complianceLevel: 'Standard' | 'Strict' | 'High-Security';
  guardrails: string[];
  escalationTriggers: EscalationTrigger[];
  handoffDepartment: string;
  activeTools: string[]; // List of enabled tool IDs
  knowledgeBase: string; // Custom policy text or FAQ content
  uploadedDocuments: { id: string, name: string, chunks: number, size: number, department: string }[];
  model: string; // The specific Gemini model to use
}

export type EscalationTrigger = 'sentiment_negative' | 'unknown_answer' | 'compliance_flag' | 'user_request';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system' | 'agent' | 'tool'; 
  text?: string;
  timestamp: Date;
  isError?: boolean;
  isEscalation?: boolean;
  toolCall?: ToolCallData;
  toolResult?: ToolResultData;
}

export interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResultData {
  id: string;
  name: string;
  result: Record<string, any>;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  parameters: any; // JSON Schema for Gemini
}

export enum Department {
  GENERAL_SUPPORT = 'General Support',
  MORTGAGE = 'Mortgages & Loans',
  FRAUD = 'Fraud & Security',
  WEALTH = 'Wealth Management',
  IT = 'Internal IT Helpdesk',
  HR = 'Human Resources'
}
