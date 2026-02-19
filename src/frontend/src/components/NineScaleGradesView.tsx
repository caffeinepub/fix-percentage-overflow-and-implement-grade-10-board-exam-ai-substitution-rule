import { useMemo, useState } from 'react';
import { useGetAcademicEntries } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Calendar, BookOpen, Filter } from 'lucide-react';
import type { AcademicEntry, Score9Scale } from '../backend';
import { calculateNineScaleGrade, getNineScaleGradeColor } from '@/lib/gradeCalculation';
import { getExpectedMaxMarksForSubjectKey } from '@/lib/maxMarks';

const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
  math: 'Math',
  english: 'English',
  hindi: 'Hindi',
  evs: 'EVS',
  computer: 'Computer',
  kannada: 'Kannada',
  science: 'Science',
  social: 'Social',
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
  pe: 'PE',
};

interface GradeCard {
  subjectName: string;
  grade: number;
  marks: string;
  gradeLevel: number;
  section: string;
  term: number;
  timestamp: bigint;
}

export default function NineScaleGradesView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

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

  const getSubjectMarksAndGrade = (
    entry: AcademicEntry,
    subjectKey: keyof typeof entry.subjects
  ): { marks: string; grade: number } | null => {
    const marks = entry.subjects[subjectKey];
    if (marks === undefined || marks === null) return null;

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
      maxMarks = Number(entry.maxMarksPerSubject);
    }

    // Validate stored max marks and apply fallback if suspicious
    if (maxMarks === 0 || maxMarks === termMaxMarks || maxMarks > 150) {
      maxMarks = getExpectedMaxMarksForSubjectKey(subjectKey as string, grade, term);
    }

    if (maxMarks === 0) return null;

    // Calculate 9-scale grade from raw marks
    const nineScaleGrade = calculateNineScaleGrade(Number(marks), maxMarks);

    return {
      marks: `${Number(marks)}/${maxMarks}`,
      grade: nineScaleGrade,
    };
  };

  const gradeCards = useMemo((): GradeCard[] => {
    const cards: GradeCard[] = [];

    // Filter entries first
    const filtered = entries.filter((entry) => {
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

    for (const entry of filtered) {
      const subjects = entry.subjects;
      const section = entry.stream || entry.subgroup || 'N/A';

      for (const [key, value] of Object.entries(subjects)) {
        if (value !== undefined && value !== null) {
          const result = getSubjectMarksAndGrade(entry, key as keyof typeof entry.subjects);
          
          if (result) {
            cards.push({
              subjectName: SUBJECT_DISPLAY_NAMES[key] || key,
              grade: result.grade,
              marks: result.marks,
              gradeLevel: Number(entry.grade),
              section: section,
              term: Number(entry.term),
              timestamp: entry.timestamp,
            });
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    cards.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    return cards;
  }, [entries, filterGrade, filterSection, filterTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading 9-Scale Grades</CardTitle>
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
            Add academic entries to see 9-scale grades.
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
              <label className="text-sm font-medium">Grade Level</label>
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

      {gradeCards.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Data for Selected Filters</CardTitle>
            <CardDescription>
              Try adjusting your filter selections to see 9-scale grades.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">9-Scale Grades</h2>
            <p className="text-sm text-muted-foreground">
              Showing {gradeCards.length} grade{gradeCards.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gradeCards.map((card, index) => (
              <Card key={index} className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{card.subjectName}</CardTitle>
                    <Badge className={`text-lg font-bold px-3 py-1 ${getNineScaleGradeColor(card.grade)}`}>
                      {card.grade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Marks:</span>
                    <span className="font-mono">{card.marks}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Grade {card.gradeLevel}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{card.section}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Term {card.term}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {new Date(Number(card.timestamp) / 1000000).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
