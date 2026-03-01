import React, { useMemo } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { calculateAdjustedTermPercentage } from '../lib/percent';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, TrendingUp } from 'lucide-react';

interface GradeTermData {
  term: number;
  rawPercentage: number;
  adjustedPercentage: number;
}

interface GradeSummary {
  grade: number;
  stream?: string;
  terms: GradeTermData[];
  overallPercentage: number;
  termCount: number;
}

function getOverallColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 75) return 'text-green-600 dark:text-green-400';
  if (pct >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (pct >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getOverallBadgeVariant(pct: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (pct >= 75) return 'default';
  if (pct >= 50) return 'secondary';
  if (pct >= 35) return 'outline';
  return 'destructive';
}

export default function CombinedPercentageView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();

  const gradeSummaries = useMemo((): GradeSummary[] => {
    const gradeMap = new Map<string, { grade: number; stream?: string; termMap: Map<number, number> }>();

    for (const entry of entries as AcademicEntry[]) {
      const g = Number(entry.grade);
      const t = Number(entry.term);
      const pct = Number(entry.termPercentage);
      const stream = entry.stream ?? undefined;
      const key = `${g}__${stream ?? ''}`;

      if (!gradeMap.has(key)) {
        gradeMap.set(key, { grade: g, stream, termMap: new Map() });
      }
      const gradeData = gradeMap.get(key)!;
      // Keep the first (latest) entry per term
      if (!gradeData.termMap.has(t)) {
        gradeData.termMap.set(t, pct);
      }
    }

    const summaries: GradeSummary[] = [];

    for (const [, gradeData] of gradeMap) {
      const termEntries = [...gradeData.termMap.entries()].sort((a, b) => a[0] - b[0]);
      const terms: GradeTermData[] = termEntries.map(([term, rawPct]) => ({
        term,
        rawPercentage: rawPct,
        adjustedPercentage: calculateAdjustedTermPercentage(rawPct),
      }));

      // Overall = sum of adjusted percentages / number of terms (dynamic divisor)
      const termCount = terms.length;
      const overallPercentage =
        termCount > 0
          ? terms.reduce((sum, t) => sum + t.adjustedPercentage, 0) / termCount
          : 0;

      summaries.push({
        grade: gradeData.grade,
        stream: gradeData.stream,
        terms,
        overallPercentage: Math.round(overallPercentage * 10) / 10,
        termCount,
      });
    }

    return summaries.sort((a, b) => a.grade - b.grade);
  }, [entries]);

  if (isLoading) return <LoadingState message="Loading combined percentages..." />;
  if (error) return <ErrorMessage message="Failed to load academic entries." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Combined Percentage
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overall percentage per grade — adjusted term percentages averaged across all terms
        </p>
      </div>

      {/* Formula explanation */}
      <Card className="border border-border bg-muted/30">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="font-semibold text-foreground">Adjusted %</span>
              <span className="text-muted-foreground ml-1">= (Original % + 94) / 2</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Overall %</span>
              <span className="text-muted-foreground ml-1">= Sum of Adjusted % ÷ Number of Terms</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {gradeSummaries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Add academic entries to see combined percentages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {gradeSummaries.map((summary) => (
            <Card
              key={`${summary.grade}-${summary.stream ?? ''}`}
              className="border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base font-bold">
                    Grade {summary.grade}
                    {summary.stream && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        · {summary.stream}
                      </span>
                    )}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {summary.termCount} {summary.termCount === 1 ? 'term' : 'terms'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Per-term breakdown */}
                <div className="space-y-2">
                  {summary.terms.map((termData) => (
                    <div
                      key={termData.term}
                      className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium text-muted-foreground">Term {termData.term}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-foreground">
                          Raw: <span className="font-semibold">{termData.rawPercentage}%</span>
                        </span>
                        <span className="text-primary">
                          Adj: <span className="font-semibold">{termData.adjustedPercentage.toFixed(1)}%</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall percentage */}
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Overall %
                    <span className="text-xs font-normal text-muted-foreground">
                      (÷{summary.termCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getOverallColor(summary.overallPercentage)}`}>
                      {summary.overallPercentage.toFixed(1)}%
                    </span>
                    <Badge variant={getOverallBadgeVariant(summary.overallPercentage)}>
                      {summary.overallPercentage >= 90
                        ? 'Excellent'
                        : summary.overallPercentage >= 75
                        ? 'Good'
                        : summary.overallPercentage >= 50
                        ? 'Average'
                        : 'Needs Work'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
