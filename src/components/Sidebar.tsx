"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  SquarePen,
  MessageSquare,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  Ellipsis,
} from "lucide-react";
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
    if (confirm("Are you sure you want to delete this conversation?")) {
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

          {/* Secondary Nav Items */}
          <div className="px-3 space-y-0.5">
            <NavItem
              onClick={handleCreateThread}
              icon={<SquarePen size={18} />}
              label={isCollapsed ? "" : "New chat"}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Thread List */}
          <div
            className={cn(
              "flex-1 overflow-y-auto px-3 mt-8 space-y-0.5 custom-scrollbar transition-opacity duration-300",
              isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <div className="px-3 mb-2">
              <span className="text-xs font-medium text-zinc-500">
                Your chats
              </span>
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {threads.map((thread) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  layout
                >
                  <Link
                    href={`/${thread.id}`}
                    className={cn(
                      "flex items-center justify-between group p-3 rounded-xl text-sm transition-all duration-200 relative overflow-hidden",
                      currentThreadId === thread.id
                        ? "bg-[#212121] text-white"
                        : "hover:bg-[#1a1a1a] text-[#ececec]",
                    )}
                  >
                    <div className="flex items-center gap-3 truncate min-w-0">
                      <span className="truncate">
                        {thread.title || "Untitled Chat"}
                      </span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDeleteThread(thread.id, e)}
                        className="p-1 hover:text-red-500 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="p-3 mt-auto">
            <button
              className={cn(
                "w-full flex items-center rounded-xl hover:bg-zinc-800 transition-colors group p-2",
                isCollapsed ? "justify-center" : "justify-between",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1e88e5] flex items-center justify-center text-white text-xs font-bold ring-2 ring-black shrink-0">
                  I
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-white truncate">
                      @ishakumn
                    </span>
                    <span className="text-[11px] text-zinc-500">Free</span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">
                  Upgrade
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Floating Panel Toggle when collapsed removed */}
    </>
  );
}

function NavItem({
  icon,
  label,
  onClick,
  isCollapsed,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isCollapsed?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800 text-sm font-medium text-zinc-400 hover:text-white transition-all",
        isCollapsed ? "justify-center" : "",
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </button>
  );
}
