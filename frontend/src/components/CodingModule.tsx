import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodingEditor from './CodingEditor';
import CodingHistory from './CodingHistory';
import { ErrorBoundary } from './ErrorBoundary';

export default function CodingModule() {
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'history')}>
        <TabsList>
          <TabsTrigger value="editor">Code Editor</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <ErrorBoundary>
            <CodingEditor />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="history">
          <ErrorBoundary>
            <CodingHistory />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
