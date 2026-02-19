import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddMarksForm from '@/components/AddMarksForm';
import ProgressView from '@/components/ProgressView';
import SubjectAnalysisView from '@/components/SubjectAnalysisView';
import NineScaleGradesView from '@/components/NineScaleGradesView';
import { BookOpen, TrendingUp, BarChart3, Award } from 'lucide-react';

export default function AcademicModule() {
  const [activeTab, setActiveTab] = useState<string>('add');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Lifelong Marks Tracking
        </h2>
        <p className="text-muted-foreground">
          Track your academic progress across all subjects and visualize your performance over time
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="add" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Add Marks
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            View Progress
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Subject Analysis
          </TabsTrigger>
          <TabsTrigger value="nine-scale" className="gap-2">
            <Award className="w-4 h-4" />
            9-Scale Grades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          <AddMarksForm onSuccess={() => setActiveTab('progress')} />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <ProgressView />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <SubjectAnalysisView />
        </TabsContent>

        <TabsContent value="nine-scale" className="space-y-6">
          <NineScaleGradesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
