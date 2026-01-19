import { NextResponse } from "next/server";
import { dbHelpers } from "@/db";

export async function GET() {
  const threads = dbHelpers.getThreads();
  return NextResponse.json(threads);
}

export async function POST() {
  const id = Math.random().toString(36).substring(7);
  dbHelpers.createThread(id, "");
  return NextResponse.json({ id });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  
  dbHelpers.deleteThread(id);
  return NextResponse.json({ success: true });
}
