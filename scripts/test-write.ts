import { updateCell } from "../src/lib/xlsx/index.ts";
import path from "node:path";

const filePath = path.join(process.cwd(), "data", "example.xlsx");
console.log("Testing write to:", filePath);

try {
  const success = updateCell("Sheet1", "B2", "Test Value " + Date.now());
  console.log("Update success:", success);
} catch (e) {
  console.error("Update failed with error:", e);
}
