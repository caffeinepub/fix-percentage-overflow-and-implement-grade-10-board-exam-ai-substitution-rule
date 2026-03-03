import React from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getOriginalTermPercentage,
  calculateCombinedTermPercentage,
  calculateOverallGradePercentage,
  formatPercent,
} from '../lib/percent';
import { calculateNineScaleFromPercentage, getNineScaleGradeColor } from '../lib/gradeCalculation';
import { AcademicEntry } from '../backend';

function getCertTier(pct: number): { label: string; color: string } | null {
  if (pct >= 95) return { label: 'Platinum', color: 'text-cyan-600 dark:text-cyan-400' };
  if (pct >= 90) return { label: 'Gold', color: 'text-yellow-600 dark:text-yellow-400' };
  if (pct >= 80) return { label: 'Silver', color: 'text-slate-500 dark:text-slate-400' };
  if (pct >= 70) return { label: 'Bronze', color: 'text-amber-700 dark:text-amber-500' };
  return null;
}

export default function CombinedPercentageView() {
  const { data: entries = [], isLoading, error } = useGetAcademicEntries();

  if (isLoading) return <LoadingState message="Loading combined percentages..." />;
  if (error) return <ErrorMessage message="Failed to load academic entries." />;

  // Group entries by grade
  const gradeMap = new Map<number, AcademicEntry[]>();
  for (const entry of entries) {
    const g = Number(entry.grade);
    if (!gradeMap.has(g)) gradeMap.set(g, []);
    gradeMap.get(g)!.push(entry);
  }

  if (gradeMap.size === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No data available</p>
        <p className="text-sm mt-1">Add academic entries to see combined percentages.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Combined % per term = (94% + original term %) ÷ 2, where original term % is from your entered marks (same as Progress tab). Overall grade % = average of all combined term percentages.
      </p>

      {Array.from(gradeMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([grade, gradeEntries]) => {
          // Group by term — keep latest entry per term
          const termMap = new Map<number, AcademicEntry>();
          for (const e of gradeEntries) {
            const t = Number(e.term);
            const existing = termMap.get(t);
            if (!existing || Number(e.timestamp) > Number(existing.timestamp)) {
              termMap.set(t, e);
            }
          }

          // Per-term: use stored termPercentage (same as Progress tab) → combined = (94 + original) / 2
          const termCombinedPcts: { term: number; originalPct: number; combinedPct: number }[] = [];
          Array.from(termMap.entries())
            .sort(([a], [b]) => a - b)
            .forEach(([term, entry]) => {
              // Use the stored termPercentage — the same value shown in the Progress tab
              const originalPct = getOriginalTermPercentage(entry);
              const combinedPct = calculateCombinedTermPercentage(originalPct);
              termCombinedPcts.push({ term, originalPct, combinedPct });
            });

          // Overall grade % = average of combined term percentages (÷ number of terms)
          const overallGradePct = calculateOverallGradePercentage(
            termCombinedPcts.map(t => t.combinedPct)
          );
          const overallScale = calculateNineScaleFromPercentage(overallGradePct);
          const overallTier = getCertTier(overallGradePct);
          const termCount = termCombinedPcts.length;

          return (
            <Card key={grade} className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span>Grade {grade}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {overallTier && (
                      <span className={`text-sm font-semibold ${overallTier.color}`}>
                        🏅 {overallTier.label} Certificate
                      </span>
                    )}
                    <Badge className={`${getNineScaleGradeColor(overallScale)} text-sm px-2`}>
                      Scale: {overallScale}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Per-term breakdown */}
                  {termCombinedPcts.map(({ term, originalPct, combinedPct }) => {
                    const termScale = calculateNineScaleFromPercentage(combinedPct);
                    const termTier = getCertTier(combinedPct);
                    return (
                      <div
                        key={term}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Term {term}</span>
                          <span className="text-xs text-muted-foreground">
                            Original: {formatPercent(originalPct, 0)} → Combined: (94 + {originalPct.toFixed(0)}) ÷ 2
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">{formatPercent(combinedPct)}</span>
                          {termTier && (
                            <span className={`text-xs font-semibold ${termTier.color}`}>
                              {termTier.label}
                            </span>
                          )}
                          <Badge className={`text-xs ${getNineScaleGradeColor(termScale)}`}>
                            {termScale}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}

                  {/* Overall grade row */}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t-2 border-primary/30">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Overall Grade {grade}</span>
                      <span className="text-xs text-muted-foreground">
                        Sum of combined term % ÷ {termCount} term{termCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-primary">
                        {formatPercent(overallGradePct)}
                      </span>
                      <Badge className={`text-sm font-bold ${getNineScaleGradeColor(overallScale)}`}>
                        {overallScale}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
