import { useMemo, useState } from 'react';
import { useGetAcademicEntries, useGetBoardExamResults } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Award, BookOpen, Target, ArrowUpDown } from 'lucide-react';
import type { AcademicEntry } from '../backend';
import { clampTo100, formatPercent } from '@/lib/percent';
import { getExpectedMaxMarksForSubjectKey } from '@/lib/maxMarks';

type SortField = 'grade' | 'term' | 'termPercentage' | 'timestamp';
type SortDirection = 'asc' | 'desc';

export default function ProgressView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();
  const { data: boardExamResults, isLoading: boardExamLoading } = useGetBoardExamResults();
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      let aVal: number | bigint;
      let bVal: number | bigint;

      switch (sortField) {
        case 'grade':
          aVal = Number(a.grade);
          bVal = Number(b.grade);
          break;
        case 'term':
          aVal = Number(a.term);
          bVal = Number(b.term);
          break;
        case 'termPercentage':
          aVal = Number(a.termPercentage);
          bVal = Number(b.termPercentage);
          break;
        case 'timestamp':
          aVal = Number(a.timestamp);
          bVal = Number(b.timestamp);
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return sorted;
  }, [entries, sortField, sortDirection]);

  const statistics = useMemo(() => {
    if (entries.length === 0) {
      return {
        averagePercentage: 0,
        highestPercentage: 0,
        lowestPercentage: 0,
        totalEntries: 0,
      };
    }

    const percentages = entries.map((e) => Number(e.termPercentage));
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    const avg = sum / percentages.length;

    return {
      averagePercentage: clampTo100(avg),
      highestPercentage: clampTo100(Math.max(...percentages)),
      lowestPercentage: clampTo100(Math.min(...percentages)),
      totalEntries: entries.length,
    };
  }, [entries]);

  const chartData = useMemo(() => {
    return sortedEntries.map((entry) => ({
      name: `G${entry.grade} T${entry.term}`,
      percentage: clampTo100(Number(entry.termPercentage)),
      grade: Number(entry.grade),
      term: Number(entry.term),
    }));
  }, [sortedEntries]);

  const trendData = useMemo(() => {
    return sortedEntries.map((entry, index) => ({
      index: index + 1,
      percentage: clampTo100(Number(entry.termPercentage)),
      name: `G${entry.grade} T${entry.term}`,
    }));
  }, [sortedEntries]);

  const getSubjectPercentage = (entry: AcademicEntry, subjectKey: keyof typeof entry.subjects): number => {
    const marks = entry.subjects[subjectKey];
    if (marks === undefined || marks === null) return 0;

    const grade = Number(entry.grade);
    const term = Number(entry.term);
    const termMaxMarks = Number(entry.termMaxMarks);
    let maxMarks: number;

    // Determine which stored max marks field to use
    if (subjectKey === 'computer') {
      maxMarks = Number(entry.computerMaxMarks);
    } else if (subjectKey === 'ai') {
      maxMarks = Number(entry.aiMaxMarks);
    } else {
      // For regular subjects, use maxMarksPerSubject
      maxMarks = Number(entry.maxMarksPerSubject);
    }

    // Validate stored max marks and apply fallback if suspicious
    // If maxMarks is 0, missing, or equals termMaxMarks (indicating it was incorrectly stored as total),
    // fall back to grade-wise expected max marks
    if (maxMarks === 0 || maxMarks === termMaxMarks || maxMarks > 150) {
      // Use grade-wise expected max marks as fallback
      maxMarks = getExpectedMaxMarksForSubjectKey(subjectKey as string, grade, term);
    }

    // If still 0 after fallback, return 0% to avoid division by zero
    if (maxMarks === 0) return 0;

    const percentage = (Number(marks) * 100) / maxMarks;
    return clampTo100(percentage);
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getGradeBadgeVariant = (gradeText: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (gradeText === 'A+' || gradeText === 'A') return 'default';
    if (gradeText === 'B+' || gradeText === 'B') return 'secondary';
    if (gradeText === 'C') return 'outline';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Progress</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : 'Failed to load academic entries'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (entries.length === 0 && !boardExamResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Entries Yet</CardTitle>
          <CardDescription>
            Start tracking your academic progress by adding your first entry using the "Add Marks" tab.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalEntries}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average %</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(statistics.averagePercentage)}%</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Highest %</CardTitle>
              <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPercent(statistics.highestPercentage)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lowest %</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatPercent(statistics.lowestPercentage)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Board Exam Results */}
      {boardExamResults && !boardExamLoading && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Board Exam Results
            </CardTitle>
            <CardDescription>Your final board examination performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold">{Number(boardExamResults.boardExamTotal)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Maximum Marks</p>
                <p className="text-2xl font-bold">{Number(boardExamResults.maxMarks)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPercent(clampTo100(Number(boardExamResults.percentage)))}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Performance by Term</CardTitle>
              <CardDescription>Percentage scores across all terms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" name="Percentage" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Progress Trend</CardTitle>
              <CardDescription>Your performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Percentage"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Entries Table */}
      {entries.length > 0 && (
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>All Academic Entries</CardTitle>
            <CardDescription>Detailed view of all your academic records (click headers to sort)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('grade')}>
                      <div className="flex items-center gap-1">
                        Grade
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('term')}>
                      <div className="flex items-center gap-1">
                        Term
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Stream/Subgroup</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead className="text-right">Term Total</TableHead>
                    <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('termPercentage')}>
                      <div className="flex items-center justify-end gap-1">
                        Term %
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('timestamp')}>
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry, index) => {
                    const subjectEntries = Object.entries(entry.subjects).filter(([_, value]) => value !== undefined && value !== null);
                    const termPct = clampTo100(Number(entry.termPercentage));

                    return (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{Number(entry.grade)}</TableCell>
                        <TableCell>{Number(entry.term)}</TableCell>
                        <TableCell className="text-sm">
                          {entry.stream && entry.subgroup ? (
                            <div className="space-y-0.5">
                              <div className="font-medium">{entry.stream}</div>
                              <div className="text-muted-foreground">{entry.subgroup}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {subjectEntries.map(([key, value]) => {
                              const percentage = getSubjectPercentage(entry, key as keyof typeof entry.subjects);
                              return (
                                <div
                                  key={key}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs"
                                  title={`${key}: ${Number(value)} marks (${formatPercent(percentage)}%)`}
                                >
                                  <span className="font-medium capitalize">{key}:</span>
                                  <span>{Number(value)}</span>
                                  <span className="text-muted-foreground">({formatPercent(percentage)}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(entry.termTotalMarks)}/{Number(entry.termMaxMarks)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className={`h-2 w-16 rounded-full bg-muted overflow-hidden`}>
                              <div
                                className={`h-full ${getGradeColor(termPct)} transition-all`}
                                style={{ width: `${termPct}%` }}
                              />
                            </div>
                            <span className="font-bold min-w-[3rem]">{formatPercent(termPct)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getGradeBadgeVariant(entry.gradeText)}>{entry.gradeText}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(Number(entry.timestamp) / 1000000).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
