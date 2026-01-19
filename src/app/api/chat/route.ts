import { google } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";
import { dbHelpers } from "@/db";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });
  }
  // console.log("API Key found:", apiKey.substring(0, 5) + "...");

  const coreMessages = convertToCoreMessages(messages);
  const lastUserMessage = coreMessages[coreMessages.length - 1];

  // 1. Save user message to DB
  if (lastUserMessage.role === "user") {
    dbHelpers.saveMessage({
      id: messages[messages.length - 1].id || Math.random().toString(36).substring(7),
      threadId,
      role: "user",
      content: typeof lastUserMessage.content === "string" 
        ? lastUserMessage.content 
        : JSON.stringify(lastUserMessage.content),
    });
  }

  // 2. Generate title if thread title is empty
  const thread = dbHelpers.getThreadById(threadId);
  if (thread && !thread.title && lastUserMessage.role === "user") {
    const content = typeof lastUserMessage.content === "string" 
      ? lastUserMessage.content 
      : "New Chat";
    const title = content.substring(0, 50);
    dbHelpers.updateThreadTitle(threadId, title);
  }

  try {
    const result = await streamText({
      model: google("gemini-3-flash-preview") as any,
      messages: coreMessages,
    tools: {
      confirmAction: {
        description: "Ask the user to confirm a dangerous action (update/delete).",
        parameters: z.object({
          action: z.string().describe("The action to be performed."),
          message: z.string().describe("The message to show to the user."),
        }),
      },
      showTablePreview: {
        description: "Display a preview of XLSX table data.",
        parameters: z.object({
          sheet: z.string(),
          range: z.string(),
          data: z.any().describe("2D array of cell data"),
        }),
      },
      readTable: {
        description: "Read data from the XLSX table.",
        parameters: z.object({
          sheet: z.string(),
          range: z.string().optional().describe("Optional range like 'A1:B10'"),
        }),
        execute: async ({ sheet, range }: { sheet: string, range?: string }) => {
          const { getRange, getAllData } = await import("@/lib/xlsx");
          const data = range ? getRange(sheet, range) : getAllData(sheet);
          return { data, sheet, range: range || "All" };
        },
      },
      updateTable: {
        description: "Update a cell in the XLSX table. REQUIRES user confirmation first via confirmAction.",
        parameters: z.object({
          sheet: z.string(),
          cell: z.string(),
          value: z.any(),
          confirmed: z.boolean().describe("Must be true to execute."),
        }),
        execute: async ({ sheet, cell, value, confirmed }: { sheet: string, cell: string, value: any, confirmed: boolean }) => {
          if (!confirmed) return { error: "Action not confirmed by user." };
          const { updateCell } = await import("@/lib/xlsx");
          const success = updateCell(sheet, cell, value);
          return { success, sheet, cell, value };
        },
      },
    },
    onFinish: async ({ text }) => {
      // 3. Save assistant message to DB
      if (text) {
        dbHelpers.saveMessage({
          id: Math.random().toString(36).substring(7),
          threadId,
          role: "assistant",
          content: text,
        });
      }
    },
  });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    // Return a JSON response so the client can display the error text if needed
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
