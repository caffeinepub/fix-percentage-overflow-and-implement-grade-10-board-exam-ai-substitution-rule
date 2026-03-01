import React, { useMemo, useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { calculateNineScaleFromPercentage, getNineScaleGradeColor } from '../lib/gradeCalculation';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, GraduationCap } from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Math',
  english: 'English',
  hindi: 'Hindi',
  evs: 'EVS',
  computer: 'Computer',
  kannada: 'Kannada',
  science: 'Science',
  ssc: 'SSC',
  ai: 'AI',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  economics: 'Economics',
  businessStudies: 'Business Studies',
  accountancy: 'Accountancy',
  statistics: 'Statistics',
  management: 'Management',
  psychology: 'Psychology',
  pe: 'P.E.',
  appliedMaths: 'Applied Maths',
  maths: 'Maths',
};

type SubjectKey = keyof NonNullable<AcademicEntry['subjects']>;

const GRADING_SCALE = [
  { range: '90–100', grade: 9, color: 'bg-emerald-500' },
  { range: '80–89', grade: 8, color: 'bg-green-500' },
  { range: '70–79', grade: 7, color: 'bg-lime-500' },
  { range: '60–69', grade: 6, color: 'bg-yellow-500' },
  { range: '50–59', grade: 5, color: 'bg-orange-400' },
  { range: '40–49', grade: 4, color: 'bg-orange-500' },
  { range: '30–39', grade: 3, color: 'bg-red-400' },
  { range: '20–29', grade: 2, color: 'bg-red-500' },
  { range: '0–19', grade: 1, color: 'bg-red-700' },
];

interface SubjectGradeInfo {
  key: SubjectKey;
  rawMarks: number;
  maxMarks: number;
  percentage: number;
  nineScale: number;
}

function getSubjectGrades(entry: AcademicEntry): SubjectGradeInfo[] {
  const subjectKeys = Object.keys(entry.subjects) as SubjectKey[];
  const results: SubjectGradeInfo[] = [];

  for (const key of subjectKeys) {
    const rawVal = entry.subjects[key];
    if (rawVal == null) continue;
    const raw = Number(rawVal);

    let maxMarks = Number(entry.maxMarksPerSubject);
    if (key === 'computer') {
      const cm = Number(entry.computerMaxMarks);
      if (cm > 0) maxMarks = cm;
    } else if (key === 'ai') {
      const am = Number(entry.aiMaxMarks);
      if (am > 0) maxMarks = am;
    } else if (key === 'maths') {
      const mm = Number(entry.mathsMaxMarks);
      if (mm > 0) maxMarks = mm;
    } else if (key === 'appliedMaths') {
      const apm = Number(entry.appliedMathsMaxMarks);
      if (apm > 0) maxMarks = apm;
    }

    if (maxMarks <= 0) maxMarks = 100;
    const percentage = Math.min(100, Math.round((raw / maxMarks) * 100));
    const nineScale = calculateNineScaleFromPercentage(percentage);

    results.push({ key, rawMarks: raw, maxMarks, percentage, nineScale });
  }

  return results;
}

export default function NineScaleGradesView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();

  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  const uniqueGrades = useMemo(() => {
    return [...new Set(entries.map((e: AcademicEntry) => Number(e.grade)))].sort((a, b) => a - b);
  }, [entries]);

  const uniqueTerms = useMemo(() => {
    let filtered = entries as AcademicEntry[];
    if (filterGrade !== 'all') {
      filtered = filtered.filter((e) => Number(e.grade) === parseInt(filterGrade));
    }
    return [...new Set(filtered.map((e) => Number(e.term)))].sort((a, b) => a - b);
  }, [entries, filterGrade]);

  const groupedEntries = useMemo(() => {
    let filtered = entries as AcademicEntry[];
    if (filterGrade !== 'all') {
      filtered = filtered.filter((e) => Number(e.grade) === parseInt(filterGrade));
    }
    if (filterTerm !== 'all') {
      filtered = filtered.filter((e) => Number(e.term) === parseInt(filterTerm));
    }

    const byGrade = new Map<number, Map<number, AcademicEntry[]>>();
    for (const entry of filtered) {
      const g = Number(entry.grade);
      const t = Number(entry.term);
      if (!byGrade.has(g)) byGrade.set(g, new Map());
      const byTerm = byGrade.get(g)!;
      if (!byTerm.has(t)) byTerm.set(t, []);
      byTerm.get(t)!.push(entry);
    }

    return [...byGrade.entries()].sort((a, b) => a[0] - b[0]);
  }, [entries, filterGrade, filterTerm]);

  if (isLoading) return <LoadingState message="Loading 9-scale grades..." />;
  if (error) return <ErrorMessage message="Failed to load academic entries." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            9-Scale Grades
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Per-subject 9-point scale grades for each grade and term
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select
            value={filterGrade}
            onValueChange={(v) => { setFilterGrade(v); setFilterTerm('all'); }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map((g) => (
                <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTerm} onValueChange={setFilterTerm}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {uniqueTerms.map((t) => (
                <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grading Scale Legend */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Grading Scale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GRADING_SCALE.map(({ range, grade, color }) => (
              <div key={grade} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${color}`}
                >
                  {grade}
                </span>
                <span className="text-xs text-muted-foreground">{range}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entries */}
      {groupedEntries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Add academic entries to see 9-scale grades.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEntries.map(([grade, termMap]) => (
            <div key={grade}>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {grade}
                </span>
                Grade {grade}
              </h3>
              <div className="space-y-4">
                {[...termMap.entries()].sort((a, b) => a[0] - b[0]).map(([term, termEntries]) => (
                  <div key={term}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Badge variant="outline">Term {term}</Badge>
                      <span>{termEntries.length} {termEntries.length === 1 ? 'entry' : 'entries'}</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {termEntries.map((entry, idx) => {
                        const subjectGrades = getSubjectGrades(entry);
                        const entryDate = new Date(Number(entry.timestamp) / 1_000_000);
                        return (
                          <Card key={idx} className="border border-border shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span>
                                  Grade {grade} · Term {term}
                                  {entry.stream && (
                                    <span className="ml-1 text-muted-foreground font-normal">
                                      · {entry.stream}
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground font-normal">
                                  {entryDate.toLocaleDateString()}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {subjectGrades.map(({ key, rawMarks, maxMarks, percentage, nineScale }) => (
                                  <div
                                    key={key}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40 border border-border min-w-[72px]"
                                    title={`${SUBJECT_LABELS[key] ?? key}: ${rawMarks}/${maxMarks} (${percentage}%)`}
                                  >
                                    <span className="text-xs text-muted-foreground font-medium truncate max-w-[64px] text-center">
                                      {SUBJECT_LABELS[key] ?? key}
                                    </span>
                                    <span
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${getNineScaleGradeColor(nineScale)}`}
                                    >
                                      {nineScale}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {rawMarks}/{maxMarks}
                                    </span>
                                    <span className="text-xs font-medium text-foreground">
                                      {percentage}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Term %</span>
                                <span className="font-bold text-foreground">{Number(entry.termPercentage)}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
