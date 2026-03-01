import React, { useMemo, useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { computeSubjectStatistics } from '../lib/subjectAnalysis';
import { AcademicEntry } from '../backend';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart2, BookOpen } from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Mathematics',
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
  pe: 'Physical Education',
  appliedMaths: 'Applied Maths',
  maths: 'Maths',
};

function getSubjectLabel(key: string): string {
  return SUBJECT_LABELS[key] ?? key;
}

function getPercentageColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 75) return 'text-green-600 dark:text-green-400';
  if (pct >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (pct >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

export default function SubjectAnalysisView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();

  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  const uniqueGrades = useMemo(() => {
    const grades = [...new Set(entries.map((e: AcademicEntry) => Number(e.grade)))].sort((a, b) => a - b);
    return grades;
  }, [entries]);

  const uniqueTerms = useMemo(() => {
    let filtered = entries as AcademicEntry[];
    if (filterGrade !== 'all') {
      filtered = filtered.filter((e) => Number(e.grade) === parseInt(filterGrade));
    }
    const terms = [...new Set(filtered.map((e) => Number(e.term)))].sort((a, b) => a - b);
    return terms;
  }, [entries, filterGrade]);

  const stats = useMemo(() => {
    const grade = filterGrade !== 'all' ? parseInt(filterGrade) : null;
    const term = filterTerm !== 'all' ? parseInt(filterTerm) : null;
    return computeSubjectStatistics(entries, grade, term);
  }, [entries, filterGrade, filterTerm]);

  if (isLoading) return <LoadingState message="Loading subject analysis..." />;
  if (error) return <ErrorMessage message="Failed to load academic entries." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            Subject Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Average raw marks, percentages, and highest/lowest per subject
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

      {/* Active filter badges */}
      {(filterGrade !== 'all' || filterTerm !== 'all') && (
        <div className="flex gap-2 flex-wrap">
          {filterGrade !== 'all' && <Badge variant="secondary">Grade {filterGrade}</Badge>}
          {filterTerm !== 'all' && <Badge variant="secondary">Term {filterTerm}</Badge>}
        </div>
      )}

      {stats.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Add academic entries to see subject analysis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.subjectKey} className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>{getSubjectLabel(stat.subjectKey)}</span>
                  <Badge variant="outline" className="text-xs">
                    {stat.count} {stat.count === 1 ? 'entry' : 'entries'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Average Row */}
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {stat.averageRawMarks.toFixed(1)}
                    </span>
                    <span className={`text-lg font-semibold ${getPercentageColor(stat.averagePercentage)}`}>
                      {stat.averagePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">raw marks · percentage</p>
                </div>

                {/* Highest Row */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Highest</p>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                      {stat.highestRawMarks} marks
                      <span className="font-normal text-emerald-600 dark:text-emerald-400 ml-1">
                        ({stat.highestPercentage}%)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Lowest Row */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">Lowest</p>
                    <p className="text-sm font-bold text-red-800 dark:text-red-200">
                      {stat.lowestRawMarks} marks
                      <span className="font-normal text-red-600 dark:text-red-400 ml-1">
                        ({stat.lowestPercentage}%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
