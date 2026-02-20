import { useMemo, useState } from 'react';
import { useGetAcademicEntries } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, TrendingDown, Filter } from 'lucide-react';
import type { AcademicEntry } from '../backend';
import { getExpectedMaxMarksForSubjectKey } from '@/lib/maxMarks';
import { clampTo100, formatPercent } from '@/lib/percent';

interface SubjectStats {
  subjectName: string;
  averageMarks: string;
  averagePercentage: string;
  highestMarks: string;
  lowestMarks: string;
  count: number;
}

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

export default function SubjectAnalysisView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
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

  // Filter entries based on selected grade, section, and term
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedGrade !== 'all' && Number(entry.grade) !== Number(selectedGrade)) {
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
  }, [entries, selectedGrade, filterSection, filterTerm]);

  const getSubjectMarksDisplay = (entry: AcademicEntry, subjectKey: keyof typeof entry.subjects): { marks: number; maxMarks: number } | null => {
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

    return { marks: Number(marks), maxMarks };
  };

  const subjectStats = useMemo((): SubjectStats[] => {
    if (filteredEntries.length === 0) return [];

    // Collect marks per subject
    const subjectData = new Map<string, Array<{ marks: number; maxMarks: number }>>();

    for (const entry of filteredEntries) {
      const subjects = entry.subjects;
      
      for (const [key, value] of Object.entries(subjects)) {
        if (value !== undefined && value !== null) {
          const marksData = getSubjectMarksDisplay(entry, key as keyof typeof entry.subjects);
          
          if (marksData) {
            if (!subjectData.has(key)) {
              subjectData.set(key, []);
            }
            subjectData.get(key)!.push(marksData);
          }
        }
      }
    }

    // Calculate stats for each subject
    const stats: SubjectStats[] = [];

    for (const [key, marksArray] of subjectData.entries()) {
      if (marksArray.length === 0) continue;

      const avgMarks = marksArray.reduce((sum, m) => sum + m.marks, 0) / marksArray.length;
      const avgMaxMarks = marksArray.reduce((sum, m) => sum + m.maxMarks, 0) / marksArray.length;
      
      // Calculate average percentage
      const avgPercentage = avgMaxMarks > 0 ? clampTo100((avgMarks * 100) / avgMaxMarks) : 0;
      
      const highestEntry = marksArray.reduce((max, m) => m.marks > max.marks ? m : max);
      const lowestEntry = marksArray.reduce((min, m) => m.marks < min.marks ? m : min);

      stats.push({
        subjectName: SUBJECT_DISPLAY_NAMES[key] || key,
        averageMarks: `${Math.round(avgMarks)}/${Math.round(avgMaxMarks)}`,
        averagePercentage: `${formatPercent(avgPercentage)}%`,
        highestMarks: `${highestEntry.marks}/${highestEntry.maxMarks}`,
        lowestMarks: `${lowestEntry.marks}/${lowestEntry.maxMarks}`,
        count: marksArray.length,
      });
    }

    // Sort by subject name
    stats.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    return stats;
  }, [filteredEntries]);

  const chartData = useMemo(() => {
    return subjectStats.map((stat) => {
      // Parse the average marks display to get percentage
      const [marks, maxMarks] = stat.averageMarks.split('/').map(Number);
      const percentage = maxMarks > 0 ? clampTo100((marks * 100) / maxMarks) : 0;
      
      return {
        subject: stat.subjectName,
        marks: marks,
        maxMarks: maxMarks,
        percentage: percentage,
      };
    });
  }, [subjectStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
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
            Add academic entries to see subject-wise analysis.
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
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
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

      {filteredEntries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Data for Selected Filters</CardTitle>
            <CardDescription>
              Try adjusting your filter selections to see subject analysis.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Subject Statistics Table */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Subject Statistics</CardTitle>
              <CardDescription>
                Raw marks and percentage analysis for {selectedGrade === 'all' ? 'all grades' : `Grade ${selectedGrade}`}
                {filterSection !== 'all' && ` - ${filterSection}`}
                {filterTerm !== 'all' && ` - Term ${filterTerm}`}
                {' '}({filteredEntries.length} entries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Average Marks</TableHead>
                      <TableHead className="text-right">Avg %</TableHead>
                      <TableHead className="text-right">Highest</TableHead>
                      <TableHead className="text-right">Lowest</TableHead>
                      <TableHead className="text-right">Entries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectStats.map((stat) => (
                      <TableRow key={stat.subjectName}>
                        <TableCell className="font-medium">{stat.subjectName}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {stat.averageMarks}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                          {stat.averagePercentage}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-600 dark:text-green-400">
                          <div className="flex items-center justify-end gap-1">
                            <Award className="h-3 w-3" />
                            {stat.highestMarks}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-orange-600 dark:text-orange-400">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingDown className="h-3 w-3" />
                            {stat.lowestMarks}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {stat.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance Chart */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Subject Performance Chart</CardTitle>
              </div>
              <CardDescription>
                Average raw marks by subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="subject" type="category" width={120} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        if (name === 'marks') {
                          return [`${value}/${props.payload.maxMarks} (${formatPercent(props.payload.percentage)}%)`, 'Average Marks'];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="marks" fill="hsl(var(--primary))" name="Average Marks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
