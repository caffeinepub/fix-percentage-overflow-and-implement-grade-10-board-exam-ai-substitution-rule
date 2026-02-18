import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddAcademicEntry, useSaveBoardExamResults } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, Info } from 'lucide-react';
import type { SubjectScores } from '../backend';
import { calculateGrade10BoardExam } from '@/lib/boardExam';
import { formatPercent } from '@/lib/percent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMaxMarksForSubject, calculateTermMaxMarks, getStoredMaxMarks } from '@/lib/maxMarks';

/**
 * Stream and Subgroup Configuration for Grades 11-12 with compulsory English and electives
 */
const streamConfig = {
  Science: {
    'PCM Psych': { subjects: ['Physics', 'Chemistry', 'Math', 'Psychology', 'English'] },
    PCMB: { subjects: ['Physics', 'Chemistry', 'Biology', 'Math', 'English'] },
    PCMC: { subjects: ['Physics', 'Chemistry', 'Math', 'Computer', 'English'] },
  },
  Commerce: {
    CEBA: { subjects: ['Computer', 'Economics', 'Business Studies', 'Accountancy', 'English'] },
    SEBA: { subjects: ['Statistics', 'Economics', 'Business Studies', 'Accountancy', 'English'] },
    MSBA: { subjects: ['Management', 'Statistics', 'Business Studies', 'Accountancy', 'English'] },
  },
};

/**
 * Grade Configuration - subjects per grade
 */
const gradeConfig = {
  1: { subjects: ['Math', 'English', 'Hindi', 'EVS', 'Computer'] },
  2: { subjects: ['Math', 'English', 'Hindi', 'EVS', 'Computer'] },
  3: { subjects: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Computer'] },
  4: { subjects: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Computer'] },
  5: { subjects: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Kannada', 'Computer'] },
  6: { subjects: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Kannada', 'Computer'] },
  7: { subjects: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Kannada', 'Computer'] },
  8: { subjects: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Kannada', 'Computer'] },
  9: { subjects: ['Math', 'English', 'Science', 'Social', 'Kannada', 'AI'] },
  10: { subjects: ['Math', 'English', 'Science', 'Social', 'Kannada', 'AI'] },
};

/**
 * Subject key mapping - converts display names to backend field names
 */
const subjectKeyMap: Record<string, keyof SubjectScores> = {
  'Math': 'math',
  'English': 'english',
  'Hindi': 'hindi',
  'EVS': 'evs',
  'Science': 'science',
  'Social': 'social',
  'Kannada': 'kannada',
  'Computer': 'computer',
  'AI': 'ai',
  'Physics': 'physics',
  'Chemistry': 'chemistry',
  'Biology': 'biology',
  'Economics': 'economics',
  'Business Studies': 'businessStudies',
  'Accountancy': 'accountancy',
  'Statistics': 'statistics',
  'Management': 'management',
  'Psychology': 'psychology',
  'PE': 'pe',
};

const subjectColors: Record<string, string> = {
  Math: 'from-blue-500 to-blue-600',
  Social: 'from-green-500 to-green-600',
  Science: 'from-purple-500 to-purple-600',
  Kannada: 'from-orange-500 to-orange-600',
  English: 'from-pink-500 to-pink-600',
  Hindi: 'from-yellow-500 to-yellow-600',
  AI: 'from-cyan-500 to-cyan-600',
  EVS: 'from-teal-500 to-teal-600',
  Computer: 'from-indigo-500 to-indigo-600',
  Physics: 'from-red-500 to-red-600',
  Chemistry: 'from-lime-500 to-lime-600',
  Biology: 'from-emerald-500 to-emerald-600',
  Economics: 'from-amber-500 to-amber-600',
  'Business Studies': 'from-violet-500 to-violet-600',
  Accountancy: 'from-fuchsia-500 to-fuchsia-600',
  Statistics: 'from-sky-500 to-sky-600',
  Management: 'from-rose-500 to-rose-600',
  Psychology: 'from-purple-600 to-purple-700',
  PE: 'from-green-600 to-green-700',
};

interface AddMarksFormProps {
  onSuccess?: () => void;
}

export default function AddMarksForm({ onSuccess }: AddMarksFormProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  const [electivePE, setElectivePE] = useState<boolean>(false);
  const [electiveMath, setElectiveMath] = useState<boolean>(false);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const addEntry = useAddAcademicEntry();
  const saveBoardExam = useSaveBoardExamResults();

  const handleGradeChange = (value: string) => {
    const grade = parseInt(value);
    setSelectedGrade(grade);
    setSelectedTerm('');
    setSelectedStream('');
    setSelectedSubgroup('');
    setElectivePE(false);
    setElectiveMath(false);
    setMarks({});
  };

  const handleStreamChange = (value: string) => {
    setSelectedStream(value);
    setSelectedSubgroup('');
    setElectivePE(false);
    setElectiveMath(false);
    setMarks({});
  };

  const handleSubgroupChange = (value: string) => {
    setSelectedSubgroup(value);
    setElectivePE(false);
    setElectiveMath(false);
    setMarks({});
  };

  const handleTermChange = (value: string) => {
    setSelectedTerm(value);
    setMarks({});
  };

  const getActiveSubjects = (): string[] => {
    if (selectedGrade && selectedGrade >= 11 && selectedStream && selectedSubgroup) {
      const config = streamConfig[selectedStream as keyof typeof streamConfig]?.[selectedSubgroup as keyof typeof streamConfig.Science | keyof typeof streamConfig.Commerce];
      const subjects = config ? [...config.subjects] : [];
      
      // Add electives
      if (electivePE) subjects.push('PE');
      if (electiveMath && selectedStream === 'Commerce') subjects.push('Math');
      
      return subjects;
    }
    
    if (selectedGrade) {
      const config = gradeConfig[selectedGrade as keyof typeof gradeConfig];
      return config ? config.subjects : [];
    }
    
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGrade) {
      toast.error('Please select a grade');
      return;
    }

    if (!selectedTerm) {
      toast.error('Please select a term or board exam option');
      return;
    }

    if (selectedGrade >= 11 && (!selectedStream || !selectedSubgroup)) {
      toast.error('Please select stream and subgroup for grades 11-12');
      return;
    }

    const activeSubjects = getActiveSubjects();
    const isBoardExam = (selectedGrade === 10 || selectedGrade === 12) && selectedTerm === 'board';

    // Validate all active fields are filled
    const allFilled = activeSubjects.every((subject) => {
      const key = subjectKeyMap[subject];
      return marks[key] !== '' && marks[key] !== undefined;
    });
    
    if (!allFilled) {
      toast.error('Please fill in all subject marks');
      return;
    }

    // Validate all marks are numbers within valid range
    for (const subject of activeSubjects) {
      const key = subjectKeyMap[subject];
      const num = parseInt(marks[key]);
      const maxMarks = getMaxMarksForSubject(subject, selectedGrade, isBoardExam);
      if (isNaN(num) || num < 0 || num > maxMarks) {
        toast.error(`Please enter valid marks (0-${maxMarks}) for ${subject}`);
        return;
      }
    }

    try {
      // Handle Grade 10 Board Exam with AI substitution
      if (selectedGrade === 10 && selectedTerm === 'board') {
        const english = parseInt(marks['english'] || '0');
        const kannada = parseInt(marks['kannada'] || '0');
        const math = parseInt(marks['math'] || '0');
        const science = parseInt(marks['science'] || '0');
        const social = parseInt(marks['social'] || '0');
        const ai = parseInt(marks['ai'] || '0');
        
        const { boardExamTotal, maxMarks: termMaxMarks } = calculateGrade10BoardExam({
          english,
          kannada,
          math,
          science,
          social,
          ai,
        });
        
        await saveBoardExam.mutateAsync({
          boardExamTotal,
          maxMarks: termMaxMarks,
        });
        
        const percentage = formatPercent((boardExamTotal * 100) / termMaxMarks);
        
        toast.success(
          `Board Exam results saved successfully! Total: ${boardExamTotal}/${termMaxMarks}, Percentage: ${percentage}%`,
          { duration: 5000 }
        );
      } 
      // Handle Grade 12 Board Exam (no AI substitution)
      else if (selectedGrade === 12 && selectedTerm === 'board') {
        const termMaxMarks = calculateTermMaxMarks(activeSubjects, selectedGrade, true);
        let boardExamTotal = 0;
        
        activeSubjects.forEach((subject) => {
          const key = subjectKeyMap[subject];
          boardExamTotal += parseInt(marks[key]);
        });
        
        await saveBoardExam.mutateAsync({
          boardExamTotal,
          maxMarks: termMaxMarks,
        });
        
        const percentage = formatPercent((boardExamTotal * 100) / termMaxMarks);
        
        toast.success(
          `Board Exam results saved successfully! Total: ${boardExamTotal}/${termMaxMarks}, Percentage: ${percentage}%`,
          { duration: 5000 }
        );
      } else {
        // Regular term entry
        const termMaxMarks = calculateTermMaxMarks(activeSubjects, selectedGrade, false);
        const storedMaxMarks = getStoredMaxMarks(selectedGrade, false);
        
        // Build SubjectScores object using proper mapping
        const subjectScores: SubjectScores = {};
        activeSubjects.forEach((subject) => {
          const key = subjectKeyMap[subject];
          const value = marks[key];
          if (value && value !== '') {
            subjectScores[key] = BigInt(parseInt(value));
          }
        });
        
        const entry = await addEntry.mutateAsync({
          grade: selectedGrade,
          term: parseInt(selectedTerm),
          stream: selectedGrade >= 11 ? selectedStream : null,
          subgroup: selectedGrade >= 11 ? selectedSubgroup : null,
          marks: subjectScores,
          termMaxMarks,
          computerMaxMarks: storedMaxMarks.computerMaxMarks,
          aiMaxMarks: storedMaxMarks.aiMaxMarks,
        });

        const termPct = formatPercent(Number(entry.termPercentage));

        toast.success(
          `Entry added successfully! Term %: ${termPct}%`,
          { duration: 5000 }
        );
      }
      
      setMarks({});
      setSelectedGrade(null);
      setSelectedTerm('');
      setSelectedStream('');
      setSelectedSubgroup('');
      setElectivePE(false);
      setElectiveMath(false);

      // Call onSuccess callback to switch to progress view
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add entry. Please try again.';
      toast.error(errorMessage);
      console.error('Error adding entry:', error);
    }
  };

  const activeSubjects = getActiveSubjects();
  const isBoardExam = (selectedGrade === 10 || selectedGrade === 12) && selectedTerm === 'board';
  const isGrade10BoardExam = selectedGrade === 10 && selectedTerm === 'board';
  const termMaxMarks = selectedGrade ? calculateTermMaxMarks(activeSubjects, selectedGrade, isBoardExam) : 0;
  const isGrade11Or12 = selectedGrade !== null && selectedGrade >= 11;
  const isGrade10Or12 = selectedGrade === 10 || selectedGrade === 12;

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle>Add New Entry</CardTitle>
        <CardDescription>
          Select your grade, term{isGrade11Or12 ? ', stream, and subgroup' : ''}{isGrade10Or12 ? ' (or board exam)' : ''}, and enter marks for all subjects.
          {isGrade11Or12 && <span className="block mt-1 text-green-600 dark:text-green-400 font-semibold">✓ English is compulsory for all streams in grades 11-12</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grade and Term Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level</Label>
              <Select value={selectedGrade?.toString() || ''} onValueChange={handleGradeChange}>
                <SelectTrigger id="grade" className="text-lg">
                  <SelectValue placeholder="Select your grade (1-12)" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term{isGrade10Or12 ? ' / Board Exam' : ''}</Label>
              <Select value={selectedTerm} onValueChange={handleTermChange}>
                <SelectTrigger id="term" className="text-lg">
                  <SelectValue placeholder={isGrade10Or12 ? "Select term or board exam" : "Select term"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  {isGrade10Or12 && <SelectItem value="board">Board Exam</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grade 10 Board Exam AI Substitution Info */}
          {isGrade10BoardExam && (
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Grade 10 Board Exam:</strong> AI can substitute for the lowest of Math, Science, or Social Studies. 
                If your AI mark is higher than your lowest core subject, it will automatically replace that subject in the calculation. 
                Total marks are calculated from 5 subjects × 100 marks (English, Kannada, and 3 best core subjects).
              </AlertDescription>
            </Alert>
          )}

          {/* Stream and Subgroup Selectors for Grades 11-12 */}
          {isGrade11Or12 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stream">Stream</Label>
                <Select value={selectedStream} onValueChange={handleStreamChange}>
                  <SelectTrigger id="stream" className="text-lg">
                    <SelectValue placeholder="Select stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedStream && (
                <div className="space-y-2">
                  <Label htmlFor="subgroup">Subgroup</Label>
                  <Select value={selectedSubgroup} onValueChange={handleSubgroupChange}>
                    <SelectTrigger id="subgroup" className="text-lg">
                      <SelectValue placeholder="Select subgroup" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(streamConfig[selectedStream as keyof typeof streamConfig] || {}).map((subgroup) => (
                        <SelectItem key={subgroup} value={subgroup}>
                          {subgroup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Elective Subjects for Grades 11-12 */}
          {isGrade11Or12 && selectedStream && selectedSubgroup && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border/50">
              <Label className="text-base font-semibold">Optional Elective Subjects</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="elective-pe"
                    checked={electivePE}
                    onCheckedChange={(checked) => setElectivePE(checked as boolean)}
                  />
                  <Label htmlFor="elective-pe" className="cursor-pointer font-normal">
                    Physical Education (PE)
                  </Label>
                </div>
                {selectedStream === 'Commerce' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="elective-math"
                      checked={electiveMath}
                      onCheckedChange={(checked) => setElectiveMath(checked as boolean)}
                    />
                    <Label htmlFor="elective-math" className="cursor-pointer font-normal">
                      Mathematics (Elective)
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subject Marks Input */}
          {activeSubjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Subject Marks</Label>
                <span className="text-sm text-muted-foreground">
                  Total Maximum: <span className="font-semibold text-foreground">{termMaxMarks}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSubjects.map((subject) => {
                  const key = subjectKeyMap[subject];
                  const maxMarks = getMaxMarksForSubject(subject, selectedGrade!, isBoardExam);
                  const colorClass = subjectColors[subject] || 'from-gray-500 to-gray-600';
                  
                  return (
                    <div key={subject} className="space-y-2">
                      <Label htmlFor={key} className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${colorClass}`} />
                        {subject}
                        <span className="text-xs text-muted-foreground ml-auto">(Max: {maxMarks})</span>
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={marks[key] || ''}
                        onChange={(e) => setMarks({ ...marks, [key]: e.target.value })}
                        placeholder={`Enter marks (0-${maxMarks})`}
                        className="text-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full text-lg"
            disabled={addEntry.isPending || saveBoardExam.isPending}
          >
            {(addEntry.isPending || saveBoardExam.isPending) && (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            )}
            {isBoardExam ? 'Save Board Exam Results' : 'Add Entry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
