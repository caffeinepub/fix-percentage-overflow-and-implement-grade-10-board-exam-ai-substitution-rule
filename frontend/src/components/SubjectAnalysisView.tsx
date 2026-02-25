import React, { useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { computeSubjectStatistics } from '../lib/subjectAnalysis';
import { BarChart2 } from 'lucide-react';

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

export default function SubjectAnalysisView() {
  const { data: entries = [], isLoading } = useGetAcademicEntries();
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  const uniqueGrades = Array.from(new Set(entries.map(e => Number(e.grade)))).sort((a, b) => a - b);
  const uniqueStreams = Array.from(new Set(entries.map(e => e.stream || 'General'))).sort();
  const uniqueTerms = Array.from(new Set(entries.map(e => Number(e.term)))).sort((a, b) => a - b);

  const filtered = entries.filter(entry => {
    const gradeMatch = filterGrade === 'all' || Number(entry.grade) === Number(filterGrade);
    const streamMatch = filterStream === 'all' || (entry.stream || 'General') === filterStream;
    const termMatch = filterTerm === 'all' || Number(entry.term) === Number(filterTerm);
    return gradeMatch && streamMatch && termMatch;
  });

  const stats = computeSubjectStatistics(filtered as AcademicEntry[]);

  const chartData = stats.map(s => ({
    name: SUBJECT_LABELS[s.subjectKey] || s.subjectKey,
    avgPct: parseFloat(s.averagePercentage.toFixed(1)),
    highestPct: parseFloat(s.highestPercentage.toFixed(1)),
    lowestPct: parseFloat(s.lowestPercentage.toFixed(1)),
    avgMarks: s.averageMarks,
  }));

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
        <BarChart2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No academic entries yet.</p>
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

        <Select value={filterStream} onValueChange={setFilterStream}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Stream" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Streams</SelectItem>
            {uniqueStreams.map(s => (
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

        {(filterGrade !== 'all' || filterStream !== 'all' || filterTerm !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterGrade('all'); setFilterStream('all'); setFilterTerm('all'); }}
          >
            Reset
          </Button>
        )}
      </div>

      {stats.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No data for selected filters.</p>
      ) : (
        <>
          {/* Average % Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Average Percentage by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number, name: string) => {
                      if (name === 'Avg %') return [`${val}%`, name];
                      if (name === 'Highest %') return [`${val}%`, name];
                      if (name === 'Lowest %') return [`${val}%`, name];
                      return [val, name];
                    }}
                  />
                  <Legend verticalAlign="top" height={28} />
                  <Bar dataKey="avgPct" name="Avg %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="highestPct" name="Highest %" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lowestPct" name="Lowest %" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Statistics Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Subject Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Subject</th>
                      <th className="text-right p-3 font-medium">Avg Marks</th>
                      <th className="text-right p-3 font-medium">Avg %</th>
                      <th className="text-right p-3 font-medium">Highest Marks</th>
                      <th className="text-right p-3 font-medium">Highest %</th>
                      <th className="text-right p-3 font-medium">Lowest Marks</th>
                      <th className="text-right p-3 font-medium">Lowest %</th>
                      <th className="text-right p-3 font-medium">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(s => (
                      <tr key={s.subjectKey} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{SUBJECT_LABELS[s.subjectKey] || s.subjectKey}</td>
                        <td className="p-3 text-right font-semibold text-primary">
                          {s.averageMarks > 0 ? s.averageMarks : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="text-xs">
                            {s.averagePercentage.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-semibold text-green-600">
                          {s.highestMarks > 0 ? s.highestMarks : '—'}
                        </td>
                        <td className="p-3 text-right text-green-600">
                          {s.highestPercentage.toFixed(1)}%
                        </td>
                        <td className="p-3 text-right font-semibold text-red-500">
                          {s.lowestMarks > 0 ? s.lowestMarks : '—'}
                        </td>
                        <td className="p-3 text-right text-red-500">
                          {s.lowestPercentage.toFixed(1)}%
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
