import { Database } from "bun:sqlite";
import path from "node:path";
import fs from "node:fs";

// Initialize the database directory
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "sqlite.db");
console.log(`Initializing database at ${dbPath}`);
const db = new Database(dbPath, { create: true });

// Basic types for our DB
export type Thread = {
  id: string;
  title: string;
  createdAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
};

// Initialize tables
export function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (threadId) REFERENCES threads(id) ON DELETE CASCADE
    )
  `);
}

// DB Helpers
export const dbHelpers = {
  createThread: (id: string, title: string) => {
    return db.run("INSERT INTO threads (id, title) VALUES (?, ?)", [id, title]);
  },

  getThreads: (): Thread[] => {
    return db.query("SELECT * FROM threads ORDER BY createdAt DESC").all() as Thread[];
  },

  getThreadById: (id: string): Thread | null => {
    return db.query("SELECT * FROM threads WHERE id = ?").get(id) as Thread | null;
  },

  getMessagesByThread: (threadId: string): Message[] => {
    return db.query("SELECT * FROM messages WHERE threadId = ? ORDER BY createdAt ASC").all(threadId) as Message[];
  },

  saveMessage: (message: Omit<Message, "createdAt">) => {
    return db.run(
      "INSERT INTO messages (id, threadId, role, content) VALUES (?, ?, ?, ?)",
      [message.id, message.threadId, message.role, message.content]
    );
  },

  updateThreadTitle: (id: string, title: string) => {
    return db.run("UPDATE threads SET title = ? WHERE id = ?", [title, id]);
  },

  deleteThread: (id: string) => {
    return db.run("DELETE FROM threads WHERE id = ?", [id]);
  }
};

// Auto-initialize on import
initDb();

export default db;
