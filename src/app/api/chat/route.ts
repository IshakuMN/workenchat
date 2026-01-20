import { google } from "@ai-sdk/google";
import { streamText, convertToCoreMessages, tool } from "ai";
import { dbHelpers } from "@/db";
import { z } from "zod";
import { getRange, getAllData, updateCell, getSheets } from "@/lib/xlsx";

function getSystemPrompt() {
  const sheets = getSheets();
  return `Вы — WorkenAI, полезный и знающий ИИ-ассистент. Вы можете помогать с общими вопросами, вести беседы, а также работать с Excel-таблицами.

У вас есть доступ к Excel-файлу со следующими листами: ${sheets.length > 0 ? sheets.join(", ") : "Sheet1"}

Для задач, связанных с Excel, у вас есть следующие инструменты:
1. **readTable**: Чтение данных из таблицы. Используйте это, когда пользователь спрашивает о данных в таблице.
   - Всегда указывайте имя листа (например, "Sheet1")
   - Опционально указывайте диапазон, например "A1:D10"
   
2. **confirmAction**: Используйте это ПЕРЕД любым действием записи/обновления/удаления. Это показывает диалог подтверждения пользователю.
   - ВАЖНО: Всегда включайте параметры sheet, cell и value, чтобы действие могло быть выполнено после подтверждения.
   - Пример: confirmAction({ action: "update", message: "Обновить A2 на test@email.com?", sheet: "Sheet1", cell: "A2", value: "test@email.com" })
   
3. **writeCell**: Запись значения в конкретную ячейку. Используйте это ТОЛЬКО ПОСЛЕ того, как пользователь подтвердит через confirmAction.

ВАЖНЫЙ ПРОЦЕСС ДЛЯ ЗАПИСИ:
Когда пользователь просит изменить/обновить/записать данные в ячейку:
1. Вызовите confirmAction с action="update", понятным сообщением И параметрами sheet, cell и value.
2. Ждите ответа пользователя.
3. Система автоматически выполнит запись после подтверждения.

Когда пользователи упоминают ссылки на ячейки, например @Sheet1!A1:B3, интерпретируйте их как ссылки на конкретные ячейки или диапазоны в таблице.

При отображении данных таблицы суммируйте ключевую информацию и сообщайте пользователю, что он может нажать, чтобы развернуть просмотр таблицы.

На общие вопросы (не связанные с таблицей) отвечайте прямо и полезно, как обычный ИИ-ассистент. Вы не ограничены только задачами с таблицами. Отвечайте всегда на русском языке, если не попросят иного.`;
}

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    return new Response(JSON.stringify({ error: "Missing API Key" }), {
      status: 500,
    });
  }

  const coreMessages = convertToCoreMessages(messages);
  const lastUserMessage = coreMessages[coreMessages.length - 1];

  // 1. Save user message to DB
  if (lastUserMessage?.role === "user") {
    dbHelpers.saveMessage({
      id:
        messages[messages.length - 1].id ||
        Math.random().toString(36).substring(7),
      threadId,
      role: "user",
      content:
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content),
    });
  }

  // 2. Generate title if thread title is empty
  const thread = dbHelpers.getThreadById(threadId);
  if (thread && !thread.title && lastUserMessage?.role === "user") {
    const content =
      typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : "Новый чат";
    const title = content.substring(0, 50);
    dbHelpers.updateThreadTitle(threadId, title);
  }

  try {
    const result = await streamText({
      model: google("gemini-2.5-flash") as any,
      system: getSystemPrompt(),
      messages: coreMessages,
      tools: {
        // Client-side tool for confirmation with pending action details
        confirmAction: tool({
          description:
            "Ask the user to confirm a dangerous action like updating or deleting data. Include all the details needed to perform the action after confirmation.",
          parameters: z.object({
            action: z
              .string()
              .describe("The action type: 'update' or 'delete'"),
            message: z
              .string()
              .describe(
                "A clear message explaining what will happen if confirmed",
              ),
            // Include the pending action details so we can execute after confirmation
            sheet: z
              .string()
              .optional()
              .describe("Sheet name for the pending action"),
            cell: z
              .string()
              .optional()
              .describe("Cell reference for the pending action"),
            value: z
              .string()
              .optional()
              .describe("Value to write for the pending action"),
          }),
          // No execute - this is handled on the client
        }),

        // Server-side tool for reading table data
        readTable: tool({
          description:
            "Read data from the Excel spreadsheet. Returns the data as a 2D array.",
          parameters: z.object({
            sheet: z.string().describe("The sheet name, e.g., 'Sheet1'"),
            range: z
              .string()
              .optional()
              .describe(
                "Optional cell range like 'A1:D10'. If not provided, returns all data.",
              ),
          }),
          execute: async ({ sheet, range }) => {
            try {
              const data = range ? getRange(sheet, range) : getAllData(sheet);
              if (!data) {
                return {
                  error: `Sheet "${sheet}" not found or file doesn't exist`,
                  sheet,
                  range: range || "All",
                };
              }
              return { data, sheet, range: range || "All" };
            } catch (error) {
              return { error: String(error), sheet, range: range || "All" };
            }
          },
        }),

        // Server-side tool for writing to a cell - can be called directly after confirmation
        writeCell: tool({
          description:
            "Write a value to a specific cell in the spreadsheet. Call this after the user has confirmed the action via confirmAction.",
          parameters: z.object({
            sheet: z.string().describe("The sheet name"),
            cell: z.string().describe("The cell reference like 'A1' or 'B5'"),
            value: z
              .string()
              .describe("The value to write (text or number as string)"),
          }),
          execute: async ({ sheet, cell, value }) => {
            try {
              const success = updateCell(sheet, cell, value);
              if (success) {
                return {
                  success: true,
                  message: `Успешно обновлено ${sheet}!${cell} на "${value}"`,
                };
              }
              return {
                success: false,
                error: `Ошибка обновления ${sheet}!${cell}`,
              };
            } catch (error) {
              return { success: false, error: String(error) };
            }
          },
        }),
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
