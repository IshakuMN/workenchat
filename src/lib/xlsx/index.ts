import * as XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";

const filePath = path.join(process.cwd(), "data", "example.xlsx");

function readWorkbook() {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    return XLSX.read(fileBuffer, { type: "buffer" });
  } catch (error) {
    console.error("Error reading workbook:", error);
    return null;
  }
}

export function getRange(sheetName: string, range: string) {
  const workbook = readWorkbook();
  if (!workbook) return null;

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range });
  return data;
}

export function updateCell(sheetName: string, cell: string, value: any) {
  try {
    const workbook = readWorkbook();
    if (!workbook) {
      console.error("updateCell: Workbook not found");
      return false;
    }

    let sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.error(`updateCell: Sheet ${sheetName} not found`);
      return false;
    }

    XLSX.utils.sheet_add_aoa(sheet, [[value]], { origin: cell });
    // Use fs.writeFileSync explicitly for better control/debugging than XLSX.writeFile
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (error) {
    console.error("updateCell Error:", error);
    throw error;
  }
}

export function getAllData(sheetName: string) {
  const workbook = readWorkbook();
  if (!workbook) return null;

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return data;
}

export function getSheets(): string[] {
  try {
    const workbook = readWorkbook();
    if (!workbook) return [];
    return workbook.SheetNames;
  } catch (error) {
    console.error("Error getting sheets:", error);
    return [];
  }
}
