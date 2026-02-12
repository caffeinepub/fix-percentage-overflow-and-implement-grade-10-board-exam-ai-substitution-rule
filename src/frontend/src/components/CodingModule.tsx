import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodingEditor from '@/components/CodingEditor';
import CodingHistory from '@/components/CodingHistory';
import { Code2, History } from 'lucide-react';

export default function CodingModule() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Python Coding Practice
        </h2>
        <p className="text-muted-foreground">
          Write, execute, and save Python code snippets. Practice with challenges and track your progress.
        </p>
      </div>

      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="editor" className="gap-2">
            <Code2 className="w-4 h-4" />
            Code Editor
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <CodingEditor />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <CodingHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
