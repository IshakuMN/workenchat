import { dbHelpers } from "@/db";
import { Chat } from "@/components/Chat";
import { notFound } from "next/navigation";

interface ThreadPageProps {
  params: Promise<{ threadId: string }>;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params;

  const thread = dbHelpers.getThreadById(threadId);
  if (!thread) {
    notFound();
  }

  const initialMessages = dbHelpers.getMessagesByThread(threadId);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <header className="px-6 py-3 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex flex-col min-w-0">
          <h1 className="font-bold text-white truncate text-sm tracking-tight">
            {thread.title || "Untitled Chat"}
          </h1>
          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            {threadId.substring(0, 8)}...
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <Chat threadId={threadId} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
