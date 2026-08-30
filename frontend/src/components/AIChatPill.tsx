import React, { useState, useRef, useEffect } from "react";
import {
  aiService,
  type ChatMessage,
  type ActionExecuted,
} from "../services/ai";
import {
  Bot,
  X,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Target,
  GraduationCap,
  Calendar,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

interface ExtendedMessage extends ChatMessage {
  id: string;
  timestamp: string;
  actionExecuted?: ActionExecuted | null;
  actionStatus?: "success" | "already_enrolled" | "not_found" | "error" | null;
  actionMessage?: string | null;
}

const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const blocks = content.split(/\n\n+/);

  const formatInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={index} className="font-semibold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={index}
            className="bg-slate-950/80 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px] border border-slate-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={index} className="italic text-slate-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 leading-relaxed text-xs">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={bIdx}
              className="font-bold text-amber-400 text-xs mt-1 mb-0.5"
            >
              {formatInline(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={bIdx}
              className="font-bold text-amber-300 text-sm mt-1.5 mb-0.5"
            >
              {formatInline(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2
              key={bIdx}
              className="font-bold text-amber-300 text-sm mt-1.5 mb-0.5"
            >
              {formatInline(trimmed.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
          const codeLines = trimmed.slice(3, -3).trim().split("\n");
          const firstLine = codeLines[0].trim();
          const isLangHeader = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const rawCode = isLangHeader
            ? codeLines.slice(1).join("\n")
            : codeLines.join("\n");
          return (
            <pre
              key={bIdx}
              className="bg-slate-950 p-2.5 rounded-lg border border-slate-700/80 font-mono text-[11px] text-amber-200 overflow-x-auto my-1"
            >
              <code>{rawCode}</code>
            </pre>
          );
        }

        const lines = trimmed.split("\n");
        const isBulletList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1 my-1 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2">
                  <span className="text-amber-400 select-none text-[10px] leading-tight mt-0.5">
                    •
                  </span>
                  <span className="flex-1">
                    {formatInline(line.replace(/^\s*[-*•]\s+/, ""))}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={bIdx} className="space-y-1 my-1 pl-1">
              {lines.map((line, lIdx) => {
                const match = line.match(/^\s*(\d+)\.\s+(.*)/);
                const num = match ? match[1] : `${lIdx + 1}`;
                const text = match ? match[2] : line;
                return (
                  <li key={lIdx} className="flex items-start gap-1.5">
                    <span className="text-amber-400/90 font-mono text-[10px] select-none font-semibold shrink-0">
                      {num}.
                    </span>
                    <span className="flex-1">{formatInline(text)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p key={bIdx} className="wrap-break-word">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formatInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

interface AIChatPillProps {
  onCourseEnrolled?: () => void;
  activeDocumentText?: string | null;
}

export const AIChatPill: React.FC<AIChatPillProps> = ({
  onCourseEnrolled,
  activeDocumentText,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 220);
  };

  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Namaste! I am your AI Learning Assistant & Competency Mentor under the Mission Karmayogi framework.\n\nI can analyze your FRAC competency gaps, recommend training courses from iGOT/NSSTA, formulate tailored study schedules, and directly enroll you in recommended courses.\n\nHow can I support your professional development today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setError(null);
    const userMsgId = `user-${Date.now()}`;
    const newMessages: ExtendedMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];

    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      // Build conversation history payload
      const payloadMessages: ChatMessage[] = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiService.chatWithAssistant({
        messages: payloadMessages,
        uploaded_material_text: activeDocumentText || null,
      });

      const assistantMsg: ExtendedMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        actionExecuted: res.action_executed,
        actionStatus: res.action_status,
        actionMessage: res.action_message,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If an enrollment action was successfully executed, trigger callback to refresh dashboard data
      if (res.action_status === "success" && onCourseEnrolled) {
        onCourseEnrolled();
      }
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      const errorMsg =
        err?.message ||
        "Failed to communicate with AI Assistant. Please try again.";
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Conversation restarted. Feel free to ask about your FRAC competencies, recommended courses, or ask me to enroll you in a training module.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setError(null);
  };

  const quickPrompts = [
    {
      label: "Analyze my skill gaps",
      icon: <Target className="w-3.5 h-3.5 text-rose-400" />,
      prompt:
        "Can you analyze my current competency gaps and explain what levels I need to achieve?",
    },
    {
      label: "Top course recommendations",
      icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" />,
      prompt:
        "What are my highest priority course recommendations on iGOT/NSSTA?",
    },
    {
      label: "Create a 2-week study plan",
      icon: <Calendar className="w-3.5 h-3.5 text-amber-400" />,
      prompt:
        "Create a realistic 2-week study plan with 30-minute daily micro-learning blocks for my key gaps.",
    },
    {
      label: "Quick concept check",
      icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />,
      prompt:
        "Give me a quick 1-question concept check from one of my weak statistical competency areas.",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Pill Button (Collapsed View: Circular by default, expands on hover) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center bg-slate-900 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out border-b-2 border-amber-600 border border-slate-700/80 cursor-pointer animate-chat-pill-enter p-2 h-12 max-w-[48px] hover:max-w-[360px] overflow-hidden whitespace-nowrap"
          title="AI Learning Mentor - Click to Open"
        >
          {/* Animated Glow Halo */}
          <div className="absolute -inset-0.5 bg-amber-500/20 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300 pointer-events-none" />

          {/* Left Icon (Always visible and centered in the circle) */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-amber-400 shrink-0">
            <Bot className="w-4 h-4 text-amber-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-slate-900 rounded-full group-hover:hidden transition-all" />
          </div>

          {/* Expandable Text & Badges on Hover */}
          <div className="flex items-center gap-3 pl-3 pr-1 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[300px] transition-all duration-300 ease-in-out overflow-hidden">
            {/* Text & Status */}
            <div className="flex flex-col text-left justify-center shrink-0">
              <div className="text-xs font-semibold tracking-wide text-white flex items-center gap-1.5 leading-tight">
                <span>AI Learning Mentor</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <span className="text-[10px] text-amber-400/90 font-mono leading-tight mt-0.5">
                Mission Karmayogi • MoSPI
              </span>
            </div>

            {/* Ask AI Tag */}
            <div className="shrink-0 pl-1">
              <div className="bg-amber-600 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                Ask AI
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded Chatbot Modal / Drawer */}
      {isOpen && (
        <div className="relative">
          {/* Ambient Glow Halo matching Pill */}
          <div className="absolute -inset-1 bg-amber-500/15 rounded-2xl blur-lg pointer-events-none" />

          <div
            className={`relative w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-5rem)] bg-slate-900 text-slate-100 border-b-2 border-amber-600 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isClosing
                ? "animate-chat-modal-exit pointer-events-none"
                : "animate-chat-modal-enter"
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 border-b-2 border-amber-600 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner text-amber-400 shrink-0">
                  <Bot className="w-5 h-5 text-amber-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Karmayogi AI Mentor
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 leading-tight mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                    Statistical System Competency Guide
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={handleClearHistory}
                  title="Restart conversation"
                  className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all duration-200 cursor-pointer btn-press"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  title="Minimize assistant"
                  className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all duration-200 cursor-pointer btn-press"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user"
                      ? "items-end animate-msg-user"
                      : "items-start animate-msg-assistant"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed transition-all duration-200 ${
                      msg.role === "user"
                        ? "bg-slate-800 border border-slate-700 text-slate-100 rounded-br-none shadow-md"
                        : "bg-slate-800/90 border border-slate-700 text-slate-200 rounded-bl-none shadow-xs"
                    }`}
                  >
                    <FormattedMarkdown content={msg.content} />

                    {/* Render Action Status Card if an enrollment action was executed */}
                    {msg.actionExecuted && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700 flex flex-col gap-1.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Automated Course Enrollment</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-[11px]">
                          <p className="font-medium text-slate-100">
                            {msg.actionExecuted.courseTitle || "Course"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {msg.actionExecuted.courseId} • Official:{" "}
                            {msg.actionExecuted.officialId}
                          </p>
                          {msg.actionMessage && (
                            <p className="text-[10px] text-emerald-300/90 mt-1 font-medium">
                              {msg.actionMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {msg.actionStatus && msg.actionStatus !== "success" && (
                      <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{msg.actionMessage || "Action notice"}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-start gap-2 animate-msg-assistant">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      AI Mentor is analyzing...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            {messages.length <= 2 && !loading && (
              <div className="px-3 pb-2 pt-1.5 border-t border-slate-800 bg-slate-900">
                <p className="text-[10px] text-slate-400 mb-1.5 font-medium px-1">
                  Suggested questions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="flex items-center gap-1.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition-all duration-200 cursor-pointer btn-press"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Box Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              {error && (
                <div className="mb-2 px-2.5 py-1 text-[10px] bg-rose-950/50 border border-rose-800/60 text-rose-300 rounded flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="text-rose-400 hover:text-rose-200 btn-press"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Ask about competencies, courses, or ask to enroll..."
                  className="flex-1 bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-24 scrollbar-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-slate-950 font-bold flex items-center justify-center transition-all duration-200 shrink-0 shadow-xs cursor-pointer btn-press"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 inline" />
                  Zero-trust action sandbox active
                </span>
                <span>Karmayogi OSS v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
