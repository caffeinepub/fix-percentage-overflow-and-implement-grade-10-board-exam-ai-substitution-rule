import React, { useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  getOriginalTermPercentage,
  calculateCombinedTermPercentage,
  formatPercent,
} from '../lib/percent';
import { AcademicEntry } from '../backend';
import { Award } from 'lucide-react';

interface CertTier {
  label: string;
  image: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  emoji: string;
}

/**
 * Determine certificate tier based on combined term percentage:
 * combinedPct = (94 + originalTermPct) / 2
 * where originalTermPct = entry.termPercentage (from Progress tab)
 *
 * Platinum: 95–100%
 * Gold:     90–94%
 * Silver:   80–89%
 * Bronze:   70–79%
 * None:     < 70%
 */
function getCertTier(combinedPct: number): CertTier | null {
  if (combinedPct >= 95) return {
    label: 'Platinum Card',
    image: '/assets/generated/certificate-platinum.dim_400x250.png',
    bgClass: 'bg-gradient-to-br from-cyan-50 to-slate-100 dark:from-cyan-950 dark:to-slate-900',
    borderClass: 'border-cyan-400 dark:border-cyan-600',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    badgeClass: 'bg-cyan-500 text-white',
    emoji: '💎',
  };
  if (combinedPct >= 90) return {
    label: 'Gold Card',
    image: '/assets/generated/certificate-gold.dim_400x250.png',
    bgClass: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900',
    borderClass: 'border-yellow-400 dark:border-yellow-600',
    textClass: 'text-yellow-700 dark:text-yellow-300',
    badgeClass: 'bg-yellow-500 text-white',
    emoji: '🥇',
  };
  if (combinedPct >= 80) return {
    label: 'Silver Card',
    image: '/assets/generated/certificate-silver.dim_400x250.png',
    bgClass: 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900',
    borderClass: 'border-slate-400 dark:border-slate-500',
    textClass: 'text-slate-600 dark:text-slate-300',
    badgeClass: 'bg-slate-500 text-white',
    emoji: '🥈',
  };
  if (combinedPct >= 70) return {
    label: 'Bronze Card',
    image: '/assets/generated/certificate-bronze.dim_400x250.png',
    bgClass: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900',
    borderClass: 'border-amber-600 dark:border-amber-700',
    textClass: 'text-amber-700 dark:text-amber-400',
    badgeClass: 'bg-amber-600 text-white',
    emoji: '🥉',
  };
  return null;
}

interface CertificateCardProps {
  grade: number;
  term: number;
  entry: AcademicEntry;
  studentName: string;
}

function CertificateCard({ grade, term, entry, studentName }: CertificateCardProps) {
  // Step 1: Get the original term percentage from the backend (same as Progress tab)
  // This is termTotalMarks / termMaxMarks * 100, stored as entry.termPercentage
  const originalPct = getOriginalTermPercentage(entry);
  // Step 2: combined term percentage = (94 + originalPct) / 2
  const combinedPct = calculateCombinedTermPercentage(originalPct);
  const tier = getCertTier(combinedPct);

  if (!tier) {
    return (
      <Card className="border border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="p-4 text-center">
          <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">Grade {grade} — Term {term}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Combined: {formatPercent(combinedPct)} — No Certificate
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Minimum 70% combined required
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${tier.borderClass} ${tier.bgClass} overflow-hidden shadow-md`}>
      <CardContent className="p-0">
        {/* Certificate image */}
        <div className="relative w-full">
          <img
            src={tier.image}
            alt={`${tier.label} certificate`}
            className="w-full object-cover"
            style={{ maxHeight: '180px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Overlay with tier badge */}
          <div className="absolute top-2 right-2">
            <Badge className={`${tier.badgeClass} text-xs font-bold px-2 py-1`}>
              {tier.emoji} {tier.label}
            </Badge>
          </div>
        </div>

        {/* Certificate details */}
        <div className="p-4 space-y-2">
          <div className="text-center">
            <p className={`text-lg font-bold ${tier.textClass}`}>
              {tier.emoji} {tier.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Certificate of Achievement</p>
          </div>

          <div className="border-t border-current/10 pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Student</span>
              <span className="font-semibold">{studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Grade</span>
              <span className="font-semibold">Grade {grade}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Term</span>
              <span className="font-semibold">Term {term}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Term %</span>
              <span className="font-medium text-muted-foreground">{formatPercent(originalPct, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Combined % <span className="text-xs">(94+original)÷2</span></span>
              <span className={`font-bold text-base ${tier.textClass}`}>
                {formatPercent(combinedPct)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CertificateView() {
  const { data: entries = [], isLoading: entriesLoading, error: entriesError } = useGetAcademicEntries();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  const isLoading = entriesLoading || profileLoading;

  if (isLoading) return <LoadingState message="Loading certificates..." />;
  if (entriesError) return <ErrorMessage message="Failed to load academic entries." />;

  const studentName = userProfile?.name ?? 'Student';

  const uniqueGrades = Array.from(new Set(entries.map(e => Number(e.grade)))).sort((a, b) => a - b);
  const uniqueTerms = Array.from(
    new Set(
      entries
        .filter(e => filterGrade === 'all' || Number(e.grade) === Number(filterGrade))
        .map(e => Number(e.term))
    )
  ).sort((a, b) => a - b);

  // Build grade+term pairs from entries (latest entry per grade+term)
  const entryMap = new Map<string, AcademicEntry>();
  for (const entry of entries) {
    const key = `${Number(entry.grade)}-${Number(entry.term)}`;
    const existing = entryMap.get(key);
    if (!existing || Number(entry.timestamp) > Number(existing.timestamp)) {
      entryMap.set(key, entry);
    }
  }

  // Filter by selected grade/term
  const filteredPairs = Array.from(entryMap.entries())
    .filter(([key]) => {
      const [g, t] = key.split('-').map(Number);
      if (filterGrade !== 'all' && g !== Number(filterGrade)) return false;
      if (filterTerm !== 'all' && t !== Number(filterTerm)) return false;
      return true;
    })
    .sort(([a], [b]) => {
      const [ag, at] = a.split('-').map(Number);
      const [bg, bt] = b.split('-').map(Number);
      return ag !== bg ? ag - bg : at - bt;
    });

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No certificates yet</p>
        <p className="text-sm mt-1">Add academic entries to earn certificates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Certificate tier is based on combined % = (94 + original term %) ÷ 2, where original term % comes from your entered marks (same as Progress tab).
        </p>
        <p className="text-xs text-muted-foreground">
          💎 Platinum: 95–100% &nbsp;|&nbsp; 🥇 Gold: 90–94% &nbsp;|&nbsp; 🥈 Silver: 80–89% &nbsp;|&nbsp; 🥉 Bronze: 70–79%
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Grade:</label>
          <Select value={filterGrade} onValueChange={(v) => { setFilterGrade(v); setFilterTerm('all'); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map(g => (
                <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Term:</label>
          <Select value={filterTerm} onValueChange={setFilterTerm}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {uniqueTerms.map(t => (
                <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPairs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No entries match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPairs.map(([key, entry]) => {
            const [g, t] = key.split('-').map(Number);
            return (
              <CertificateCard
                key={key}
                grade={g}
                term={t}
                entry={entry}
                studentName={studentName}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
