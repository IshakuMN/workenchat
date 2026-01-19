import * as XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";

const data = [
  ["Email", "Name", "Score", "Approved"],
  ["alice@example.com", "Alice", 90, true],
  ["bob@example.com", "Bob", 85, false],
  ["charlie@example.com", "Charlie", 95, true],
];

const worksheet = XLSX.utils.aoa_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

const dir = path.join(process.cwd(), "data");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const filePath = path.join(dir, "example.xlsx");
XLSX.writeFile(workbook, filePath);
console.log(`Created ${filePath}`);
