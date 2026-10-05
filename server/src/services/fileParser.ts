import * as XLSX from 'xlsx';

export interface ParsedFileData {
  fileName: string;
  fileType: string;
  rowCount: number;
  columns: string[];
  sampleRows: Record<string, any>[];
  columnTypes: Record<string, 'number' | 'string' | 'date' | 'boolean'>;
  numericSummary: Record<string, { min: number; max: number; sum: number; avg: number }>;
}

export function parseFileBuffer(buffer: Buffer, originalName: string, mimeType?: string): ParsedFileData {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';

  // 1. JSON
  if (extension === 'json') {
    try {
      const text = buffer.toString('utf-8');
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      return analyzeRows(rows, originalName, 'json');
    } catch (e: any) {
      throw new Error(`Failed to parse JSON file: ${e.message}`);
    }
  }

  // 2. CSV / TXT / TSV
  if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
      return analyzeRows(rows, originalName, extension);
    } catch (e: any) {
      // Fallback for plain text
      const lines = buffer.toString('utf-8').split('\n').filter(l => l.trim().length > 0);
      const rows = lines.map((line, idx) => ({ line: idx + 1, content: line.slice(0, 300) }));
      return analyzeRows(rows, originalName, 'txt');
    }
  }

  // 3. Excel (.xlsx, .xls, .xlsm, .ods)
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel workbook contains no sheets.');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
    return analyzeRows(rows, originalName, extension || 'xlsx');
  } catch (e: any) {
    throw new Error(`Failed to parse Excel spreadsheet: ${e.message}`);
  }
}

function analyzeRows(rows: Record<string, any>[], fileName: string, fileType: string): ParsedFileData {
  if (!rows || rows.length === 0) {
    return {
      fileName,
      fileType,
      rowCount: 0,
      columns: [],
      sampleRows: [],
      columnTypes: {},
      numericSummary: {},
    };
  }

  const columns = Object.keys(rows[0] || {});
  const sampleRows = rows.slice(0, 15);
  const columnTypes: Record<string, 'number' | 'string' | 'date' | 'boolean'> = {};
  const numericSummary: Record<string, { min: number; max: number; sum: number; avg: number }> = {};

  for (const col of columns) {
    let numCount = 0;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    for (const row of rows) {
      const val = row[col];
      if (typeof val === 'number' && !isNaN(val)) {
        numCount++;
        min = Math.min(min, val);
        max = Math.max(max, val);
        sum += val;
      } else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
        const n = Number(val);
        numCount++;
        min = Math.min(min, n);
        max = Math.max(max, n);
        sum += n;
      }
    }

    if (numCount > rows.length * 0.4) {
      columnTypes[col] = 'number';
      numericSummary[col] = {
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 0 : max,
        sum: Math.round(sum * 100) / 100,
        avg: numCount > 0 ? Math.round((sum / numCount) * 100) / 100 : 0,
      };
    } else {
      columnTypes[col] = 'string';
    }
  }

  return {
    fileName,
    fileType,
    rowCount: rows.length,
    columns,
    sampleRows,
    columnTypes,
    numericSummary,
  };
}
