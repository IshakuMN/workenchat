# AI Chat with Generative UI & XLSX Integration

A simplified ChatGPT-like interface built with Next.js, Bun, SQLite, and the Vercel AI SDK.

## Features

- **Chat Threads**: Persistent threads stored in SQLite.
- **AI Streaming**: Responses streamed via Vercel AI SDK `useChat`.
- **Generative UI**: Client-side tools rendering interactive UI components.
- **Dangerous Actions Confirmation**: Built-in flow for confirming destructive actions (Update/Delete).
- **XLSX Integration**: Read and update Excel files with a real-time table preview and grid selection.
- **Table Mentions**: Select ranges in a grid modal and insert them as mentions (e.g., `@Sheet1!A1:B3`) for the AI to process.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime/DB**: Bun 1.3+ & `bun:sqlite`
- **AI SDK**: Vercel AI SDK (Generative UI)
- **Styling**: Tailwind CSS & Lucide Icons
- **Parsing**: `xlsx` library

## Setup & Run

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Initialize Database and Data**:
   The database and example XLSX file are automatically initialized in the `data/` directory upon first run or via script.

   ```bash
   bun run scripts/create-xlsx.ts
   ```

3. **Configure Environment**:
   Create a `.env.local` file and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Run Development Server**:
   ```bash
   bun run dev
   ```

## Folder Structure

- `/src/app`: Routes and API endpoints.
- `/src/db`: SQLite initialization and helpers.
- `/src/lib/ai`: AI tools and logic.
- `/src/lib/xlsx`: XLSX read/write logic.
- `/src/components`: UI components (Sidebar, Chat, TableModal, etc.).
- `/data`: SQLite DB and `example.xlsx` storage.

## Implementation Details

- **Persistence**: Messages are saved to SQLite on every interaction.
- **Confirmation**: Destructive tools trigger a UI card with Yes/No buttons before proceeding.
- **Mentions**: The `@Sheet!Range` format is used to help the model identify specific data slices.
