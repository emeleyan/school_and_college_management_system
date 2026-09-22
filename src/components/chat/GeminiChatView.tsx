import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Sliders,
  AlertCircle,
  HelpCircle,
  Zap,
  Cpu,
  BrainCircuit,
  MessageSquare,
  ShieldCheck,
  Building,
  GraduationCap,
  Calculator,
  RefreshCw,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export type GeminiModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.1-pro-preview';

interface ModelOption {
  id: GeminiModelId;
  name: string;
  tier: string;
  description: string;
  recommendedFor: string;
  icon: any;
  accentColor: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tier: 'Default / Balanced',
    description: 'High-speed administrative reasoning with state-of-the-art accuracy.',
    recommendedFor: 'Default recommended model for administrative workflows & reporting.',
    icon: Sparkles,
    accentColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tier: 'General Tasks',
    description: 'Dependable, versatile engine for daily correspondence and student documentation.',
    recommendedFor: 'Best for general tasks, parent notices, routine announcements, and emails.',
    icon: Zap,
    accentColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    tier: 'Fast Tasks',
    description: 'Ultra-low latency model engineered for instant answers and quick calculations.',
    recommendedFor: 'Best for tasks that should happen fast: quick summaries, fee lookups, short replies.',
    icon: Cpu,
    accentColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    tier: 'Complex Tasks',
    description: 'Maximum reasoning power for deep curriculum audits, complex analytics, and strategy.',
    recommendedFor: 'Best for particularly complex tasks, deep policy formulations, and multi-step audits.',
    icon: BrainCircuit,
    accentColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200',
  },
];

interface RolePreset {
  id: string;
  title: string;
  icon: any;
  shortDesc: string;
  instruction: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'principal',
    title: 'School Principal & Academic Director',
    icon: GraduationCap,
    shortDesc: 'Curriculum standards, academic discipline, and school policy',
    instruction:
      'You are the School Principal & Academic Director of an esteemed institution. You provide authoritative, wise, and articulate guidance on academic curriculum, teacher evaluations, disciplinary actions, board examination preparations, and school growth strategies. Your tone is respectful, formal, and visionary.',
  },
  {
    id: 'erp_admin',
    title: 'ERP Systems & Backup Administrator',
    icon: ShieldCheck,
    shortDesc: '11:59 PM backups, digital signatures, certificates & data integrity',
    instruction:
      'You are the Chief ERP Systems & Database Administrator for EduSphere ERP. You are an expert in offline IndexedDB databases, 11:59 PM automated background backup snapshots, canvas digital signature processing, certificate template font registries, role-based access security, and data recovery workflows. Your tone is technical, reassuring, and precise.',
  },
  {
    id: 'bursar',
    title: 'Accounts Officer & Fee Bursar',
    icon: Calculator,
    shortDesc: 'Tuition fees, dues tracking, ledger balances & waivers',
    instruction:
      'You are the Senior Accounts Officer and Fee Bursar. You assist with student tuition fee structures, collection vouchers, concessions, fine waivers, daily cash reconciliation, and financial audit compliance. Your tone is organized, mathematically sound, and helpful.',
  },
  {
    id: 'exam_controller',
    title: 'Exam Controller & Registrar',
    icon: Building,
    shortDesc: 'GPA grading, admit cards, transfer certificates & student records',
    instruction:
      'You are the Controller of Examinations and Registrar. You assist with GPA 5.0 grade calculations, tabulations, exam schedules, Transfer Certificates (TC) in English without any foreign script, student registrations, and official document verification. Your answers are thorough and strictly compliant with education board guidelines.',
  },
  {
    id: 'custom',
    title: 'Custom Administrative Role',
    icon: Sliders,
    shortDesc: 'Define your own specialized system instructions',
    instruction:
      'You are a knowledgeable and polite educational AI assistant helping the administration manage school and college operations efficiently.',
  },
];

const PROMPT_SUGGESTIONS = [
  {
    label: '11:59 PM Auto-Backup Safety',
    prompt:
      'How does the 11:59 PM daily automated backup scheduler safeguard our school records if someone forgets to manually export data?',
  },
  {
    label: 'Digital Signature Processing',
    prompt:
      'Explain how the ERP removes paper backgrounds and converts uploaded signatures into crisp digital black ink with sharpening filters.',
  },
  {
    label: 'Certificate Template Registry',
    prompt:
      'How does the Master Certificate Template Registry allow us to define layout designs and font families once for all 28 certificates?',
  },
  {
    label: 'Draft Student Award Citation',
    prompt:
      'Draft a formal, inspiring citation in English for an Academic Excellence and Good Conduct Certificate for a top-performing student.',
  },
];

export const GeminiChatView: React.FC = () => {
  const { activeInstitute, activeAcademicYear, currentUser, currentRole } = useApp();

  // Selected Model & Role
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<string>('erp_admin');
  const [customInstruction, setCustomInstruction] = useState<string>(
    ROLE_PRESETS.find((r) => r.id === 'erp_admin')?.instruction || ''
  );
  const [showRoleConfig, setShowRoleConfig] = useState<boolean>(false);

  // Messages History
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('edusphere_gemini_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hello **${currentUser?.fullName || 'Administrator'}**! I am your **EduSphere AI Administrative Assistant** powered by Google Gemini.

I can assist you with:
- **11:59 PM Daily Automated Backups** & data snapshot restoration
- **Master Certificate Template Registry** & section-wise typography setup
- **Digital Signature Processing** with transparent background & sharpening
- Academic grade calculations, student admission workflows, and official correspondence

Select a role or model above, or pick a prompt below to get started!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save conversation history to local storage
  useEffect(() => {
    localStorage.setItem('edusphere_gemini_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Update custom instruction when role changes
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const preset = ROLE_PRESETS.find((r) => r.id === roleId);
    if (preset) {
      setCustomInstruction(preset.instruction);
    }
  };

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!messageContent || isLoading) return;

    setErrorText(null);
    const userMsgId = `msg_user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build server request payload with conversation history
      // Contextual institute information injected into system instruction
      const fullSystemInstruction = `${customInstruction}
Current Institute Context:
- Institution: ${activeInstitute?.name || 'Central Academy'}
- Code: ${activeInstitute?.code || 'SCH-01'}
- Current Academic Year: ${activeAcademicYear?.yearName || '2026'}
- Current User: ${currentUser?.fullName || 'Administrator'} (${currentRole?.name || 'Admin'})
Note on Certificates: In compliance with administrative directives, certificates and formal attestations must strictly be generated in English with zero Bengali text.`;

      // Filter messages to pass to Gemini multi-turn
      const apiMessages = newHistory.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemInstruction: fullSystemInstruction,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive response from Gemini');
      }

      const aiMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: data.text || 'I received your request but have no additional text to share.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || selectedModel,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorText(err.message || 'Error contacting Gemini API. Please verify your connection.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  // Keyboard shortcut: Enter to submit, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the conversation history?')) {
      const resetMessages: ChatMessage[] = [
        {
          id: `msg_welcome_${Date.now()}`,
          role: 'assistant',
          content: 'Conversation cleared. How can I assist you with your school administration today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        },
      ];
      setMessages(resetMessages);
      localStorage.removeItem('edusphere_gemini_chat_history');
      setErrorText(null);
    }
  };

  // Copy message text to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeModelObj = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];
  const activeRoleObj = ROLE_PRESETS.find((r) => r.id === selectedRole) || ROLE_PRESETS[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* HEADER & CONTROLS */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Status */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  EduSphere AI Assistant (Gemini)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  Multi-Turn Chat
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Server-Side Gemini SDK
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Intelligent administrative advisor for backups, certificates, signatures, admissions &amp; reports.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRoleConfig(!showRoleConfig)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showRoleConfig
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
              title="Configure Chatbot Role & System Instructions"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Role: {activeRoleObj.title.split(' ')[0]}</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Clear entire conversation history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* MODEL SELECTOR CARDS */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>Select Model Strategy:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {MODEL_OPTIONS.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? `${m.accentColor} ring-2 ring-blue-500/20 shadow-xs font-semibold`
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {m.name}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {m.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {m.recommendedFor}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROLE CONFIGURATION DRAWER */}
        {showRoleConfig && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                System Instructions &amp; Role Persona:
              </span>
              <span className="text-[11px] text-slate-500">
                Determines how the chatbot approaches responses and tasks.
              </span>
            </div>

            {/* Role Preset Chips */}
            <div className="flex flex-wrap gap-2">
              {ROLE_PRESETS.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{role.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Instruction Editor */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Active System Prompt (Passed to Gemini):
              </label>
              <textarea
                value={customInstruction}
                onChange={(e) => {
                  setCustomInstruction(e.target.value);
                  setSelectedRole('custom');
                }}
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Enter custom role instructions for Gemini..."
              />
            </div>
          </div>
        )}
      </div>

      {/* CHAT THREAD AREA */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[600px]">
        {/* Thread Info Bar */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Conversation Thread (<span className="font-semibold text-slate-700 dark:text-slate-200">{messages.length}</span> messages)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Active Persona:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {activeRoleObj.title}
              </span>
            </span>
            <span>•</span>
            <span>
              Engine:{' '}
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {selectedModel}
              </span>
            </span>
          </div>
        </div>

        {/* Scrollable Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {isUser ? currentUser?.fullName || 'You' : 'EduSphere AI'}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && !isUser && (
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs relative group ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs space-y-2">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    {/* Copy Button */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute -bottom-2 right-2 p-1 rounded-md bg-white dark:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-600 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Thinking using {selectedModel}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ERROR NOTIFICATION */}
        {errorText && (
          <div className="mx-4 mb-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
            <button
              onClick={() => setErrorText(null)}
              className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* PROMPT STARTERS / CHIPS */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
            Suggested:
          </span>
          {PROMPT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.prompt)}
              disabled={isLoading}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* INPUT FORM */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-b-xl">
          <div className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={`Ask EduSphere AI (${selectedModel})... [Press Enter to send, Shift+Enter for new line]`}
              rows={2}
              className="flex-1 text-xs p-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer shrink-0"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>
              Shift + Enter for new line • Multi-turn history preserved
            </span>
            <span>
              Powered by <span className="font-semibold text-slate-600 dark:text-slate-300">Google Gemini API</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
