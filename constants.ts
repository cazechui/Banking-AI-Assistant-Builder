
import { Department, BotConfiguration, EscalationTrigger, AgentTool } from './types';
import { Type } from "@google/genai";

export const INITIAL_GUARDRAILS = [
  "Do not request or store full credit card numbers (PAN).",
  "Do not ask for PINs or Passwords.",
  "Verify user identity before discussing account balances.",
  "Disclaim that you are an AI assistant at the start of the conversation.",
  "Redirect to human agent for transactions over $10,000."
];

export const ESCALATION_OPTIONS: {id: EscalationTrigger, label: string, description: string}[] = [
  { id: 'user_request', label: 'Explicit User Request', description: 'When user asks for "agent", "human", or "help".' },
  { id: 'sentiment_negative', label: 'Negative Sentiment', description: 'Detect anger, frustration, or threats.' },
  { id: 'unknown_answer', label: 'Low Confidence', description: 'When the model does not know the specific banking policy.' },
  { id: 'compliance_flag', label: 'Compliance Risk', description: 'When user attempts to bypass security guardrails.' },
];

export const BANKING_TOOLS: AgentTool[] = [
  {
    id: 'check_balance',
    name: 'check_balance',
    description: 'Retrieves the current balance of a specific customer account.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        account_type: {
          type: Type.STRING,
          description: 'The type of account (e.g., "checking", "savings", "credit_card").',
        },
        currency: {
          type: Type.STRING,
          description: 'The currency code (e.g., "USD", "EUR"). Defaults to USD.',
        }
      },
      required: ['account_type'],
    }
  },
  {
    id: 'transaction_history',
    name: 'transaction_history',
    description: 'Fetches the last 5 transactions for a given account.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        account_type: {
          type: Type.STRING,
          description: 'The type of account.',
        },
        days: {
          type: Type.NUMBER,
          description: 'Number of days to look back.',
        }
      },
      required: ['account_type'],
    }
  },
  {
    id: 'lock_card',
    name: 'lock_card',
    description: 'Temporarily freezes a debit or credit card to prevent fraud.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        last_4_digits: {
          type: Type.STRING,
          description: 'The last 4 digits of the card to lock.',
        },
        reason: {
          type: Type.STRING,
          description: 'Reason for locking (e.g., "lost", "stolen", "suspicious_activity").',
        }
      },
      required: ['last_4_digits', 'reason'],
    }
  },
  {
    id: 'schedule_appointment',
    name: 'schedule_appointment',
    description: 'Books an in-branch appointment with a banker.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        branch_location: {
          type: Type.STRING,
          description: 'City or Branch ID preferred by the user.',
        },
        date: {
          type: Type.STRING,
          description: 'Desired date for the appointment (YYYY-MM-DD).',
        },
        topic: {
          type: Type.STRING,
          description: 'Purpose of visit (e.g., "loan", "account_opening").',
        }
      },
      required: ['branch_location', 'date'],
    }
  }
];

export const DEPARTMENT_DEFAULTS: Record<Department, Partial<BotConfiguration>> = {
  [Department.GENERAL_SUPPORT]: {
    name: "BankHelp Assistant",
    role: "Customer Service Representative",
    tone: "Helpful, clear, and concise",
    goal: "Assist customers with branch hours, routing numbers, and basic account navigation.",
    complianceLevel: 'Standard',
    handoffDepartment: 'General Support Team',
    escalationTriggers: ['user_request', 'unknown_answer'],
    activeTools: ['check_balance', 'transaction_history']
  },
  [Department.MORTGAGE]: {
    name: "HomeLoan Expert",
    role: "Senior Mortgage Advisor",
    tone: "Professional, knowledgeable, and patient",
    goal: "Explain mortgage types (Fixed vs ARM), current rates, and pre-approval processes.",
    complianceLevel: 'Strict',
    handoffDepartment: 'Loan Officers',
    escalationTriggers: ['user_request', 'compliance_flag'],
    activeTools: ['schedule_appointment']
  },
  [Department.FRAUD]: {
    name: "Security Guardian",
    role: "Fraud Prevention Specialist",
    tone: "Urgent, reassuring, and precise",
    goal: "Help customers lock compromised cards and review recent suspicious transactions.",
    complianceLevel: 'High-Security',
    handoffDepartment: 'Fraud Operations Center',
    escalationTriggers: ['sentiment_negative', 'compliance_flag'],
    activeTools: ['lock_card', 'transaction_history']
  },
  [Department.WEALTH]: {
    name: "Portfolio Partner",
    role: "Wealth Management Associate",
    tone: "Sophisticated, data-driven, and polite",
    goal: "Discuss market trends and asset allocation strategies without giving specific investment advice.",
    complianceLevel: 'Strict',
    handoffDepartment: 'Wealth Advisors',
    escalationTriggers: ['compliance_flag', 'unknown_answer'],
    activeTools: ['check_balance']
  },
  [Department.IT]: {
    name: "Employee IT Bot",
    role: "Internal Tech Support",
    tone: "Technical but accessible",
    goal: "Help bank employees reset passwords and troubleshoot VPN issues.",
    complianceLevel: 'Standard',
    handoffDepartment: 'L2 Tech Support',
    escalationTriggers: ['unknown_answer'],
    activeTools: []
  },
  [Department.HR]: {
    name: "HR Assistant",
    role: "HR Representative",
    tone: "Empathetic and informative",
    goal: "Help employees with benefits, payroll, and company policies.",
    complianceLevel: 'Strict',
    handoffDepartment: 'HR Operations',
    escalationTriggers: ['user_request', 'compliance_flag'],
    activeTools: []
  }
};

export const DEFAULT_CONFIG: BotConfiguration = {
  id: 'default',
  department: '',
  name: 'New Bot',
  role: 'Banking Assistant',
  tone: 'Professional',
  goal: '',
  systemInstruction: '',
  complianceLevel: 'Standard',
  guardrails: [...INITIAL_GUARDRAILS],
  escalationTriggers: ['user_request', 'sentiment_negative'],
  handoffDepartment: 'Customer Service',
  activeTools: [],
  knowledgeBase: '',
  uploadedDocuments: [],
  model: 'gemini-2.5-flash'
};
