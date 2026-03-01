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
import type { AcademicEntry } from '../backend';

type Tier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'none';

function getTier(percentage: number): Tier {
  if (percentage >= 90) return 'platinum';
  if (percentage >= 75) return 'gold';
  if (percentage >= 60) return 'silver';
  if (percentage >= 40) return 'bronze';
  return 'none';
}

const TIER_IMAGES: Record<Exclude<Tier, 'none'>, string> = {
  platinum: '/assets/generated/certificate-platinum.dim_400x250.png',
  gold: '/assets/generated/certificate-gold.dim_400x250.png',
  silver: '/assets/generated/certificate-silver.dim_400x250.png',
  bronze: '/assets/generated/certificate-bronze.dim_400x250.png',
};

const TIER_LABELS: Record<Tier, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  none: 'No Certificate',
};

const TIER_COLORS: Record<Tier, string> = {
  platinum: 'text-cyan-500',
  gold: 'text-yellow-500',
  silver: 'text-gray-400',
  bronze: 'text-orange-600',
  none: 'text-muted-foreground',
};

function isBoardExamEntry(entry: AcademicEntry): boolean {
  return Number(entry.term) >= 8;
}

interface CertificateCardProps {
  entry: AcademicEntry;
}

function CertificateCard({ entry }: CertificateCardProps) {
  const percentage = Number(entry.termPercentage);
  const tier = getTier(percentage);
  const isBoard = isBoardExamEntry(entry);
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="overflow-hidden">
      {tier !== 'none' && !imgError ? (
        <div className="relative">
          <img
            src={TIER_IMAGES[tier]}
            alt={`${TIER_LABELS[tier]} Certificate`}
            className="w-full object-cover"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <div>
              <p className={`text-lg font-bold ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</p>
              <p className="text-white text-sm">{percentage}%</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-32 bg-muted flex items-center justify-center">
          <p className={`text-lg font-bold ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</p>
        </div>
      )}
      <CardContent className="pt-3 pb-4">
        <div className="flex flex-wrap gap-1 items-center">
          <Badge variant="outline">Grade {Number(entry.grade)}</Badge>
          <Badge variant="outline">Term {Number(entry.term)}</Badge>
          {entry.stream && <Badge variant="secondary">{entry.stream}</Badge>}
          {isBoard && <Badge variant="default">Board Exam</Badge>}
          {(entry.scienceSubgroup || entry.commerceSubgroup) && (
            <Badge variant="secondary" className="text-xs">
              {entry.scienceSubgroup ?? entry.commerceSubgroup}
            </Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {Number(entry.termTotalMarks)} / {Number(entry.termMaxMarks)} marks
        </p>
      </CardContent>
    </Card>
  );
}

export default function CertificateView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  const grades = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    return Array.from(new Set(entries.map((e) => Number(e.grade)))).sort((a, b) => a - b);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (selectedGrade === 'all') return entries;
    return entries.filter((e) => Number(e.grade) === parseInt(selectedGrade));
  }, [entries, selectedGrade]);

  if (isLoading) {
    return <LoadingState message="Loading certificates..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load certificate data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No certificates yet.</p>
        <p className="text-sm mt-1">Add your marks to earn certificates based on your performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">Filter by Grade:</label>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={String(g)}>
                Grade {g}
                {(g === 10 || g === 12) && ' (Board)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.map((entry, idx) => (
          <CertificateCard key={idx} entry={entry} />
        ))}
      </div>
    </div>
  );
}
