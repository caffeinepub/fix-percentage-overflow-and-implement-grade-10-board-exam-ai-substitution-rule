import React, { useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import {
  computeSubjectStats,
  calculatePerGradeSubjectAverages,
  calculateOverallSubjectAverages,
  SubjectAverageResult,
} from '../lib/subjectAnalysis';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart2, Globe } from 'lucide-react';

function getNineScale(percentage: number): number {
  if (percentage >= 90) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 70) return 7;
  if (percentage >= 60) return 6;
  if (percentage >= 50) return 5;
  if (percentage >= 40) return 4;
  if (percentage >= 33) return 3;
  if (percentage >= 21) return 2;
  if (percentage >= 10) return 1;
  return 0;
}

function getScaleColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500 text-white';
  if (score >= 6) return 'bg-green-500 text-white';
  if (score >= 4) return 'bg-yellow-500 text-white';
  if (score >= 2) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

function getAvgColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 60) return 'text-green-600 dark:text-green-400';
  if (pct >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function AverageSubjectGrid({ subjects, title, icon }: {
  subjects: SubjectAverageResult[];
  title: string;
  icon: React.ReactNode;
}) {
  if (subjects.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {subjects.map(sub => {
          const scale = getNineScale(sub.averagePercentage);
          return (
            <div
              key={sub.subjectKey}
              className="flex flex-col items-center justify-center p-3 rounded-lg border bg-muted/30 gap-1"
            >
              <span className="text-xs font-medium text-center text-foreground leading-tight">{sub.label}</span>
              <span className={`text-lg font-bold ${getAvgColor(sub.averagePercentage)}`}>
                {sub.averagePercentage}%
              </span>
              <Badge className={`text-xs px-1.5 py-0.5 ${getScaleColor(scale)}`}>
                {scale}
              </Badge>
              {sub.count > 1 && (
                <span className="text-xs text-muted-foreground">{sub.count} terms</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SubjectAnalysisView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  if (isLoading) return <LoadingState message="Loading subject analysis..." />;
  if (error) return <ErrorMessage message="Failed to load academic entries." />;

  const uniqueGrades = Array.from(new Set(entries.map(e => Number(e.grade)))).sort((a, b) => a - b);
  const uniqueTerms = Array.from(
    new Set(
      entries
        .filter(e => filterGrade === 'all' || Number(e.grade) === Number(filterGrade))
        .map(e => Number(e.term))
    )
  ).sort((a, b) => a - b);

  const gradeFilter = filterGrade === 'all' ? undefined : Number(filterGrade);
  const termFilter = filterTerm === 'all' ? undefined : Number(filterTerm);

  const stats = computeSubjectStats(entries, gradeFilter, termFilter);

  // Per-grade averages (across all terms in each grade)
  const perGradeAverages = calculatePerGradeSubjectAverages(entries);

  // Overall averages across all grades and terms
  const overallAverages = calculateOverallSubjectAverages(entries);

  // When a specific grade is selected, show that grade's averages
  const selectedGradeAverages = gradeFilter !== undefined
    ? perGradeAverages.find(g => g.grade === gradeFilter)
    : null;

  const hasData = entries.length > 0;

  return (
    <div className="space-y-8">
      {/* ── Overall Average Summary (always visible when data exists) ── */}
      {hasData && overallAverages.length > 0 && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Overall Average — All Grades &amp; All Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AverageSubjectGrid
              subjects={overallAverages}
              title=""
              icon={null}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Grade:</span>
          <Select value={filterGrade} onValueChange={v => { setFilterGrade(v); setFilterTerm('all'); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map(g => (
                <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Term:</span>
          <Select value={filterTerm} onValueChange={setFilterTerm}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {uniqueTerms.map(t => (
                <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Per-Grade Average (shown when a specific grade is selected) ── */}
      {selectedGradeAverages && selectedGradeAverages.subjects.length > 0 && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Grade {selectedGradeAverages.grade} — Average Across All Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AverageSubjectGrid
              subjects={selectedGradeAverages.subjects}
              title=""
              icon={null}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Per-Grade Averages for All Grades (when "All Grades" is selected) ── */}
      {gradeFilter === undefined && perGradeAverages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Per-Grade Average — Across All Terms
          </h3>
          <div className="space-y-4">
            {perGradeAverages.map(gradeData => (
              <Card key={gradeData.grade} className="border bg-card">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    Grade {gradeData.grade}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <AverageSubjectGrid
                    subjects={gradeData.subjects}
                    title=""
                    icon={null}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Per-Subject Cards (Highest / Lowest / Average) ── */}
      {stats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm mt-1">Add academic entries to see subject analysis.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {gradeFilter !== undefined
              ? termFilter !== undefined
                ? `Grade ${gradeFilter} · Term ${termFilter} — Subject Breakdown`
                : `Grade ${gradeFilter} — Subject Breakdown (All Terms)`
              : 'All Grades — Subject Breakdown'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(stat => {
              const highScale = getNineScale(stat.highestPercentage);
              const lowScale = getNineScale(stat.lowestPercentage);
              const avgScale = getNineScale(stat.averagePercentage);
              return (
                <Card key={stat.subjectKey} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{stat.label}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Max: {stat.maxMarks} marks
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Highest Marks */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Highest</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {stat.highestMarks}/{stat.maxMarks}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-500">
                          ({stat.highestPercentage}%)
                        </span>
                        <Badge className={`text-xs px-1.5 py-0.5 ${getScaleColor(highScale)}`}>
                          {highScale}
                        </Badge>
                      </div>
                    </div>

                    {/* Average Marks */}
                    {stat.count > 1 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <BarChart2 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Average</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            {stat.averagePercentage}%
                          </span>
                          <Badge className={`text-xs px-1.5 py-0.5 ${getScaleColor(avgScale)}`}>
                            {avgScale}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Lowest Marks */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">Lowest</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">
                          {stat.lowestMarks}/{stat.maxMarks}
                        </span>
                        <span className="text-xs text-red-600 dark:text-red-500">
                          ({stat.lowestPercentage}%)
                        </span>
                        <Badge className={`text-xs px-1.5 py-0.5 ${getScaleColor(lowScale)}`}>
                          {lowScale}
                        </Badge>
                      </div>
                    </div>

                    {stat.count > 1 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Based on {stat.count} entries
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
