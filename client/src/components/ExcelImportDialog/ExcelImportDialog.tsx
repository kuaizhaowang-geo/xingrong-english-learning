"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Download, ArrowRight, CheckCircle, XCircle, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@lark-apaas/client-toolkit/logger";

// ─── Types ───────────────────────────────────────────────────────────

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
  examples?: string[];
}

export interface ImportResult {
  success: number;
  failed: number;
  errors?: { row: number; field?: string; reason: string }[];
}

export interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  columns: ImportColumn[];
  sampleTemplate: Record<string, string>;
  onConfirm: (rows: Record<string, string>[]) => Promise<ImportResult>;
}

type Step = 1 | 2 | 3 | 4;

// ─── Helpers ──────────────────────────────────────────────────────────

const PRIMARY_COLOR = "#4361EE";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parseFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("文件读取失败"));
          return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error("文件中没有工作表"));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: "",
          raw: false,
        });
        // Normalize all values to strings
        const normalized: Record<string, string>[] = jsonData.map(
          (row: Record<string, unknown>) => {
            const result: Record<string, string> = {};
            for (const key of Object.keys(row)) {
              result[key] = row[key] != null ? String(row[key]) : "";
            }
            return result;
          },
        );
        resolve(normalized);
      } catch (err) {
        logger.error("Excel parse error:", err);
        reject(new Error("文件解析失败，请检查文件格式"));
      }
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate(
  columns: ImportColumn[],
  sampleData: Record<string, string>,
  filename: string,
): void {
  const headers: Record<string, string> = {};
  const sampleRow: Record<string, string> = {};
  for (const col of columns) {
    headers[col.label] = col.label;
    sampleRow[col.label] = sampleData[col.key] ?? "";
  }
  // Use header row + sample row
  const data = [headers, sampleRow];
  const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "导入模板");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Auto-match headers to column keys by label
function autoMatchMapping(
  headers: string[],
  columns: ImportColumn[],
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedKeys = new Set<string>();
  for (const header of headers) {
    const trimmed = header.trim();
    const matched = columns.find(
      (c: ImportColumn) =>
        (c.label === trimmed || c.key === trimmed) && !usedKeys.has(c.key),
    );
    if (matched) {
      mapping[header] = matched.key;
      usedKeys.add(matched.key);
    } else {
      mapping[header] = "";
    }
  }
  return mapping;
}

// Apply mapping to raw rows → rows keyed by column.key
function applyMapping(
  rawRows: Record<string, string>[],
  mapping: Record<string, string>,
): Record<string, string>[] {
  return rawRows.map((row: Record<string, string>) => {
    const result: Record<string, string> = {};
    for (const [header, key] of Object.entries(mapping)) {
      if (key && row[header] !== undefined) {
        result[key] = row[header];
      }
    }
    return result;
  });
}

// ─── Component ────────────────────────────────────────────────────────

const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({
  open,
  onOpenChange,
  title = "批量导入",
  columns,
  sampleTemplate,
  onConfirm,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string>("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep(1);
      setFile(null);
      setRawRows([]);
      setHeaders([]);
      setMapping({});
      setParseError("");
      setImportResult(null);
      setIsParsing(false);
      setIsImporting(false);
    }
  }, [open]);

  const previewRows = useMemo(() => rawRows.slice(0, 10), [rawRows]);
  const totalRows = rawRows.length;

  const requiredMissing = useMemo(() => {
    const mappedKeys = new Set(Object.values(mapping).filter(Boolean));
    return columns.filter((c: ImportColumn) => c.required && !mappedKeys.has(c.key));
  }, [mapping, columns]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setParseError("");
      setFile(selectedFile);
      setIsParsing(true);
      try {
        const rows = await parseFile(selectedFile);
        setRawRows(rows);
        if (rows.length > 0) {
          const hdrs = Object.keys(rows[0]);
          setHeaders(hdrs);
          setMapping(autoMatchMapping(hdrs, columns));
        } else {
          setHeaders([]);
          setMapping({});
        }
        setStep(2);
      } catch (err) {
        const message = err instanceof Error ? err.message : "解析失败";
        setParseError(message);
        setRawRows([]);
        setHeaders([]);
        setMapping({});
      } finally {
        setIsParsing(false);
      }
    },
    [columns],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        void handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        void handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect],
  );

  const handleDownloadTemplate = useCallback(() => {
    downloadTemplate(columns, sampleTemplate, "导入模板");
  }, [columns, sampleTemplate]);

  const handleMappingChange = useCallback((header: string, key: string) => {
    setMapping((prev) => ({ ...prev, [header]: key }));
  }, []);

  const handleImport = useCallback(async () => {
    const mappedRows = applyMapping(rawRows, mapping);
    setIsImporting(true);
    try {
      const result = await onConfirm(mappedRows);
      setImportResult(result);
      setStep(4);
    } catch (err) {
      logger.error("Import error:", err);
      setImportResult({
        success: 0,
        failed: mappedRows.length,
        errors: [{ row: 0, reason: err instanceof Error ? err.message : "导入失败" }],
      });
      setStep(4);
    } finally {
      setIsImporting(false);
    }
  }, [rawRows, mapping, onConfirm]);

  const handleReset = useCallback(() => {
    setStep(1);
    setFile(null);
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setParseError("");
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    if (!isImporting) {
      onOpenChange(false);
    }
  }, [isImporting, onOpenChange]);

  // ─── Step Renderers ────────────────────────────────────────────────

  const renderStep1 = (): React.ReactNode => (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-[#4361EE] bg-[#4361EE]/5"
            : "border-gray-200 hover:border-[#4361EE] hover:bg-gray-50",
        )}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#4361EE15" }}
          >
            <Upload className="w-7 h-7" style={{ color: PRIMARY_COLOR }} />
          </div>
          <div className="text-base font-medium text-gray-800">
            拖拽文件到此处，或点击上传
          </div>
          <div className="text-sm text-gray-500">
            支持 .xlsx / .xls / .csv 格式
          </div>
          {isParsing && (
            <div className="flex items-center gap-2 text-sm" style={{ color: PRIMARY_COLOR }}>
              <RefreshCw className="w-4 h-4 animate-spin" />
              正在解析文件...
            </div>
          )}
          {parseError && (
            <div className="text-sm text-red-500">{parseError}</div>
          )}
        </div>
      </div>

      {file && !parseError && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <FileText className="w-5 h-5 text-gray-400" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">
              {file.name}
            </div>
            <div className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            移除
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm hover:underline"
          style={{ color: PRIMARY_COLOR }}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            handleDownloadTemplate();
          }}
        >
          <Download className="w-4 h-4" />
          下载导入模板
        </button>
      </div>
    </div>
  );

  const renderStep2 = (): React.ReactNode => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          共识别到{" "}
          <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
            {totalRows}
          </span>{" "}
          行数据，以下为前 {previewRows.length} 行预览
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200 w-12">
                #
              </th>
              {headers.map((h: string) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="px-3 py-8 text-center text-gray-400"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              previewRows.map((row: Record<string, string>, idx: number) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                  {headers.map((h: string) => (
                    <td key={h} className="px-3 py-2 text-gray-700">
                      {row[h] ?? ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep3 = (): React.ReactNode => (
    <div className="space-y-4">
      {requiredMissing.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <XCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-amber-700">
            必填字段未全部映射：
            {requiredMissing.map((c: ImportColumn) => c.label).join("、")}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {headers.map((header: string) => {
          const currentKey = mapping[header] ?? "";
          const matchedCol = columns.find((c: ImportColumn) => c.key === currentKey);
          const isRequiredMatched = matchedCol?.required;
          return (
            <div
              key={header}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {header}
                </div>
                <div className="text-xs text-gray-400">表头列</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div className="w-44">
                <Select
                  value={currentKey}
                  onValueChange={(val: string) => handleMappingChange(header, val)}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-white",
                      isRequiredMatched && "border-green-400",
                    )}
                    size="sm"
                  >
                    <SelectValue placeholder="不导入此列" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不导入此列</SelectItem>
                    {columns.map((col: ImportColumn) => (
                      <SelectItem key={col.key} value={col.key}>
                        {col.label}
                        {col.required && (
                          <span className="text-red-400 ml-1">*</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-400 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
        绿色边框表示已映射到必填字段
      </div>
    </div>
  );

  const renderStep4 = (): React.ReactNode => {
    if (!importResult) return null;
    const hasErrors = importResult.errors && importResult.errors.length > 0;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-600">
              {importResult.success}
            </div>
            <div className="text-sm text-green-600">成功</div>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-red-500">
              {importResult.failed}
            </div>
            <div className="text-sm text-red-500">失败</div>
          </div>
        </div>

        {hasErrors && importResult.errors && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">失败详情</div>
            <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200 w-16">
                      行号
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200 w-24">
                      字段
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200">
                      原因
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.errors.map(
                    (
                      err: { row: number; field?: string; reason: string },
                      idx: number,
                    ) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <td className="px-3 py-2 text-gray-600">
                          {err.row > 0 ? err.row : "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {err.field ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-red-500">{err.reason}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importResult.failed === 0 && importResult.success > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
            🎉 全部导入成功！
          </div>
        )}
      </div>
    );
  };

  // ─── Footer Buttons ────────────────────────────────────────────────

  const renderFooter = (): React.ReactNode => {
    if (step === 1) {
      return (
        <>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <Button variant="outline" onClick={handleReset}>
            重新上传
          </Button>
          <Button
            style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
            onClick={() => setStep(3)}
          >
            下一步：字段映射
          </Button>
        </>
      );
    }
    if (step === 3) {
      const canImport = requiredMissing.length === 0 && totalRows > 0;
      return (
        <>
          <Button variant="outline" onClick={() => setStep(2)}>
            上一步
          </Button>
          <Button
            style={{
              backgroundColor: canImport ? PRIMARY_COLOR : undefined,
              borderColor: canImport ? PRIMARY_COLOR : undefined,
            }}
            disabled={!canImport || isImporting}
            onClick={() => void handleImport()}
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                导入中...
              </>
            ) : (
              "开始导入"
            )}
          </Button>
        </>
      );
    }
    // step 4
    return (
      <>
        <Button variant="outline" onClick={handleReset}>
          继续导入
        </Button>
        <Button
          style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
          onClick={handleClose}
        >
          完成
        </Button>
      </>
    );
  };

  // ─── Step Indicator ────────────────────────────────────────────────

  const steps = [
    { num: 1, label: "上传文件" },
    { num: 2, label: "数据预览" },
    { num: 3, label: "字段映射" },
    { num: 4, label: "导入结果" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "sm:max-w-2xl",
          step === 4 && importResult?.errors && importResult.errors.length > 0
            ? "sm:max-w-2xl"
            : "",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-2">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    step > s.num
                      ? "bg-green-500 text-white"
                      : step === s.num
                      ? "text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                  style={step === s.num ? { backgroundColor: PRIMARY_COLOR } : undefined}
                >
                  {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <div
                  className={cn(
                    "text-xs",
                    step >= s.num ? "text-gray-700" : "text-gray-400",
                  )}
                >
                  {s.label}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 rounded-full",
                    step > s.num ? "bg-green-500" : "bg-gray-200",
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[280px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ExcelImportDialog };
export default ExcelImportDialog;
