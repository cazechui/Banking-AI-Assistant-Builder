# Financial AI Chatbot Workbench

A professional workbench for banking business users to design, test, and refine AI chatbots with compliance guardrails and automated prompt engineering.

**Note: This is a personal portfolio prototype. Do not enter real personal or financial information.**

## 🚀 Overview

This application is a self-built prototype designed for learning and demonstration purposes. It showcases how a modern financial institution might empower non-technical staff to build sophisticated AI assistants using Retrieval-Augmented Generation (RAG) and advanced prompt engineering.

## 🛠 Architecture

- **Frontend**: React 18 (TypeScript) for a robust, type-safe user interface.
- **Build Tool**: Vite for fast development and optimized production builds.
- **AI Engine**: Google Gemini API (via `@google/genai` SDK) powering the chatbot and the automated system directive generation.
- **Styling**: Tailwind CSS for a clean, professional, and responsive financial dashboard aesthetic.
- **Icons**: Lucide React for a consistent and modern icon set.
- **RAG Simulation**: A sophisticated simulation of document chunking and vector embedding to demonstrate the RAG workflow.

## ⚙️ Key Features

- **Bot Configurator**: Define bot persona, goals, and tone.
- **Automated Prompt Engineering**: Generate complex system instructions using AI based on high-level goals.
- **Knowledge Base (RAG)**: Upload documents to provide context-aware answers.
- **Compliance Guardrails**: Toggle safety rules to ensure the bot stays within financial regulations.
- **Agentic Tools**: Enable the bot to call simulated banking functions (e.g., `check_balance`, `escalate_to_human`).
- **Real-time Preview**: Test the bot immediately in a side-by-side chat interface.

## 💻 Local Setup

To run this project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cazechui/banking-chatbot-demo.git
   cd banking-chatbot-demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to `http://localhost:3000` in your browser.

## 👤 Author

Built by **Caze Chui**
- [LinkedIn](https://linkedin.com/in/cazechui)
- [GitHub](https://github.com/cazechui)

---
*Disclaimer: This project is a demonstration of UI/UX and AI integration capabilities. It is not intended for production use with sensitive financial data.*
