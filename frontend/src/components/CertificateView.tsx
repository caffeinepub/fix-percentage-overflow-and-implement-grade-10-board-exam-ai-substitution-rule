import React, { useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Filter } from 'lucide-react';
import { isBoardExamGrade } from '../lib/boardExam';

// Adjusted percentage formula: (originalPercentage + 94) / 2
function getAdjustedPercentage(originalPercentage: number): number {
  return (originalPercentage + 94) / 2;
}

type Tier = 'platinum' | 'gold' | 'silver' | 'bronze' | null;

function getTier(adjustedPercentage: number): Tier {
  if (adjustedPercentage >= 95) return 'platinum';
  if (adjustedPercentage >= 90) return 'gold';
  if (adjustedPercentage >= 80) return 'silver';
  if (adjustedPercentage >= 70) return 'bronze';
  return null;
}

const TIER_CONFIG = {
  platinum: {
    label: 'Platinum',
    image: '/assets/generated/certificate-platinum.dim_400x250.png',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-400',
    borderClass: 'border-slate-400',
    glowClass: 'shadow-slate-300',
  },
  gold: {
    label: 'Gold',
    image: '/assets/generated/certificate-gold.dim_400x250.png',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    borderClass: 'border-yellow-400',
    glowClass: 'shadow-yellow-200',
  },
  silver: {
    label: 'Silver',
    image: '/assets/generated/certificate-silver.dim_400x250.png',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-400',
    borderClass: 'border-gray-400',
    glowClass: 'shadow-gray-200',
  },
  bronze: {
    label: 'Bronze',
    image: '/assets/generated/certificate-bronze.dim_400x250.png',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-400',
    borderClass: 'border-orange-400',
    glowClass: 'shadow-orange-200',
  },
};

interface CertificateCardProps {
  entry: AcademicEntry;
}

function CertificateCard({ entry }: CertificateCardProps) {
  const originalPercentage = Number(entry.termPercentage);
  const adjustedPercentage = getAdjustedPercentage(originalPercentage);
  const tier = getTier(adjustedPercentage);
  const gradeNum = Number(entry.grade);
  const isBoardExam = isBoardExamGrade(gradeNum);

  if (!tier) {
    return (
      <Card className="border-2 border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Grade {gradeNum} — Term {Number(entry.term)}
            {isBoardExam && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-400 border text-xs dark:bg-amber-900 dark:text-amber-200">
                Board Exam
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">Score below 70% — no certificate awarded</p>
            <p className="text-lg font-bold mt-1">{adjustedPercentage.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              ({originalPercentage}% + 94) ÷ 2
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = TIER_CONFIG[tier];

  return (
    <Card className={`border-2 ${config.borderClass} shadow-lg ${config.glowClass} overflow-hidden`}>
      <div className="relative">
        <img
          src={config.image}
          alt={`${config.label} Certificate`}
          className="w-full object-cover"
          style={{ maxHeight: '180px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
          <div className="text-white">
            <p className="text-xs font-medium opacity-80 flex items-center gap-1.5">
              Grade {gradeNum} — Term {Number(entry.term)}
              {entry.stream ? ` — ${entry.stream}` : ''}
              {isBoardExam && (
                <span className="bg-amber-400/80 text-amber-900 text-xs px-1.5 py-0.5 rounded font-semibold">
                  Board Exam
                </span>
              )}
            </p>
            <p className="text-2xl font-bold">{adjustedPercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <Badge className={`${config.badgeClass} border font-semibold`}>
              <Award className="w-3 h-3 mr-1" />
              {config.label} Certificate
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Original: {originalPercentage}% → Adjusted: ({originalPercentage} + 94) ÷ 2 = {adjustedPercentage.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Grade</p>
            <p className="font-bold text-primary">{entry.gradeText}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CertificateView() {
  const { data: entries = [], isLoading } = useGetAcademicEntries();
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');

  const uniqueGrades = Array.from(new Set(entries.map(e => Number(e.grade)))).sort((a, b) => a - b);
  const uniqueTerms = Array.from(new Set(entries.map(e => Number(e.term)))).sort((a, b) => a - b);

  const filteredEntries = entries.filter(entry => {
    const gradeMatch = filterGrade === 'all' || Number(entry.grade) === Number(filterGrade);
    const termMatch = filterTerm === 'all' || Number(entry.term) === Number(filterTerm);
    return gradeMatch && termMatch;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
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
        <Award className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No academic entries found. Add marks to earn certificates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Certificates
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Adjusted percentage = (Original % + 94) ÷ 2. Tiers: Platinum ≥95%, Gold ≥90%, Silver ≥80%, Bronze ≥70%.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-3 bg-muted/30 rounded-lg border">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Grade:</span>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map(g => (
                <SelectItem key={g} value={String(g)}>
                  Grade {g}{isBoardExamGrade(g) ? ' (Board)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Term:</span>
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

        {(filterGrade !== 'all' || filterTerm !== 'all') && (
          <button
            type="button"
            onClick={() => { setFilterGrade('all'); setFilterTerm('all'); }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Certificate Grid */}
      {sortedEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No entries match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEntries.map((entry, idx) => (
            <CertificateCard key={idx} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
