import { GoogleGenAI, Chat, GenerateContentResponse, Content, FunctionDeclaration } from "@google/genai";
import { BotConfiguration, ChatMessage } from "../types";
import { BANKING_TOOLS } from "../constants";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a professional system instruction/prompt based on high-level business requirements.
 */
export const generateSystemPrompt = async (
  config: Pick<BotConfiguration, 'role' | 'tone' | 'goal' | 'complianceLevel' | 'guardrails' | 'escalationTriggers' | 'handoffDepartment' | 'activeTools' | 'knowledgeBase' | 'model'>
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your environment variables.");
  }
  const model = config.model || "gemini-2.5-flash";
  
  // Construct the escalation instructions dynamically
  const escalationInstructions = config.escalationTriggers.map(trigger => {
    switch(trigger) {
      case 'user_request': return "- The user explicitly asks for a human agent or supervisor.";
      case 'sentiment_negative': return "- The user expresses severe anger, frustration, or threatens legal action.";
      case 'unknown_answer': return "- You do not have enough information to answer a specific banking policy question safely.";
      case 'compliance_flag': return "- The user asks you to perform a task that violates your guardrails (e.g. asking for card numbers).";
      default: return "";
    }
  }).filter(Boolean).join("\n");

  const activeToolNames = config.activeTools.join(', ');
  const toolInstruction = config.activeTools.length > 0 
    ? `You have access to the following tools: [${activeToolNames}]. Use them whenever the user requests an action they support. Do not halluncinate parameters.`
    : "You do not have access to any external tools or banking systems. Answer based on general knowledge only.";

  const prompt = `
    You are an expert AI Prompt Engineer for the Banking & Finance sector.
    
    Task: Create a robust, secure, and high-quality 'System Instruction' for a Large Language Model chatbot.
    
    Input Configuration:
    - Role: ${config.role}
    - Tone: ${config.tone}
    - Primary Goal: ${config.goal}
    - Compliance Level: ${config.complianceLevel}
    - Mandatory Guardrails: ${config.guardrails.join('; ')}
    - Handoff Service: ${config.handoffDepartment}
    - Available Tools: ${activeToolNames || "None"}

    KNOWLEDGE BASE (CONTEXT):
    ${config.knowledgeBase || "No specific knowledge base provided. Rely on general banking knowledge."}
    
    CRITICAL INSTRUCTION - HUMAN HANDOFF PROTOCOL:
    The system instruction MUST include a specific directive for escalation.
    Instruct the model that if ANY of the following conditions are met:
    ${escalationInstructions}
    
    Then the model MUST:
    1. Start its response with the tag "[ESCALATE]".
    2. Provide a polite, reassuring message stating they are connecting the user to the service: ${config.handoffDepartment}.
    3. Do NOT attempt to solve the problem further if it requires human authority.

    CRITICAL INSTRUCTION - TOOL USE:
    ${toolInstruction}
    
    General Requirements:
    1. Start with "You are a [Role] for [Bank Name]..."
    2. Explicitly define the tone.
    3. Include the 'Strict Compliance & Safety' section with guardrails.
    4. Keep the instruction concise but comprehensive.
    
    Output strictly the system instruction text, no markdown code blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Failed to generate instructions.";
  } catch (error) {
    console.error("Error generating system prompt:", error);
    throw error;
  }
};

/**
 * Helper to convert app ChatMessage format to SDK Content format
 */
const formatHistoryForSDK = (history: ChatMessage[]): Content[] => {
  return history
    .filter(msg => !msg.isError && msg.role !== 'system')
    .map(msg => {
      // Handle standard User/Model text messages
      if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.text || '' }] };
      }
      
      // Handle Model responses (Text or Function Calls)
      if (msg.role === 'model') {
        const parts: any[] = [];
        if (msg.text) parts.push({ text: msg.text });
        if (msg.toolCall) {
          parts.push({
            functionCall: {
              name: msg.toolCall.name,
              args: msg.toolCall.args
            }
          });
        }
        return { role: 'model', parts };
      }

      // Handle Function/Tool Responses
      // The SDK typically expects function responses to be passed as part of a 'user' role block 
      // or a specific 'function' role block, but sticking to 'user' with 'functionResponse' is safer for compatibility in many contexts.
      if (msg.role === 'tool' && msg.toolResult) {
        return {
          role: 'user', 
          parts: [{
            functionResponse: {
              name: msg.toolResult.name,
              response: { result: msg.toolResult.result }
            }
          }]
        };
      }
      
      return { role: 'user', parts: [{ text: '' }] }; // Fallback
    });
};

/**
 * Creates a chat session for the preview window.
 * Optionally restores history.
 */
export const createChatSession = (systemInstruction: string, history: ChatMessage[] = [], activeTools: string[] = [], modelName: string = 'gemini-2.5-flash') => {
  // Filter available tools based on config
  const tools: FunctionDeclaration[] = BANKING_TOOLS
    .filter(t => activeTools.includes(t.id))
    .map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }));

  const chatConfig: any = {
    model: modelName,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.4, // Lower temperature for banking accuracy
    }
  };

  // Add tools if any are active
  if (tools.length > 0) {
    chatConfig.config.tools = [{ functionDeclarations: tools }];
  }

  // Restore history if present
  if (history && history.length > 0) {
     chatConfig.history = formatHistoryForSDK(history);
  }

  return ai.chats.create(chatConfig);
};

/**
 * Sends a message to the chat session.
 * Accepts either a text string (user message) or a tool response object.
 */
export const sendMessageToBot = async (
  chat: Chat, 
  message: string | { toolResult: any }
): Promise<GenerateContentResponse> => {
  try {
    let msgPayload;
    
    if (typeof message === 'string') {
      msgPayload = { message };
    } else {
      // It's a tool response
      // Structure it as a functionResponse part
      msgPayload = {
        parts: [{
          functionResponse: {
            name: message.toolResult.name,
            response: { result: message.toolResult.result }
          }
        }]
      };
    }

    const response = await chat.sendMessage(msgPayload as any);
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
