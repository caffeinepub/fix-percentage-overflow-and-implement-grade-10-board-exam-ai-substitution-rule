import React, { useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Dot,
} from 'recharts';
import { TrendingUp, BookOpen, Award, Activity } from 'lucide-react';
import { calculateLetterGrade } from '../lib/gradeCalculation';
import { getExpectedMaxMarksForSubjectKey } from '../lib/maxMarks';
import { isBoardExamGrade } from '../lib/boardExam';
import { computeFrequencyDistribution } from '../lib/frequencyPolygon';

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Mathematics',
  english: 'English',
  hindi: 'Hindi',
  evs: 'EVS',
  computer: 'Computer Science',
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
};

function getGradeColor(letterGrade: string): string {
  if (letterGrade === 'A+') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (letterGrade === 'A') return 'bg-green-100 text-green-800 border-green-300';
  if (letterGrade === 'B+') return 'bg-blue-100 text-blue-800 border-blue-300';
  if (letterGrade === 'B') return 'bg-sky-100 text-sky-800 border-sky-300';
  if (letterGrade === 'C+') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (letterGrade === 'C') return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

function getSubjectEntries(entry: AcademicEntry) {
  return Object.entries(entry.subjects)
    .filter(([, val]) => val !== undefined && val !== null)
    .map(([key, val]) => {
      const marks = Number(val);
      const maxMarks = getExpectedMaxMarksForSubjectKey(key, Number(entry.grade), Number(entry.term));
      return {
        key,
        label: SUBJECT_LABELS[key] || key,
        marks,
        maxMarks: maxMarks || Number(entry.maxMarksPerSubject),
      };
    });
}

export default function ProgressView() {
  const { data: entries = [], isLoading } = useGetAcademicEntries();
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  const uniqueGrades = Array.from(new Set(entries.map(e => Number(e.grade)))).sort((a, b) => a - b);
  const uniqueSections = Array.from(new Set(entries.map(e => e.stream || 'General'))).sort();
  const uniqueTerms = Array.from(new Set(entries.map(e => Number(e.term)))).sort((a, b) => a - b);

  const filtered = entries.filter(entry => {
    const gradeMatch = filterGrade === 'all' || Number(entry.grade) === Number(filterGrade);
    const sectionMatch = filterSection === 'all' || (entry.stream || 'General') === filterSection;
    const termMatch = filterTerm === 'all' || Number(entry.term) === Number(filterTerm);
    return gradeMatch && sectionMatch && termMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const gradeDiff = Number(a.grade) - Number(b.grade);
    if (gradeDiff !== 0) return gradeDiff;
    return Number(a.term) - Number(b.term);
  });

  const avgPercentage = sorted.length > 0
    ? Math.round(sorted.reduce((sum, e) => sum + Number(e.termPercentage), 0) / sorted.length)
    : 0;

  const chartData = sorted.map(entry => ({
    name: `G${Number(entry.grade)}T${Number(entry.term)}`,
    percentage: Number(entry.termPercentage),
  }));

  // Frequency polygon data
  const freqData = computeFrequencyDistribution(sorted);

  // Average percentage per grade (from filtered entries)
  const gradeAverages: { grade: number; avg: number; count: number }[] = [];
  const gradeGroups = new Map<number, number[]>();
  for (const entry of sorted) {
    const g = Number(entry.grade);
    if (!gradeGroups.has(g)) gradeGroups.set(g, []);
    gradeGroups.get(g)!.push(Number(entry.termPercentage));
  }
  for (const [grade, pcts] of Array.from(gradeGroups.entries()).sort((a, b) => a[0] - b[0])) {
    const avg = Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
    gradeAverages.push({ grade, avg, count: pcts.length });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No academic entries yet. Add marks to see progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterGrade} onValueChange={setFilterGrade}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {uniqueGrades.map(g => (
              <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Stream" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Streams</SelectItem>
            {uniqueSections.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterTerm} onValueChange={setFilterTerm}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {uniqueTerms.map(t => (
              <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterGrade !== 'all' || filterSection !== 'all' || filterTerm !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterGrade('all'); setFilterSection('all'); setFilterTerm('all'); }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Entries</p>
                <p className="text-xl font-bold">{sorted.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Avg %</p>
                <p className="text-xl font-bold">{avgPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Best</p>
                <p className="text-xl font-bold">
                  {sorted.length > 0 ? Math.max(...sorted.map(e => Number(e.termPercentage))) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Percentage per Grade */}
      {gradeAverages.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average Percentage by Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {gradeAverages.map(({ grade, avg, count }) => (
                <div
                  key={grade}
                  className="flex flex-col items-center bg-muted/40 rounded-lg px-4 py-3 min-w-[90px] border"
                >
                  <span className="text-xs text-muted-foreground font-medium">Grade {grade}</span>
                  <span className="text-2xl font-bold text-primary">{avg}%</span>
                  <span className="text-xs text-muted-foreground">{count} {count === 1 ? 'entry' : 'entries'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Percentage by Grade/Term</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`${val}%`, 'Percentage']} />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Frequency Polygon */}
      {sorted.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Frequency Polygon — Percentage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Distribution of original term percentages across class intervals (0–100)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={freqData} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="interval"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Percentage Interval', position: 'insideBottom', offset: -4, fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Frequency', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: number) => [val, 'Frequency']}
                  labelFormatter={(label) => `Interval: ${label}%`}
                />
                <Legend verticalAlign="top" height={28} />
                <Line
                  type="linear"
                  dataKey="frequency"
                  name="Frequency"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={<Dot r={5} fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Academic Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry, idx) => {
                  const subjectEntries = getSubjectEntries(entry);
                  const pct = Number(entry.termPercentage);
                  const letterGrade = calculateLetterGrade(pct, 100);
                  const gradeColor = getGradeColor(letterGrade);
                  const gradeNum = Number(entry.grade);
                  const isBoardExam = isBoardExamGrade(gradeNum);

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {gradeNum}
                          {isBoardExam && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-400 border text-xs px-1 py-0 dark:bg-amber-900 dark:text-amber-200">
                              Board
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{Number(entry.term)}</TableCell>
                      <TableCell>{entry.stream || 'General'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subjectEntries.map(s => (
                            <span key={s.key} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {s.label}: {s.marks}/{s.maxMarks}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{Number(entry.termTotalMarks)}/{Number(entry.termMaxMarks)}</TableCell>
                      <TableCell>{pct}%</TableCell>
                      <TableCell>
                        <Badge className={`${gradeColor} border`}>{letterGrade}</Badge>
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
