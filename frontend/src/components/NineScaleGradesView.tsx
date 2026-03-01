import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { getNineScaleGradeColor } from '../lib/gradeCalculation';
import type { AcademicEntry } from '../backend';

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
  maths: 'Maths',
  appliedMaths: 'Applied Maths',
};

const GRADE_SCALE = [
  { range: '91–100', grade: 9, label: 'Outstanding' },
  { range: '81–90', grade: 8, label: 'Excellent' },
  { range: '71–80', grade: 7, label: 'Very Good' },
  { range: '61–70', grade: 6, label: 'Good' },
  { range: '51–60', grade: 5, label: 'Average' },
  { range: '41–50', grade: 4, label: 'Below Average' },
  { range: '33–40', grade: 3, label: 'Pass' },
  { range: '21–32', grade: 2, label: 'Poor' },
  { range: '11–20', grade: 1, label: 'Very Poor' },
  { range: '0–10', grade: 0, label: 'Fail' },
];

function getSubjectGrades(entry: AcademicEntry): Array<{ key: string; label: string; grade: number }> {
  if (!entry.subjects9) return [];
  const s9 = entry.subjects9;
  const result: Array<{ key: string; label: string; grade: number }> = [];
  const keys = Object.keys(SUBJECT_LABELS) as Array<keyof typeof SUBJECT_LABELS>;
  for (const key of keys) {
    const val = (s9 as Record<string, number | undefined>)[key];
    if (val !== undefined && val !== null) {
      result.push({ key, label: SUBJECT_LABELS[key], grade: val });
    }
  }
  return result;
}

export default function NineScaleGradesView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');

  const grades = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    return Array.from(new Set(entries.map((e) => Number(e.grade)))).sort((a, b) => a - b);
  }, [entries]);

  const streams = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    return Array.from(new Set(entries.map((e) => e.stream ?? '').filter(Boolean)));
  }, [entries]);

  const terms = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    return Array.from(new Set(entries.map((e) => Number(e.term)))).sort((a, b) => a - b);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      if (selectedGrade !== 'all' && Number(e.grade) !== parseInt(selectedGrade)) return false;
      if (selectedStream !== 'all' && (e.stream ?? '') !== selectedStream) return false;
      if (selectedTerm !== 'all' && Number(e.term) !== parseInt(selectedTerm)) return false;
      return true;
    });
  }, [entries, selectedGrade, selectedStream, selectedTerm]);

  if (isLoading) {
    return <LoadingState message="Loading 9-scale grades..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load grade data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No entries available for 9-scale grades.</p>
        <p className="text-sm mt-1">Add your marks to see 9-scale grades here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grading Scale Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">9-Point Grading Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GRADE_SCALE.map((item) => (
              <div
                key={item.grade}
                className="flex items-center gap-1 text-xs border rounded px-2 py-1"
              >
                <span
                  className="font-bold"
                  style={{ color: getNineScaleGradeColor(item.grade) }}
                >
                  {item.grade}
                </span>
                <span className="text-muted-foreground">({item.range})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={String(g)}>
                Grade {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {streams.length > 0 && (
          <Select value={selectedStream} onValueChange={setSelectedStream}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Streams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              {streams.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {terms.map((t) => (
              <SelectItem key={t} value={String(t)}>
                Term {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No entries match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry, idx) => {
            const subjectGrades = getSubjectGrades(entry);
            return (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Grade {Number(entry.grade)} — Term {Number(entry.term)}
                    {entry.stream && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {entry.stream}
                        {(entry.scienceSubgroup || entry.commerceSubgroup) &&
                          ` (${entry.scienceSubgroup ?? entry.commerceSubgroup})`}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {subjectGrades.map(({ key, label, grade }) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground truncate">{label}</span>
                        <span
                          className="font-bold ml-2"
                          style={{ color: getNineScaleGradeColor(grade) }}
                        >
                          {grade}
                        </span>
                      </div>
                    ))}
                  </div>
                  {subjectGrades.length === 0 && (
                    <p className="text-xs text-muted-foreground">No 9-scale data available.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
