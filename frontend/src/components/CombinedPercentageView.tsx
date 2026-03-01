import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { calculateAdjustedTermPercentage, calculateDynamicCombinedPercentage } from '../lib/percent';
import type { AcademicEntry } from '../backend';

interface GradeStreamGroup {
  grade: number;
  stream: string;
  entries: AcademicEntry[];
}

function groupEntriesByGradeStream(entries: AcademicEntry[]): GradeStreamGroup[] {
  const map = new Map<string, GradeStreamGroup>();
  for (const entry of entries) {
    const grade = Number(entry.grade);
    const stream = entry.stream ?? '';
    const key = `${grade}-${stream}`;
    if (!map.has(key)) {
      map.set(key, { grade, stream, entries: [] });
    }
    map.get(key)!.entries.push(entry);
  }
  return Array.from(map.values()).sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream));
}

export default function CombinedPercentageView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();

  const groups = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    try {
      return groupEntriesByGradeStream(entries);
    } catch (e) {
      console.error('Error grouping entries:', e);
      return [];
    }
  }, [entries]);

  if (isLoading) {
    return <LoadingState message="Loading combined percentages..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load percentage data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No data available for combined percentages.</p>
        <p className="text-sm mt-1">Add marks for multiple terms to see combined percentages.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const term1Entry = group.entries.find((e) => Number(e.term) === 1);
        const term2Entry = group.entries.find((e) => Number(e.term) === 2);
        const term3Entry = group.entries.find((e) => Number(e.term) === 3);

        const t1Pct = term1Entry ? Number(term1Entry.termPercentage) : null;
        const t2Pct = term2Entry ? Number(term2Entry.termPercentage) : null;
        const t3Pct = term3Entry ? Number(term3Entry.termPercentage) : null;

        const t1Adj = t1Pct !== null ? calculateAdjustedTermPercentage(t1Pct) : null;
        const t2Adj = t2Pct !== null ? calculateAdjustedTermPercentage(t2Pct) : null;
        const t3Adj = t3Pct !== null ? calculateAdjustedTermPercentage(t3Pct) : null;

        const combined = calculateDynamicCombinedPercentage(t1Adj, t2Adj, t3Adj);

        return (
          <Card key={`${group.grade}-${group.stream}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Grade {group.grade}
                {group.stream && (
                  <Badge variant="outline">{group.stream}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {t1Pct !== null && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Term 1</p>
                    <p className="text-lg font-bold text-foreground">{t1Pct}%</p>
                    <p className="text-xs text-muted-foreground">Adj: {t1Adj?.toFixed(1)}%</p>
                  </div>
                )}
                {t2Pct !== null && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Term 2</p>
                    <p className="text-lg font-bold text-foreground">{t2Pct}%</p>
                    <p className="text-xs text-muted-foreground">Adj: {t2Adj?.toFixed(1)}%</p>
                  </div>
                )}
                {t3Pct !== null && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Term 3</p>
                    <p className="text-lg font-bold text-foreground">{t3Pct}%</p>
                    <p className="text-xs text-muted-foreground">Adj: {t3Adj?.toFixed(1)}%</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Combined</p>
                  <p className="text-2xl font-bold text-primary">{combined.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
