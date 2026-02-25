import React, { useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { getExpectedMaxMarksForSubjectKey } from '../lib/maxMarks';
import { calculateNineScaleFromPercentage, getNineScaleGradeColor } from '../lib/gradeCalculation';

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

// 9-scale grading legend
const SCALE_LEGEND = [
  { range: '90–100', grade: 9, label: 'Outstanding' },
  { range: '80–89', grade: 8, label: 'Excellent' },
  { range: '70–79', grade: 7, label: 'Very Good' },
  { range: '60–69', grade: 6, label: 'Good' },
  { range: '50–59', grade: 5, label: 'Average' },
  { range: '40–49', grade: 4, label: 'Below Average' },
  { range: '30–39', grade: 3, label: 'Satisfactory' },
  { range: '20–29', grade: 2, label: 'Needs Improvement' },
  { range: '0–19', grade: 1, label: 'Unsatisfactory' },
];

interface SubjectScaleCardProps {
  subjectKey: string;
  marks: number;
  scale: number;
  percentage: number;
  maxMarks: number;
}

function SubjectScaleCard({ subjectKey, marks, scale, percentage, maxMarks }: SubjectScaleCardProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded border">
      <div>
        <p className="text-sm font-medium">{SUBJECT_LABELS[subjectKey] || subjectKey}</p>
        <p className="text-xs text-muted-foreground">{marks}/{maxMarks} ({percentage.toFixed(1)}%)</p>
      </div>
      <Badge className={`${getNineScaleGradeColor(scale)} border font-bold text-base px-3`}>
        {scale}
      </Badge>
    </div>
  );
}

export default function NineScaleGradesView() {
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

  const sorted = [...filtered].sort((a, b) => {
    const gradeDiff = Number(a.grade) - Number(b.grade);
    if (gradeDiff !== 0) return gradeDiff;
    return Number(a.term) - Number(b.term);
  });

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
        <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No academic entries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grading Scale Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">9-Point Grading Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SCALE_LEGEND.map(({ range, grade, label }) => (
              <div
                key={grade}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${getNineScaleGradeColor(grade)}`}
              >
                <span className="font-bold text-sm">{grade}</span>
                <span className="text-xs opacity-80">{range}%</span>
                <span className="hidden sm:inline opacity-70">· {label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No data for selected filters.</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((entry, idx) => {
            const subjectMarks = entry.subjects;

            // Compute 9-scale grades from raw marks using the updated scale
            const subjectPairs = Object.entries(subjectMarks)
              .filter(([, val]) => val !== undefined && val !== null)
              .map(([key, val]) => {
                const marks = Number(val);
                const maxMarks = getExpectedMaxMarksForSubjectKey(
                  key,
                  Number(entry.grade),
                  Number(entry.term)
                ) || Number(entry.maxMarksPerSubject) || 100;
                const percentage = maxMarks > 0 ? (marks * 100) / maxMarks : 0;
                const scale = calculateNineScaleFromPercentage(percentage);
                return { key, scale, marks, maxMarks, percentage };
              });

            return (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>
                      Grade {Number(entry.grade)} — Term {Number(entry.term)}
                      {entry.stream ? ` — ${entry.stream}` : ''}
                    </span>
                    <Badge variant="outline">{Number(entry.termPercentage)}%</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {subjectPairs.map(({ key, scale, marks, maxMarks, percentage }) => (
                      <SubjectScaleCard
                        key={key}
                        subjectKey={key}
                        marks={marks}
                        scale={scale}
                        percentage={percentage}
                        maxMarks={maxMarks}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
