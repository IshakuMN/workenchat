"use client";

import { Loader2, Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  return (
    <div className="p-4 md:p-6 bg-[#0d0d0d] relative z-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto relative group"
      >
        <div className="relative flex gap-2 items-center bg-[#212121] border border-white/5 rounded-2xl p-2 pl-4 shadow-2xl focus-within:border-white/10 transition-all">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Сообщение WorkenAI..."
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
            WorkenAI может ошибаться. Проверяйте важную информацию.
          </p>
        </div>
      </form>
    </div>
  );
}
