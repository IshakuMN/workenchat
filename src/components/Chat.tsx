"use client";

import { useChat } from "ai/react";
import { Bot, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/db";
import { TableModal } from "./TableModal";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "./chat/ChatInput";
import { ChatMessage } from "./chat/ChatMessage";

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
  const autoScrollRef = useRef(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      autoScrollRef.current = isAtBottom;
    }
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      autoScrollRef.current = true;
    }

    if (autoScrollRef.current && scrollRef.current) {
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
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar relative z-10"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-xl mb-4">
              {/* <Sparkles className="text-white" size={32} /> */}
              <span className="font-bold text-2xl">W.</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Чем я могу помочь вам сегодня?
            </h2>
            <p className="text-zinc-500 max-w-sm">
              Я могу помочь с анализом таблиц, созданием отчетов или ответами на
              вопросы по данным.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              setModalData={setModalData}
              addToolResult={addToolResult}
            />
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

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />

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
