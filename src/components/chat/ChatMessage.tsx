"use client";

import { Message } from "ai/react";
import { Bot, User, Maximize2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConfirmActionCard } from "./ConfirmActionCard";

interface ChatMessageProps {
  message: Message;
  setModalData: (
    data: {
      sheet: string;
      range: string;
      data: any[][];
    } | null,
  ) => void;
  addToolResult: (result: { toolCallId: string; result: string }) => void;
}

export function ChatMessage({
  message: m,
  setModalData,
  addToolResult,
}: ChatMessageProps) {
  return (
    <motion.div
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
            const { toolCallId, toolName, state, args } = toolInvocation;

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
                        + ещё {result.data.length - 5} строк • Нажмите, чтобы
                        развернуть
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
                        result.success ? "text-green-400" : "text-red-400"
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
                  {toolName} выполнено
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
                <Loader2 size={14} className="animate-spin text-white" />
                Обработка {toolName}...
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
