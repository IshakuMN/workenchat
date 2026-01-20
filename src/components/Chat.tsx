"use client";

import { useChat } from "ai/react";
import { Send, Maximize2, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/db";
import { TableModal } from "./TableModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Component for the confirm action UI
function ConfirmActionCard({
  toolCallId,
  args,
  addToolResult,
}: {
  toolCallId: string;
  args: { message?: string; sheet?: string; cell?: string; value?: string };
  addToolResult: (result: { toolCallId: string; result: string }) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (isProcessing || isDone) return;
    setIsProcessing(true);

    // If we have the action details, execute the write directly
    if (args.sheet && args.cell && args.value) {
      try {
        const response = await fetch("/api/xlsx/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheet: args.sheet,
            cell: args.cell,
            value: args.value,
          }),
        });
        const result = await response.json();
        const message = result.success
          ? `✓ ${result.message}`
          : `✗ ${result.error}`;
        setResultMessage(message);
        setIsDone(true);
      } catch (error) {
        setResultMessage(`✗ Error: ${error}`);
        setIsDone(true);
      }
    } else {
      addToolResult({
        toolCallId,
        result: "confirmed",
      });
      setIsDone(true);
    }
    setIsProcessing(false);
  };

  // Show cancelled state
  if (isCancelled) {
    return (
      <div className="mt-4 p-4 rounded-xl border backdrop-blur-sm bg-zinc-800/50 border-zinc-600/30">
        <p className="text-sm text-zinc-400">✗ Action cancelled</p>
      </div>
    );
  }

  // Show success/error result after action is done
  if (isDone && resultMessage) {
    return (
      <div
        className={`mt-4 p-4 rounded-xl border backdrop-blur-sm ${
          resultMessage.startsWith("✓")
            ? "bg-green-900/20 border-green-500/30"
            : "bg-red-900/20 border-red-500/30"
        }`}
      >
        <p className="text-sm text-zinc-200">{resultMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-zinc-900/50 p-4 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm">
      <p className="font-semibold text-sm mb-4 text-zinc-200">{args.message}</p>
      {args.sheet && args.cell && (
        <p className="text-xs text-zinc-500 mb-3 font-mono">
          {args.sheet}!{args.cell} → "{args.value}"
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing..." : "Yes, Confirm"}
        </button>
        <button
          onClick={() => setIsCancelled(true)}
          disabled={isProcessing}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg hover:bg-zinc-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface ChatProps {
  threadId: string;
  initialMessages?: Message[];
}

export function Chat({ threadId, initialMessages = [] }: ChatProps) {
  const [modalData, setModalData] = useState<{
    sheet: string;
    range: string;
    data: any[][];
  } | null>(null);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    addToolResult,
  } = useChat({
    api: "/api/chat",
    body: { threadId },
    maxToolRoundtrips: 5,
    initialMessages: initialMessages.map((m: Message) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectMention = (mention: string) => {
    setInput((prev) => prev + (prev.endsWith(" ") ? "" : " ") + mention + " ");
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar relative z-10"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-xl mb-4">
              <Sparkles className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              How can I help you today?
            </h2>
            <p className="text-zinc-500 max-w-sm">
              I can help you analyze spreadsheets, generate reports, or answer
              questions about your data.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, index) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex w-full gap-4",
                m.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border shadow-sm",
                  m.role === "user"
                    ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                    : "bg-zinc-900 border-zinc-800 text-white",
                )}
              >
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={cn(
                  "max-w-[85%] md:max-w-[75%] space-y-1",
                  m.role === "user" ? "items-end text-right" : "items-start",
                )}
              >
                {m.role === "assistant" && (
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1">
                    WorkenAI
                  </div>
                )}
                <div
                  className={cn(
                    "p-4 rounded-2xl shadow-sm relative group transition-all",
                    m.role === "user"
                      ? "bg-[#2f2f2f] text-[#ececec] selection:bg-zinc-600"
                      : "bg-transparent text-zinc-200 border border-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "markdown-content prose-sm max-w-none leading-relaxed text-left",
                      m.role === "user" ? "text-white" : "",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>

                  {m.toolInvocations?.map((toolInvocation) => {
                    const { toolCallId, toolName, state, args } =
                      toolInvocation;

                    // Server-side tool completed - show results
                    if (state === "result") {
                      const { result } = toolInvocation;

                      // Handle readTable results - show table preview
                      if (toolName === "readTable" && result?.data) {
                        return (
                          <div
                            key={toolCallId}
                            className="mt-4 bg-zinc-900/50 rounded-xl border border-white/10 shadow-lg relative group overflow-hidden"
                          >
                            <div className="flex justify-between items-center p-3 border-b border-white/10">
                              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {result.sheet}!{result.range}
                              </h4>
                              <button
                                onClick={() =>
                                  setModalData({
                                    sheet: result.sheet,
                                    range: result.range,
                                    data: result.data,
                                  })
                                }
                                className="p-1.5 hover:bg-zinc-800 rounded-lg text-white transition-colors"
                              >
                                <Maximize2 size={14} />
                              </button>
                            </div>
                            <div className="p-2 overflow-x-auto">
                              <table className="text-[10px] w-full border-collapse">
                                <tbody>
                                  {result.data
                                    .slice(0, 5)
                                    .map((row: any[], i: number) => (
                                      <tr key={i}>
                                        {row.map((cell, j) => (
                                          <td
                                            key={j}
                                            className="border border-white/10 p-2 truncate max-w-[100px] text-zinc-400 bg-zinc-950/50"
                                          >
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                            {result.data.length > 5 && (
                              <div className="text-center p-2 text-zinc-500 text-[9px] border-t border-white/10 bg-zinc-900/30">
                                + {result.data.length - 5} more rows • Click
                                expand to view all
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Handle writeCell results
                      if (toolName === "writeCell") {
                        return (
                          <div
                            key={toolCallId}
                            className="mt-4 p-3 rounded-xl border text-[11px] font-mono flex items-center gap-2"
                            style={{
                              background: result.success
                                ? "rgba(34, 197, 94, 0.1)"
                                : "rgba(239, 68, 68, 0.1)",
                              borderColor: result.success
                                ? "rgba(34, 197, 94, 0.3)"
                                : "rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${result.success ? "bg-green-500" : "bg-red-500"}`}
                            />
                            <span
                              className={
                                result.success
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {result.success ? result.message : result.error}
                            </span>
                          </div>
                        );
                      }

                      // Default result display for other tools
                      return (
                        <div
                          key={toolCallId}
                          className="mt-4 p-2.5 bg-white/5 rounded-xl border border-white/10 text-[11px] text-zinc-500 font-mono flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {toolName} completed
                        </div>
                      );
                    }

                    // Client-side tool waiting for user interaction
                    if (toolName === "confirmAction") {
                      return (
                        <ConfirmActionCard
                          key={toolCallId}
                          toolCallId={toolCallId}
                          args={args}
                          addToolResult={addToolResult}
                        />
                      );
                    }

                    // Tool is still processing (call state)
                    return (
                      <div
                        key={toolCallId}
                        className="mt-4 flex items-center gap-3 text-xs italic text-zinc-500 bg-zinc-900/50 p-3 rounded-xl border border-dashed border-white/10"
                      >
                        <Loader2
                          size={14}
                          className="animate-spin text-white"
                        />
                        Processing {toolName}...
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 items-start"
          >
            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-white/10 bg-white/5 text-white">
              <Bot size={16} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                WorkenAI
              </div>
              <div className="p-4 rounded-2xl bg-transparent text-zinc-400 flex items-center gap-3">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-[#0d0d0d] relative z-10">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative group"
        >
          <div className="relative flex gap-2 items-center bg-[#212121] border border-white/5 rounded-2xl p-2 pl-4 shadow-2xl focus-within:border-white/10 transition-all">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Message WorkenAI..."
              className="flex-1 bg-transparent py-2.5 text-[#ececec] placeholder:text-zinc-500 focus:outline-none text-[15px]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all active:scale-95 shrink-0"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <div className="mt-2 text-center">
            <p className="text-[10px] text-zinc-600">
              WorkenAI can make mistakes. Check important info.
            </p>
          </div>
        </form>
      </div>

      {modalData && (
        <TableModal
          sheet={modalData.sheet}
          range={modalData.range}
          data={modalData.data}
          onClose={() => setModalData(null)}
          onSelect={handleSelectMention}
        />
      )}
    </div>
  );
}
