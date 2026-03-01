import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAcademicEntries } from '../hooks/useQueries';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { computeSubjectStatistics, SubjectStatistics } from '../lib/subjectAnalysis';

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Mathematics',
  english: 'English',
  hindi: 'Hindi',
  evs: 'EVS',
  computer: 'Computer',
  kannada: 'Kannada',
  science: 'Science',
  ssc: 'SSC',
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
  pe: 'P.E.',
  maths: 'Maths',
  appliedMaths: 'Applied Maths',
};

function getSubjectLabel(stat: SubjectStatistics): string {
  return SUBJECT_LABELS[stat.subjectKey] ?? stat.subjectKey;
}

export default function SubjectAnalysisView() {
  const { data: entries = [], isLoading, error, refetch } = useGetAcademicEntries();

  const subjectStats = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    try {
      return computeSubjectStatistics(entries);
    } catch (e) {
      console.error('Error computing subject statistics:', e);
      return [];
    }
  }, [entries]);

  const chartData = useMemo(() => {
    return subjectStats.map((s) => ({
      subject: getSubjectLabel(s),
      average: Math.round(s.averagePercentage),
      highest: Math.round(s.highestPercentage),
      lowest: Math.round(s.lowestPercentage),
    }));
  }, [subjectStats]);

  if (isLoading) {
    return <LoadingState message="Loading subject analysis..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load subject data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No data available for subject analysis.</p>
        <p className="text-sm mt-1">Add your marks to see subject-wise analysis.</p>
      </div>
    );
  }

  if (subjectStats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No subject statistics could be computed from the available data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="subject"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val) => [`${val}%`]} />
              <Legend verticalAlign="top" />
              <Bar dataKey="average" name="Average %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="highest" name="Highest %" fill="hsl(var(--primary))" opacity={0.6} radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowest" name="Lowest %" fill="hsl(var(--primary))" opacity={0.3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectStats.map((stat) => (
          <Card key={stat.subjectKey}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{getSubjectLabel(stat)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average</span>
                <span className="font-semibold">{Math.round(stat.averagePercentage)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Highest</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {Math.round(stat.highestPercentage)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lowest</span>
                <span className="font-semibold text-orange-500">
                  {Math.round(stat.lowestPercentage)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entries</span>
                <span className="font-semibold">{stat.count}</span>
              </div>
              {stat.averageMarksDisplay && stat.averageMarksDisplay !== '-' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Marks</span>
                  <span className="font-semibold">{stat.averageMarksDisplay}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
