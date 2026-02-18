import { useMemo, useState } from 'react';
import { useGetAcademicEntries } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookOpen } from 'lucide-react';
import { computeSubjectAnalysis } from '@/lib/subjectAnalysis';
import { formatPercent } from '@/lib/percent';

export default function SubjectAnalysisView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Get unique grades from entries
  const availableGrades = useMemo(() => {
    const grades = new Set<number>();
    entries.forEach((entry) => grades.add(Number(entry.grade)));
    return Array.from(grades).sort((a, b) => a - b);
  }, [entries]);

  // Filter entries by selected grade
  const filteredEntries = useMemo(() => {
    if (selectedGrade === 'all') return entries;
    return entries.filter((entry) => Number(entry.grade) === Number(selectedGrade));
  }, [entries, selectedGrade]);

  // Compute subject analysis
  const subjectStats = useMemo(() => {
    return computeSubjectAnalysis(filteredEntries);
  }, [filteredEntries]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return subjectStats.map((stat) => ({
      subject: stat.subjectName,
      average: stat.average,
      highest: stat.highest,
      lowest: stat.lowest,
    }));
  }, [subjectStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
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
          <CardTitle className="text-destructive">Error Loading Subject Analysis</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : 'Failed to load academic entries'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            Start tracking your academic progress by adding entries using the "Add Marks" tab.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (filteredEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subject Analysis</CardTitle>
          <CardDescription>
            Analyze your performance across different subjects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Grade:</label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {availableGrades.map((grade) => (
                  <SelectItem key={grade} value={String(grade)}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No entries found for the selected grade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subject Analysis</CardTitle>
          <CardDescription>
            Analyze your performance across different subjects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grade Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Grade:</label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {availableGrades.map((grade) => (
                  <SelectItem key={grade} value={String(grade)}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statistics Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Average %</TableHead>
                  <TableHead className="text-right">Highest %</TableHead>
                  <TableHead className="text-right">Lowest %</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectStats.map((stat) => (
                  <TableRow key={stat.subjectName}>
                    <TableCell className="font-medium">{stat.subjectName}</TableCell>
                    <TableCell className="text-right">{formatPercent(stat.average)}%</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">
                      {formatPercent(stat.highest)}%
                    </TableCell>
                    <TableCell className="text-right text-orange-600 dark:text-orange-400">
                      {formatPercent(stat.lowest)}%
                    </TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="subject"
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar dataKey="average" fill="hsl(var(--primary))" name="Average %" />
                <Bar dataKey="highest" fill="hsl(var(--chart-2))" name="Highest %" />
                <Bar dataKey="lowest" fill="hsl(var(--chart-3))" name="Lowest %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
