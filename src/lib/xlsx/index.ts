import * as XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";

const filePath = path.join(process.cwd(), "data", "example.xlsx");

export function getRange(sheetName: string, range: string) {
  if (!fs.existsSync(filePath)) return null;
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range });
  return data;
}

export function updateCell(sheetName: string, cell: string, value: any) {
  if (!fs.existsSync(filePath)) return false;
  const workbook = XLSX.readFile(filePath);
  let sheet = workbook.Sheets[sheetName];
  if (!sheet) return false;

  XLSX.utils.sheet_add_aoa(sheet, [[value]], { origin: cell });
  XLSX.writeFile(workbook, filePath);
  return true;
}

export function getAllData(sheetName: string) {
  if (!fs.existsSync(filePath)) return null;
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return data;
}

export function getSheets() {
  if (!fs.existsSync(filePath)) return [];
  const workbook = XLSX.readFile(filePath);
  return workbook.SheetNames;
}
