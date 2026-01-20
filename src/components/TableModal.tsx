"use client";

import { useState } from "react";
import { X, Table, Grid3X3, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TableModalProps {
  sheet: string;
  range: string;
  data: any[][];
  onClose: () => void;
  onSelect: (selection: string) => void;
}

export function TableModal({
  sheet,
  range,
  data,
  onClose,
  onSelect,
}: TableModalProps) {
  const [selectedRange, setSelectedRange] = useState<{
    start: [number, number];
    end: [number, number];
  } | null>(null);

  const getCellLabel = (r: number, c: number) => {
    const colLabel = String.fromCharCode(65 + c);
    return `${colLabel}${r + 1}`;
  };

  const handleCellClick = (r: number, c: number) => {
    if (!selectedRange) {
      setSelectedRange({ start: [r, c], end: [r, c] });
    } else {
      setSelectedRange({ ...selectedRange, end: [r, c] });
    }
  };

  const formatSelection = () => {
    if (!selectedRange) return "";
    const { start, end } = selectedRange;
    const r1 = Math.min(start[0], end[0]);
    const c1 = Math.min(start[1], end[1]);
    const r2 = Math.max(start[0], end[0]);
    const c2 = Math.max(start[1], end[1]);

    const s1 = getCellLabel(r1, c1);
    const s2 = getCellLabel(r2, c2);

    return `@${sheet}!${s1}${s1 === s2 ? "" : ":" + s2}`;
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-[#171717] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
              <Table size={20} />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight leading-none mb-1">
                {sheet}
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                {range}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-[#0d0d0d] custom-scrollbar">
          <div className="rounded-xl border border-white/5 overflow-hidden bg-[#0d0d0d]">
            <table className="border-collapse min-w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 border border-white/5 bg-zinc-900/80 w-10"></th>
                  {data[0]?.map((_, i) => (
                    <th
                      key={i}
                      className="p-2 border border-white/5 bg-zinc-900/80 font-mono text-zinc-500 font-medium"
                    >
                      {String.fromCharCode(65 + i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, r) => (
                  <tr key={r}>
                    <td className="p-2 border border-white/5 bg-zinc-900/50 text-center font-mono text-[10px] text-zinc-500">
                      {r + 1}
                    </td>
                    {row.map((cell, c) => {
                      const isSelected =
                        selectedRange &&
                        r >=
                          Math.min(
                            selectedRange.start[0],
                            selectedRange.end[0],
                          ) &&
                        r <=
                          Math.max(
                            selectedRange.start[0],
                            selectedRange.end[0],
                          ) &&
                        c >=
                          Math.min(
                            selectedRange.start[1],
                            selectedRange.end[1],
                          ) &&
                        c <=
                          Math.max(
                            selectedRange.start[1],
                            selectedRange.end[1],
                          );

                      return (
                        <td
                          key={c}
                          onClick={() => handleCellClick(r, c)}
                          className={cn(
                            "p-3 border border-white/5 cursor-pointer transition-all min-w-[100px] text-zinc-300",
                            isSelected
                              ? "bg-white/10 text-white border-white/20"
                              : "hover:bg-zinc-800/30",
                          )}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-[#171717] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Grid3X3 size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                Выделение
              </span>
              <span className="text-sm font-mono text-white font-bold">
                {formatSelection() || "Нет выделения"}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedRange(null)}
              className="px-5 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl text-sm font-medium transition-all active:scale-95"
            >
              Сбросить
            </button>
            <button
              disabled={!selectedRange}
              onClick={() => {
                onSelect(formatSelection());
                onClose();
              }}
              className="px-6 py-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all active:scale-95 text-sm font-bold flex items-center gap-2"
            >
              <Check size={16} />
              Применить
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
