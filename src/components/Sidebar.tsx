"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SquarePen, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Thread } from "@/db";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const params = useParams();
  const router = useRouter();
  const currentThreadId = params?.threadId as string;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchThreads = async () => {
    const res = await fetch("/api/threads");
    if (res.ok) {
      const data = await res.json();
      setThreads(data);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [currentThreadId]);

  const handleCreateThread = async () => {
    try {
      const res = await fetch("/api/threads", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        router.push(`/${data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Вы уверены, что хотите удалить этот диалог?")) {
      const res = await fetch(`/api/threads?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (currentThreadId === id) {
          router.push("/");
        } else {
          fetchThreads();
        }
      }
    }
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 68 : 260 }}
        onClick={() => isCollapsed && setIsCollapsed(false)}
        className={cn(
          "bg-[#0d0d0d] border-r border-white/5 flex flex-col h-full text-[#ececec] relative transition-all duration-300 ease-in-out overflow-hidden group/sidebar",
          isCollapsed ? "cursor-pointer hover:bg-zinc-900/50" : "",
        )}
      >
        <div className="flex flex-col h-full w-full">
          {/* Top Header */}
          <div
            className={cn(
              "p-3 mb-2 flex items-center",
              isCollapsed ? "flex-col gap-4" : "justify-between",
            )}
          >
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-lg">
                W.
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              {isCollapsed ? (
                <ChevronsRight size={18} />
              ) : (
                <ChevronsLeft size={18} />
              )}
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-3 mb-6">
            <button
              onClick={handleCreateThread}
              className={cn(
                "flex items-center gap-3 w-full  text-white hover:bg-zinc-900 transition-all rounded-xl p-3 shadow-md active:scale-95 group",
                isCollapsed ? "justify-center p-3" : "",
              )}
            >
              <SquarePen size={18} />
              {!isCollapsed && (
                <span className="font-semibold text-sm">Новый чат</span>
              )}
            </button>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-2 custom-scrollbar">
            {!isCollapsed && (
              <div className="px-2 text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
                История
              </div>
            )}

            <AnimatePresence initial={false}>
              {threads.map((thread) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Link
                    href={`/${thread.id}`}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-xl transition-all relative overflow-hidden",
                      currentThreadId === thread.id
                        ? "bg-[#212121] text-white shadow-inner"
                        : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200",
                      isCollapsed ? "justify-center" : "",
                    )}
                  >
                    {!isCollapsed && (
                      <span className="text-sm truncate pr-8 flex-1">
                        {thread.title || "Новый чат"}
                      </span>
                    )}

                    {!isCollapsed && (
                      <button
                        onClick={(e) => handleDeleteThread(thread.id, e)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>

            {threads.length === 0 && !isCollapsed && (
              <div className="text-center py-10">
                <p className="text-zinc-600 text-xs">Нет диалогов</p>
              </div>
            )}
          </div>

          {/* User Profile / Footer */}
          <div className="p-3 mt-auto border-t border-white/5">
            <div
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a1a1a] transition-colors cursor-pointer text-zinc-400 hover:text-zinc-200",
                isCollapsed ? "justify-center" : "",
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-black">
                I
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    tg:@ishakumn
                  </span>
                  <span className="text-[10px] text-zinc-500">Free Plan</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity",
          !isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => !isCollapsed && setIsCollapsed(true)}
      />
    </>
  );
}
