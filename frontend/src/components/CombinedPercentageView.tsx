import React, { useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { calculateLetterGrade } from '../lib/gradeCalculation';
import { calculateAdjustedTermPercentage, calculateDynamicCombinedPercentage } from '../lib/percent';

function getGradeColor(letterGrade: string): string {
  if (letterGrade === 'A+') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (letterGrade === 'A') return 'bg-green-100 text-green-800 border-green-300';
  if (letterGrade === 'B+') return 'bg-blue-100 text-blue-800 border-blue-300';
  if (letterGrade === 'B') return 'bg-sky-100 text-sky-800 border-sky-300';
  if (letterGrade === 'C+') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (letterGrade === 'C') return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

interface GradeTermGroup {
  grade: number;
  stream: string;
  terms: Map<number, AcademicEntry>;
}

export default function CombinedPercentageView() {
  const { data: entries = [], isLoading } = useGetAcademicEntries();
  const [filterGrade, setFilterGrade] = useState<string>('all');

  const uniqueGrades = Array.from(new Set(entries.map(e => Number(e.grade)))).sort((a, b) => a - b);

  // Group entries by grade + stream
  const gradeStreamGroups = new Map<string, GradeTermGroup>();
  for (const entry of entries) {
    const grade = Number(entry.grade);
    const stream = entry.stream || 'General';
    const key = `${grade}__${stream}`;
    if (!gradeStreamGroups.has(key)) {
      gradeStreamGroups.set(key, { grade, stream, terms: new Map() });
    }
    const group = gradeStreamGroups.get(key)!;
    const term = Number(entry.term);
    // Keep the latest entry per term (entries are sorted newest first from backend)
    if (!group.terms.has(term)) {
      group.terms.set(term, entry);
    }
  }

  // Filter by grade
  const filteredGroups = Array.from(gradeStreamGroups.values())
    .filter(g => filterGrade === 'all' || g.grade === Number(filterGrade))
    .sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream));

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
        <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No academic entries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Combined Percentage</h2>
        <p className="text-sm text-muted-foreground">
          Adjusted % per term = (Original Term % + 94) ÷ 2 &nbsp;|&nbsp;
          Combined % = Sum of all term adjusted % ÷ number of terms (2 or 3)
        </p>
      </div>

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

        {filterGrade !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterGrade('all')}
          >
            Reset
          </Button>
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No data for selected filters.</p>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Combined Percentage by Grade</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Term 1 Orig %</TableHead>
                    <TableHead>Term 1 Adj %</TableHead>
                    <TableHead>Term 2 Orig %</TableHead>
                    <TableHead>Term 2 Adj %</TableHead>
                    <TableHead>Term 3 Orig %</TableHead>
                    <TableHead>Term 3 Adj %</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Combined %</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group, idx) => {
                    const t1 = group.terms.get(1);
                    const t2 = group.terms.get(2);
                    const t3 = group.terms.get(3);

                    const t1Orig = t1 ? Number(t1.termPercentage) : null;
                    const t2Orig = t2 ? Number(t2.termPercentage) : null;
                    const t3Orig = t3 ? Number(t3.termPercentage) : null;

                    const t1Adj = t1Orig !== null ? calculateAdjustedTermPercentage(t1Orig) : null;
                    const t2Adj = t2Orig !== null ? calculateAdjustedTermPercentage(t2Orig) : null;
                    const t3Adj = t3Orig !== null ? calculateAdjustedTermPercentage(t3Orig) : null;

                    // Collect all available adjusted percentages for dynamic combined calculation
                    const availableAdjusted = [t1Adj, t2Adj, t3Adj].filter((v): v is number => v !== null);
                    const termCount = availableAdjusted.length;
                    const combinedPct = calculateDynamicCombinedPercentage(availableAdjusted);

                    const letterGrade = calculateLetterGrade(combinedPct, 100);
                    const gradeColor = getGradeColor(letterGrade);

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{group.grade}</TableCell>
                        <TableCell>{group.stream}</TableCell>

                        {/* Term 1 */}
                        <TableCell>
                          {t1Orig !== null ? `${t1Orig}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {t1Adj !== null ? `${t1Adj.toFixed(1)}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        {/* Term 2 */}
                        <TableCell>
                          {t2Orig !== null ? `${t2Orig}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {t2Adj !== null ? `${t2Adj.toFixed(1)}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        {/* Term 3 */}
                        <TableCell>
                          {t3Orig !== null ? `${t3Orig}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {t3Adj !== null ? `${t3Adj.toFixed(1)}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        {/* Term count */}
                        <TableCell>
                          <Badge variant="outline" className="text-xs">÷{termCount}</Badge>
                        </TableCell>

                        {/* Combined % */}
                        <TableCell className="font-bold text-primary">
                          {termCount > 0 ? `${combinedPct.toFixed(1)}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        {/* Letter grade */}
                        <TableCell>
                          {termCount > 0
                            ? <Badge className={`${gradeColor} border`}>{letterGrade}</Badge>
                            : <span className="text-muted-foreground">—</span>
                          }
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
