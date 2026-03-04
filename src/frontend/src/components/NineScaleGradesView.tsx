import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState } from "react";
import type { AcademicEntry } from "../backend";
import { useGetAcademicEntries } from "../hooks/useQueries";
import {
  calculateNineScaleFromPercentage,
  getNineScaleGradeColor,
} from "../lib/gradeCalculation";
import { getExpectedMaxMarksForSubjectKey } from "../lib/maxMarks";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingState } from "./LoadingState";

const SUBJECT_LABELS: Record<string, string> = {
  math: "Maths",
  english: "English",
  hindi: "Hindi",
  evs: "EVS",
  computer: "Computer",
  kannada: "Kannada",
  science: "Science",
  ssc: "SSC",
  ai: "AI",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  economics: "Economics",
  businessStudies: "Business Studies",
  accountancy: "Accountancy",
  statistics: "Statistics",
  management: "Management",
  psychology: "Psychology",
  pe: "P.E.",
  appliedMaths: "Applied Maths",
  maths: "Maths (Elective)",
};

const ALL_SUBJECT_KEYS = [
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
  "appliedMaths",
  "maths",
] as const;

function getSubjectNineScale(
  entry: AcademicEntry,
  subjectKey: string,
): {
  marks: number;
  maxMarks: number;
  percentage: number;
  scale: number;
} | null {
  const subjects = entry.subjects as Record<string, bigint | undefined>;
  const rawVal = subjects[subjectKey];
  if (rawVal === undefined || rawVal === null) return null;

  const marks = Number(rawVal);
  const grade = Number(entry.grade);
  const term = Number(entry.term);

  // Always use the authoritative grade-based max marks — stored values may be stale
  const maxMarks = getExpectedMaxMarksForSubjectKey(subjectKey, grade, term);
  if (maxMarks === 0) return null;

  const percentage = Math.min(100, (marks / maxMarks) * 100);
  const scale = calculateNineScaleFromPercentage(percentage);

  return { marks, maxMarks, percentage, scale };
}

export default function NineScaleGradesView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterTerm, setFilterTerm] = useState<string>("all");

  if (isLoading) return <LoadingState message="Loading nine-scale grades..." />;
  if (error) return <ErrorMessage message="Failed to load academic entries." />;

  const uniqueGrades = Array.from(
    new Set(entries.map((e) => Number(e.grade))),
  ).sort((a, b) => a - b);
  const uniqueTerms = Array.from(
    new Set(
      entries
        .filter(
          (e) =>
            filterGrade === "all" || Number(e.grade) === Number(filterGrade),
        )
        .map((e) => Number(e.term)),
    ),
  ).sort((a, b) => a - b);

  const filtered = entries.filter((e) => {
    if (filterGrade !== "all" && Number(e.grade) !== Number(filterGrade))
      return false;
    if (filterTerm !== "all" && Number(e.term) !== Number(filterTerm))
      return false;
    return true;
  });

  // Group by grade then term — keep latest entry per grade+term
  const grouped = new Map<number, Map<number, AcademicEntry>>();
  for (const entry of filtered) {
    const g = Number(entry.grade);
    const t = Number(entry.term);
    if (!grouped.has(g)) grouped.set(g, new Map());
    const termMap = grouped.get(g)!;
    const existing = termMap.get(t);
    if (!existing || Number(entry.timestamp) > Number(existing.timestamp)) {
      termMap.set(t, entry);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Grade:
          </span>
          <Select
            value={filterGrade}
            onValueChange={(v) => {
              setFilterGrade(v);
              setFilterTerm("all");
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map((g) => (
                <SelectItem key={g} value={String(g)}>
                  Grade {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Term:
          </span>
          <Select value={filterTerm} onValueChange={setFilterTerm}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {uniqueTerms.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  Term {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nine-scale legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { range: "90–100%", score: 9 },
          { range: "80–89%", score: 8 },
          { range: "70–79%", score: 7 },
          { range: "60–69%", score: 6 },
          { range: "50–59%", score: 5 },
          { range: "40–49%", score: 4 },
          { range: "33–39%", score: 3 },
          { range: "21–32%", score: 2 },
          { range: "10–20%", score: 1 },
        ].map(({ range, score }) => (
          <div key={score} className="flex items-center gap-1">
            <Badge
              className={`text-xs px-1.5 py-0.5 ${getNineScaleGradeColor(score)}`}
            >
              {score}
            </Badge>
            <span className="text-muted-foreground">{range}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm mt-1">
            Add academic entries to see nine-scale grades.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries())
            .sort(([a], [b]) => a - b)
            .map(([grade, termMap]) => (
              <div key={grade}>
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Grade {grade}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from(termMap.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([term, entry]) => {
                      const subjectResults = ALL_SUBJECT_KEYS.map((key) => ({
                        key,
                        result: getSubjectNineScale(entry, key),
                      })).filter(({ result }) => result !== null);

                      return (
                        <Card key={term} className="border shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              Term {term}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {subjectResults.map(({ key, result }) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                                >
                                  <span className="text-sm text-foreground">
                                    {SUBJECT_LABELS[key] ?? key}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {result!.marks}/{result!.maxMarks} (
                                      {result!.percentage.toFixed(1)}%)
                                    </span>
                                    <Badge
                                      className={`text-xs font-bold px-2 py-0.5 ${getNineScaleGradeColor(result!.scale)}`}
                                    >
                                      {result!.scale}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
