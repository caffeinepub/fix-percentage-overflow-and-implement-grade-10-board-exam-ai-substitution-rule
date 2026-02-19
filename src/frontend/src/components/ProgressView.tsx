import { useMemo, useState } from 'react';
import { useGetAcademicEntries, useGetBoardExamResults, useGetGradeAggregatePercentages } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Award, BookOpen, Target, ArrowUpDown, GraduationCap, LineChartIcon, Filter } from 'lucide-react';
import type { AcademicEntry } from '../backend';
import { clampTo100, formatPercent } from '@/lib/percent';
import { getExpectedMaxMarksForSubjectKey } from '@/lib/maxMarks';
import { calculateLetterGrade } from '@/lib/gradeCalculation';

type SortField = 'grade' | 'term' | 'termPercentage' | 'timestamp';
type SortDirection = 'asc' | 'desc';

export default function ProgressView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();
  const { data: boardExamResults, isLoading: boardExamLoading } = useGetBoardExamResults();
  const { data: gradeAggregates, isLoading: aggregatesLoading } = useGetGradeAggregatePercentages();
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get unique grades, sections, and terms for filters
  const { grades, sections, terms } = useMemo(() => {
    const gradesSet = new Set<number>();
    const sectionsSet = new Set<string>();
    const termsSet = new Set<number>();

    entries.forEach((entry) => {
      gradesSet.add(Number(entry.grade));
      termsSet.add(Number(entry.term));
      
      const section = entry.stream || entry.subgroup;
      if (section) {
        sectionsSet.add(section);
      }
    });

    return {
      grades: Array.from(gradesSet).sort((a, b) => a - b),
      sections: Array.from(sectionsSet).sort(),
      terms: Array.from(termsSet).sort((a, b) => a - b),
    };
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filterGrade !== 'all' && Number(entry.grade) !== Number(filterGrade)) {
        return false;
      }
      if (filterTerm !== 'all' && Number(entry.term) !== Number(filterTerm)) {
        return false;
      }
      if (filterSection !== 'all') {
        const section = entry.stream || entry.subgroup || '';
        if (section !== filterSection) {
          return false;
        }
      }
      return true;
    });
  }, [entries, filterGrade, filterSection, filterTerm]);

  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => {
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
  }, [filteredEntries, sortField, sortDirection]);

  const statistics = useMemo(() => {
    if (filteredEntries.length === 0) {
      return {
        averagePercentage: 0,
        highestPercentage: 0,
        lowestPercentage: 0,
        totalEntries: 0,
      };
    }

    const percentages = filteredEntries.map((e) => Number(e.termPercentage));
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    const avg = sum / percentages.length;

    return {
      averagePercentage: clampTo100(avg),
      highestPercentage: clampTo100(Math.max(...percentages)),
      lowestPercentage: clampTo100(Math.min(...percentages)),
      totalEntries: filteredEntries.length,
    };
  }, [filteredEntries]);

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

  // Prepare raw marks percentage table data by grade
  const rawMarksPercentageByGrade = useMemo(() => {
    if (!gradeAggregates || gradeAggregates.aggregates.length === 0) return [];

    return gradeAggregates.aggregates
      .map(([grade, aggregate]) => {
        const term1Pct = clampTo100(Number(aggregate.term1Percentage));
        const term2Pct = clampTo100(Number(aggregate.term2Percentage));
        const combinedPct = clampTo100(Number(aggregate.combinedOverallPercentage));

        return {
          grade: Number(grade),
          term1Percentage: term1Pct,
          term2Percentage: term2Pct,
          combinedPercentage: combinedPct,
        };
      })
      .sort((a, b) => a.grade - b.grade);
  }, [gradeAggregates]);

  // Prepare frequency polygon data - distribution of combined percentages
  const frequencyPolygonData = useMemo(() => {
    if (!gradeAggregates || gradeAggregates.aggregates.length === 0) return [];

    // Collect all combined percentages from Term 1 and Term 2
    const allPercentages: number[] = [];
    
    for (const [, aggregate] of gradeAggregates.aggregates) {
      const term1Pct = Number(aggregate.term1Percentage);
      const term2Pct = Number(aggregate.term2Percentage);
      
      if (term1Pct > 0) allPercentages.push(clampTo100(term1Pct));
      if (term2Pct > 0) allPercentages.push(clampTo100(term2Pct));
    }

    if (allPercentages.length === 0) return [];

    // Create percentage ranges (bins)
    const ranges = [
      { label: '0-10%', min: 0, max: 10 },
      { label: '10-20%', min: 10, max: 20 },
      { label: '20-30%', min: 20, max: 30 },
      { label: '30-40%', min: 30, max: 40 },
      { label: '40-50%', min: 40, max: 50 },
      { label: '50-60%', min: 50, max: 60 },
      { label: '60-70%', min: 60, max: 70 },
      { label: '70-80%', min: 70, max: 80 },
      { label: '80-90%', min: 80, max: 90 },
      { label: '90-100%', min: 90, max: 100 },
    ];

    // Count frequency in each range
    const frequencyData = ranges.map((range) => {
      const count = allPercentages.filter(
        (pct) => pct >= range.min && (range.max === 100 ? pct <= range.max : pct < range.max)
      ).length;

      return {
        range: range.label,
        frequency: count,
      };
    });

    return frequencyData;
  }, [gradeAggregates]);

  const getSubjectMarksDisplay = (entry: AcademicEntry, subjectKey: keyof typeof entry.subjects): string => {
    const marks = entry.subjects[subjectKey];
    if (marks === undefined || marks === null) return '-';

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
    if (maxMarks === 0 || maxMarks === termMaxMarks || maxMarks > 150) {
      // Use grade-wise expected max marks as fallback
      maxMarks = getExpectedMaxMarksForSubjectKey(subjectKey as string, grade, term);
    }

    // If still 0 after fallback, return just the marks
    if (maxMarks === 0) return `${Number(marks)}`;

    return `${Number(marks)}/${maxMarks}`;
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
    if (gradeText === 'C' || gradeText === 'D') return 'outline';
    return 'destructive';
  };

  if (isLoading || aggregatesLoading) {
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
      {/* Filters */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade</label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term} value={String(term)}>
                      Term {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Raw Marks Percentage Table by Grade */}
      {rawMarksPercentageByGrade.length > 0 && (
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Raw Marks Percentage by Grade</CardTitle>
            </div>
            <CardDescription>
              Term 1 % and Term 2 % for each grade (9-12)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Term 1 %</TableHead>
                    <TableHead className="text-right">Term 2 %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMarksPercentageByGrade.map((data) => (
                    <TableRow key={data.grade}>
                      <TableCell className="font-medium">Grade {data.grade}</TableCell>
                      <TableCell className="text-right">
                        {data.term1Percentage > 0 ? `${formatPercent(data.term1Percentage)}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.term2Percentage > 0 ? `${formatPercent(data.term2Percentage)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequency Polygon Chart */}
      {frequencyPolygonData.length > 0 && (
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              <CardTitle>Frequency Polygon Chart</CardTitle>
            </div>
            <CardDescription>
              Distribution of combined percentages from Term 1 and Term 2 across all grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={frequencyPolygonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="range" 
                    className="text-xs"
                    label={{ value: 'Percentage Range', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    className="text-xs" 
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => [`${value} entries`, 'Frequency']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="frequency"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 7 }}
                    name="Frequency"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Chart */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Your term percentages across all entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" name="Percentage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Progress Trend */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Progress Trend</CardTitle>
          <CardDescription>
            Track your performance improvement over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Percentage"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Board Exam Results */}
      {boardExamResults && !boardExamLoading && (
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Board Exam Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold">{Number(boardExamResults.boardExamTotal)}/{Number(boardExamResults.maxMarks)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-2xl font-bold text-primary">{formatPercent(Number(boardExamResults.percentage))}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {calculateLetterGrade(Number(boardExamResults.boardExamTotal), Number(boardExamResults.maxMarks))}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Entries Table */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Academic Entries</CardTitle>
          <CardDescription>
            All your academic records with raw marks (showing filtered: {filteredEntries.length} of {entries.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort('grade')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Grade
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('term')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Term
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('termPercentage')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      %
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('timestamp')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.map((entry, index) => {
                  const section = entry.stream || entry.subgroup || '-';
                  const letterGrade = calculateLetterGrade(Number(entry.termTotalMarks), Number(entry.termMaxMarks));
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{Number(entry.grade)}</TableCell>
                      <TableCell>{Number(entry.term)}</TableCell>
                      <TableCell>{section}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {Number(entry.termTotalMarks)}/{Number(entry.termMaxMarks)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-16 rounded-full ${getGradeColor(Number(entry.termPercentage))}`}
                          />
                          <span className="font-medium">{formatPercent(Number(entry.termPercentage))}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getGradeBadgeVariant(letterGrade)}>
                          {letterGrade}
                        </Badge>
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
    </div>
  );
}
