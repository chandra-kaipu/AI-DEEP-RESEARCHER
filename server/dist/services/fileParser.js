"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFileBuffer = parseFileBuffer;
const XLSX = __importStar(require("xlsx"));
function parseFileBuffer(buffer, originalName, mimeType) {
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    // 1. JSON
    if (extension === 'json') {
        try {
            const text = buffer.toString('utf-8');
            const parsed = JSON.parse(text);
            const rows = Array.isArray(parsed) ? parsed : [parsed];
            return analyzeRows(rows, originalName, 'json');
        }
        catch (e) {
            throw new Error(`Failed to parse JSON file: ${e.message}`);
        }
    }
    // 2. CSV / TXT / TSV
    if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
            return analyzeRows(rows, originalName, extension);
        }
        catch (e) {
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
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        return analyzeRows(rows, originalName, extension || 'xlsx');
    }
    catch (e) {
        throw new Error(`Failed to parse Excel spreadsheet: ${e.message}`);
    }
}
function analyzeRows(rows, fileName, fileType) {
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
    const columnTypes = {};
    const numericSummary = {};
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
            }
            else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
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
        }
        else {
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
