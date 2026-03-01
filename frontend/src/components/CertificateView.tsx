import React, { useMemo, useState } from 'react';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { AcademicEntry } from '../backend';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award } from 'lucide-react';

// Certificate percentage formula: (originalTermPercentage + 94) / 2
function computeCertificatePercentage(originalPct: number): number {
  return (originalPct + 94) / 2;
}

type CertTier = 'platinum' | 'gold' | 'silver' | 'bronze';

function getCertTier(pct: number): CertTier {
  if (pct >= 90) return 'platinum';
  if (pct >= 75) return 'gold';
  if (pct >= 60) return 'silver';
  return 'bronze';
}

const CERT_IMAGES: Record<CertTier, string> = {
  platinum: '/assets/generated/certificate-platinum.dim_400x250.png',
  gold: '/assets/generated/certificate-gold.dim_400x250.png',
  silver: '/assets/generated/certificate-silver.dim_400x250.png',
  bronze: '/assets/generated/certificate-bronze.dim_400x250.png',
};

const TIER_LABELS: Record<CertTier, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const TIER_COLORS: Record<CertTier, string> = {
  platinum: 'bg-slate-200 text-slate-800 border-slate-400',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-400',
  silver: 'bg-gray-100 text-gray-700 border-gray-400',
  bronze: 'bg-orange-100 text-orange-800 border-orange-400',
};

interface CertificateEntry {
  grade: number;
  term: number;
  stream?: string;
  originalPercentage: number;
  certificatePercentage: number;
  tier: CertTier;
  isBoardExam: boolean;
}

export default function CertificateView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();

  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const uniqueGrades = useMemo(() => {
    return [...new Set(entries.map((e: AcademicEntry) => Number(e.grade)))].sort((a, b) => a - b);
  }, [entries]);

  const uniqueTerms = useMemo(() => {
    let filtered = entries as AcademicEntry[];
    if (filterGrade !== 'all') {
      filtered = filtered.filter((e) => Number(e.grade) === parseInt(filterGrade));
    }
    return [...new Set(filtered.map((e) => Number(e.term)))].sort((a, b) => a - b);
  }, [entries, filterGrade]);

  // Build one certificate per grade+term combination (use latest entry per grade+term)
  const certificates = useMemo((): CertificateEntry[] => {
    const seen = new Map<string, CertificateEntry>();

    for (const entry of entries as AcademicEntry[]) {
      const g = Number(entry.grade);
      const t = Number(entry.term);
      const key = `${g}__${t}`;

      // Only keep the first (latest) entry per grade+term
      if (seen.has(key)) continue;

      const originalPct = Number(entry.termPercentage);
      const certPct = computeCertificatePercentage(originalPct);
      const tier = getCertTier(certPct);
      const isBoardExam = t >= 8;

      seen.set(key, {
        grade: g,
        term: t,
        stream: entry.stream ?? undefined,
        originalPercentage: originalPct,
        certificatePercentage: Math.round(certPct * 10) / 10,
        tier,
        isBoardExam,
      });
    }

    let certs = [...seen.values()];

    if (filterGrade !== 'all') {
      certs = certs.filter((c) => c.grade === parseInt(filterGrade));
    }
    if (filterTerm !== 'all') {
      certs = certs.filter((c) => c.term === parseInt(filterTerm));
    }

    return certs.sort((a, b) => a.grade - b.grade || a.term - b.term);
  }, [entries, filterGrade, filterTerm]);

  if (isLoading) return <LoadingState message="Loading certificates..." />;
  if (error) return <ErrorMessage message="Failed to load academic entries." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Certificates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Certificate % = (Original Term % + 94) / 2 — one per grade &amp; term
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select
            value={filterGrade}
            onValueChange={(v) => { setFilterGrade(v); setFilterTerm('all'); }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map((g) => (
                <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTerm} onValueChange={setFilterTerm}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {uniqueTerms.map((t) => (
                <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters */}
      {(filterGrade !== 'all' || filterTerm !== 'all') && (
        <div className="flex gap-2 flex-wrap">
          {filterGrade !== 'all' && <Badge variant="secondary">Grade {filterGrade}</Badge>}
          {filterTerm !== 'all' && <Badge variant="secondary">Term {filterTerm}</Badge>}
        </div>
      )}

      {certificates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No certificates available</p>
          <p className="text-sm">Add academic entries to generate certificates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {certificates.map((cert) => {
            const imgKey = `${cert.grade}-${cert.term}`;
            const imgSrc = CERT_IMAGES[cert.tier];
            const hasImgError = imgErrors[imgKey];

            return (
              <Card
                key={imgKey}
                className="border border-border shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Certificate image */}
                <div className="relative w-full aspect-[400/250] bg-muted/30">
                  {!hasImgError ? (
                    <img
                      src={imgSrc}
                      alt={`${TIER_LABELS[cert.tier]} Certificate`}
                      className="w-full h-full object-cover"
                      onError={() =>
                        setImgErrors((prev) => ({ ...prev, [imgKey]: true }))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                      <Award className="w-16 h-16 text-muted-foreground opacity-40" />
                    </div>
                  )}
                  {/* Tier badge overlay */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${TIER_COLORS[cert.tier]}`}
                    >
                      {TIER_LABELS[cert.tier]}
                    </span>
                  </div>
                  {cert.isBoardExam && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">Board Exam</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="pt-4 pb-4 space-y-3">
                  {/* Grade & Term */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">
                        Grade {cert.grade}
                        {cert.stream && (
                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            · {cert.stream}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Term {cert.term}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {cert.certificatePercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Certificate %</p>
                    </div>
                  </div>

                  {/* Formula breakdown */}
                  <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Formula: </span>
                    ({cert.originalPercentage}% + 94) ÷ 2 ={' '}
                    <span className="font-semibold text-foreground">
                      {cert.certificatePercentage.toFixed(1)}%
                    </span>
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
