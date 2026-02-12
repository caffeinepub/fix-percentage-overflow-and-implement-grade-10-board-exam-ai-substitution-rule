import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useGetCodingChallenges, useSaveCodingAttempt } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Play, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePyodide } from '@/hooks/usePyodide';

export default function CodingEditor() {
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [output, setOutput] = useState('');
  const [score, setScore] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const { data: challenges, isLoading: challengesLoading } = useGetCodingChallenges();
  const saveAttempt = useSaveCodingAttempt();
  const { runPython, isLoading: pyodideLoading, error: pyodideError } = usePyodide();

  const selectedChallengeData = challenges?.find(
    (c) => c.id.toString() === selectedChallenge
  );

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');

    try {
      const result = await runPython(code);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChallenge) {
      toast.error('Please select a challenge first');
      return;
    }

    try {
      await saveAttempt.mutateAsync({
        challengeId: BigInt(selectedChallenge),
        code,
        result: output,
        score: score ? parseInt(score) : null,
      });

      toast.success('Coding attempt saved successfully!');
      setScore('');
    } catch (error) {
      toast.error('Failed to save attempt. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Challenge Selection */}
      <Card className="lg:col-span-1 border-border/50">
        <CardHeader>
          <CardTitle>Challenge</CardTitle>
          <CardDescription>Select a coding challenge to practice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {challengesLoading ? (
            <div className="text-sm text-muted-foreground">Loading challenges...</div>
          ) : challenges && challenges.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label>Select Challenge</Label>
                <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    {challenges.map((challenge) => (
                      <SelectItem key={challenge.id.toString()} value={challenge.id.toString()}>
                        {challenge.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedChallengeData && (
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedChallengeData.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Sample Input</h4>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {selectedChallengeData.sampleInput}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Expected Output</h4>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {selectedChallengeData.sampleOutput}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No challenges available yet. Contact your instructor to add challenges.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Code Editor and Output */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Python Editor</CardTitle>
            <CardDescription>Write and execute your Python code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pyodideError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{pyodideError}</AlertDescription>
              </Alert>
            )}

            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your Python code here..."
              className="font-mono text-sm min-h-[300px]"
              disabled={pyodideLoading}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleRun}
                disabled={isRunning || pyodideLoading}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : pyodideLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Python...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Code
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
                variant="secondary"
                disabled={saveAttempt.isPending || !selectedChallenge}
                className="gap-2"
              >
                {saveAttempt.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Attempt
                  </>
                )}
              </Button>

              <div className="ml-auto flex items-center gap-2">
                <Label htmlFor="score" className="text-sm">Score (optional):</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>Execution results will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {output ? (
              <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                {output}
              </pre>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Run your code to see the output here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
