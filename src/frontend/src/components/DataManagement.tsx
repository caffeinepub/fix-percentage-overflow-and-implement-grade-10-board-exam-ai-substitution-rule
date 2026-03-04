import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, FileJson, FileText, Loader2, Upload } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { AcademicEntry, ExportTypes } from "../backend";
import { useActor } from "../hooks/useActor";
import { ErrorMessage } from "./ErrorMessage";

function bigintReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

function convertBigIntsForImport(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    if (/^\d+$/.test(obj)) return BigInt(obj);
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(convertBigIntsForImport);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      // These fields should remain as strings, not bigints
      const stringFields = [
        "stream",
        "gradeText",
        "scienceSubgroup",
        "commerceSubgroup",
        "name",
        "title",
        "description",
        "sampleInput",
        "sampleOutput",
        "code",
        "result",
      ];
      if (stringFields.includes(key)) {
        result[key] = val;
      } else {
        result[key] = convertBigIntsForImport(val);
      }
    }
    return result;
  }
  return obj;
}

function entriesToCSV(entries: AcademicEntry[]): string {
  if (!entries || entries.length === 0) return "";
  const headers = [
    "grade",
    "term",
    "stream",
    "scienceSubgroup",
    "commerceSubgroup",
    "termTotalMarks",
    "termMaxMarks",
    "termPercentage",
    "gradeText",
    "timestamp",
    "math",
    "english",
    "hindi",
    "evs",
    "computer",
    "kannada",
    "science",
    "ssc",
    "ai",
    "physics",
    "chemistry",
    "biology",
    "economics",
    "businessStudies",
    "accountancy",
    "statistics",
    "management",
    "psychology",
    "pe",
    "maths",
    "appliedMaths",
  ];
  const rows = entries.map((e) => [
    Number(e.grade),
    Number(e.term),
    e.stream ?? "",
    e.scienceSubgroup ?? "",
    e.commerceSubgroup ?? "",
    Number(e.termTotalMarks),
    Number(e.termMaxMarks),
    Number(e.termPercentage),
    e.gradeText,
    Number(e.timestamp),
    e.subjects.math !== undefined ? Number(e.subjects.math) : "",
    e.subjects.english !== undefined ? Number(e.subjects.english) : "",
    e.subjects.hindi !== undefined ? Number(e.subjects.hindi) : "",
    e.subjects.evs !== undefined ? Number(e.subjects.evs) : "",
    e.subjects.computer !== undefined ? Number(e.subjects.computer) : "",
    e.subjects.kannada !== undefined ? Number(e.subjects.kannada) : "",
    e.subjects.science !== undefined ? Number(e.subjects.science) : "",
    e.subjects.ssc !== undefined ? Number(e.subjects.ssc) : "",
    e.subjects.ai !== undefined ? Number(e.subjects.ai) : "",
    e.subjects.physics !== undefined ? Number(e.subjects.physics) : "",
    e.subjects.chemistry !== undefined ? Number(e.subjects.chemistry) : "",
    e.subjects.biology !== undefined ? Number(e.subjects.biology) : "",
    e.subjects.economics !== undefined ? Number(e.subjects.economics) : "",
    e.subjects.businessStudies !== undefined
      ? Number(e.subjects.businessStudies)
      : "",
    e.subjects.accountancy !== undefined ? Number(e.subjects.accountancy) : "",
    e.subjects.statistics !== undefined ? Number(e.subjects.statistics) : "",
    e.subjects.management !== undefined ? Number(e.subjects.management) : "",
    e.subjects.psychology !== undefined ? Number(e.subjects.psychology) : "",
    e.subjects.pe !== undefined ? Number(e.subjects.pe) : "",
    e.subjects.maths !== undefined ? Number(e.subjects.maths) : "",
    e.subjects.appliedMaths !== undefined
      ? Number(e.subjects.appliedMaths)
      : "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export default function DataManagement() {
  const { actor } = useActor();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExportJSON = async () => {
    if (!actor) {
      setExportError("Backend not available. Please try again.");
      return;
    }
    setIsExporting(true);
    setExportError(null);
    try {
      const data = await actor.retrieveDataExportRequest("full-export");
      const json = JSON.stringify(data, bigintReplacer, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academic-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!actor) {
      setExportError("Backend not available. Please try again.");
      return;
    }
    setIsExporting(true);
    setExportError(null);
    try {
      const data = await actor.retrieveDataExportRequest("academic-entries");
      const allEntries: AcademicEntry[] = [];
      for (const [, entries] of data.academicEntries.academicEntries) {
        allEntries.push(...entries);
      }
      const csv = entriesToCSV(allEntries);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academic-entries-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : "CSV export failed. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!actor) {
      setImportError("Backend not available. Please try again.");
      return;
    }
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const converted = convertBigIntsForImport(parsed) as ExportTypes;
      await actor.importData(converted);
      setImportSuccess(true);
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : "Import failed. Please check the file format.",
      );
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your academic and coding data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {exportError && (
            <ErrorMessage
              message={exportError}
              onRetry={() => setExportError(null)}
              retryLabel="Dismiss"
            />
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleExportJSON}
              disabled={isExporting || !actor}
              variant="outline"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Export JSON
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={isExporting || !actor}
              variant="outline"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Import previously exported JSON data. This will overwrite existing
            data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {importError && (
            <ErrorMessage
              message={importError}
              onRetry={() => setImportError(null)}
              retryLabel="Dismiss"
            />
          )}
          {importSuccess && (
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Data imported successfully!
            </div>
          )}
          <label className="cursor-pointer">
            <Button asChild disabled={isImporting || !actor} variant="outline">
              <span>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImporting ? "Importing..." : "Import JSON"}
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
              disabled={isImporting || !actor}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
