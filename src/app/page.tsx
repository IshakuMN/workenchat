import { Sparkles, MessageSquarePlus } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center bg-[#0d0d0d] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 space-y-6 animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
          <span className="font-bold text-4xl">W.</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            WorkenAI
          </h2>
          <p className="max-w-md mx-auto text-zinc-400 leading-relaxed font-medium">
            Ваш персональный помощник для анализа данных и интеллектуальных
            бесед.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full text-xs font-semibold text-zinc-400 flex items-center gap-2">
            <MessageSquarePlus size={14} className="text-white" />
            Нажмите на иконку "Новый чат", чтобы начать
          </div>
        </div>
      </div>
    </div>
  );
}
