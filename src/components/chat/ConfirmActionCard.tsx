"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ConfirmActionCard({
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
        setResultMessage(`✗ Ошибка: ${error}`);
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
        <p className="text-sm text-zinc-400">✗ Действие отменено</p>
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
          {isProcessing ? "Обработка..." : "Да, подтвердить"}
        </button>
        <button
          onClick={() => setIsCancelled(true)}
          disabled={isProcessing}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg hover:bg-zinc-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
