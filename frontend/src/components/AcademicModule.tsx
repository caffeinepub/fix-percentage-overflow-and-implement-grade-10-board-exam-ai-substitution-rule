import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddMarksForm from './AddMarksForm';
import ProgressView from './ProgressView';
import SubjectAnalysisView from './SubjectAnalysisView';
import NineScaleGradesView from './NineScaleGradesView';
import CombinedPercentageView from './CombinedPercentageView';
import CertificateView from './CertificateView';
import { ErrorBoundary } from './ErrorBoundary';

type AcademicTab =
  | 'add-marks'
  | 'progress'
  | 'subject-analysis'
  | 'nine-scale'
  | 'combined'
  | 'certificates';

export default function AcademicModule() {
  const [activeTab, setActiveTab] = useState<AcademicTab>('add-marks');

  const handleMarksAdded = () => {
    setActiveTab('progress');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AcademicTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="add-marks" className="text-xs sm:text-sm">
            Add Marks
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-xs sm:text-sm">
            Progress
          </TabsTrigger>
          <TabsTrigger value="subject-analysis" className="text-xs sm:text-sm">
            Subject Analysis
          </TabsTrigger>
          <TabsTrigger value="nine-scale" className="text-xs sm:text-sm">
            9-Scale Grades
          </TabsTrigger>
          <TabsTrigger value="combined" className="text-xs sm:text-sm">
            Combined %
          </TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs sm:text-sm">
            Certificates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add-marks">
          <ErrorBoundary>
            <AddMarksForm onSuccess={handleMarksAdded} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="progress">
          <ErrorBoundary>
            <ProgressView />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="subject-analysis">
          <ErrorBoundary>
            <SubjectAnalysisView />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="nine-scale">
          <ErrorBoundary>
            <NineScaleGradesView />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="combined">
          <ErrorBoundary>
            <CombinedPercentageView />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="certificates">
          <ErrorBoundary>
            <CertificateView />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
