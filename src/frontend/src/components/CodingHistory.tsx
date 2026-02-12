import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetCodingAttempts, useGetCodingChallenges } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Code2, Calendar, Award } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function CodingHistory() {
  const { data: attempts, isLoading: attemptsLoading } = useGetCodingAttempts();
  const { data: challenges, isLoading: challengesLoading } = useGetCodingChallenges();

  if (attemptsLoading || challengesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Code2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No coding attempts yet</p>
          <p className="text-sm text-muted-foreground/70">Start coding to build your practice history</p>
        </CardContent>
      </Card>
    );
  }

  const getChallengeTitle = (challengeId: bigint) => {
    const challenge = challenges?.find((c) => c.id === challengeId);
    return challenge?.title || `Challenge #${challengeId}`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Coding History</CardTitle>
        <CardDescription>All your saved coding attempts and solutions</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {attempts.map((attempt, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{getChallengeTitle(attempt.challengeId)}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(Number(attempt.timestamp) / 1000000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {attempt.score !== undefined && (
                    <Badge variant="secondary" className="gap-1">
                      <Award className="w-3 h-3" />
                      {Number(attempt.score)}/100
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Code</h4>
                    <ScrollArea className="h-[200px] w-full rounded-md border border-border/50">
                      <pre className="bg-muted p-4 text-xs font-mono">{attempt.code}</pre>
                    </ScrollArea>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Output</h4>
                    <ScrollArea className="h-[150px] w-full rounded-md border border-border/50">
                      <pre className="bg-muted p-4 text-xs font-mono whitespace-pre-wrap">
                        {attempt.result || 'No output recorded'}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
