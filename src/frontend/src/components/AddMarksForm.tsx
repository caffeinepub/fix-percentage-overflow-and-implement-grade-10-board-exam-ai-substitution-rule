import { useState, useMemo } from 'react';
import { useAddAcademicEntry } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { SubjectScores } from '../backend';
import { getMaxMarksConfig, calculateTermMaxMarks, getStoredMaxMarks } from '@/lib/maxMarks';
import { calculateLetterGrade, calculateNineScaleGrade } from '@/lib/gradeCalculation';

interface SubjectInput {
  name: string;
  marks: string;
  maxMarks: number;
  isElective?: boolean;
}

const GRADE_SUBJECTS: Record<number, string[]> = {
  1: ['Math', 'English', 'Hindi', 'EVS', 'Computer'],
  2: ['Math', 'English', 'Hindi', 'EVS', 'Computer'],
  3: ['Math', 'English', 'Hindi', 'EVS', 'Computer'],
  4: ['Math', 'English', 'Hindi', 'EVS', 'Computer'],
  5: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Computer', 'Kannada'],
  6: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Computer', 'Kannada'],
  7: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Computer', 'Kannada'],
  8: ['Math', 'English', 'Hindi', 'Science', 'Social', 'Computer', 'Kannada'],
  9: ['Math', 'English', 'Hindi', 'Science', 'Social', 'AI', 'Kannada'],
  10: ['Math', 'English', 'Hindi', 'Science', 'Social', 'AI', 'Kannada'],
  11: ['Math', 'English', 'Physics', 'Chemistry', 'Computer'],
  12: ['Math', 'English', 'Physics', 'Chemistry', 'Computer'],
};

const STREAM_OPTIONS = ['Science', 'Commerce', 'Arts'];
const SUBGROUP_OPTIONS = {
  Science: ['PCMC', 'PCMB', 'PCME'],
  Commerce: ['CEBA', 'CEBA-CS'],
  Arts: ['HESP', 'HEMP'],
};

export default function AddMarksForm({ onSuccess }: { onSuccess?: () => void }) {
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);

  const addAcademicEntry = useAddAcademicEntry();

  const isBoardExam = useMemo(() => {
    return selectedTerm === '8' || selectedTerm === '9';
  }, [selectedTerm]);

  const isHigherSecondary = useMemo(() => {
    const grade = parseInt(selectedGrade);
    return grade === 11 || grade === 12;
  }, [selectedGrade]);

  const isCommerceSubgroup = useMemo(() => {
    return selectedSubgroup === 'CEBA' || selectedSubgroup === 'CEBA-CS';
  }, [selectedSubgroup]);

  const availableSubjects = useMemo(() => {
    const grade = parseInt(selectedGrade);
    if (!grade || grade < 1 || grade > 12) return [];

    let baseSubjects = GRADE_SUBJECTS[grade] || [];

    if (isHigherSecondary && selectedSubgroup) {
      const subgroupMap: Record<string, string[]> = {
        PCMC: ['Physics', 'Chemistry', 'Math', 'Computer', 'English'],
        PCMB: ['Physics', 'Chemistry', 'Math', 'Biology', 'English'],
        PCME: ['Physics', 'Chemistry', 'Math', 'Economics', 'English'],
        // For Commerce subgroups, Math is now an elective (not in compulsory list)
        CEBA: ['Commerce', 'Economics', 'Business Studies', 'Accountancy', 'English'],
        'CEBA-CS': ['Commerce', 'Economics', 'Business Studies', 'Accountancy', 'Computer', 'English'],
        HESP: ['History', 'Economics', 'Sociology', 'Psychology', 'English'],
        HEMP: ['History', 'Economics', 'Management', 'Psychology', 'English'],
      };
      baseSubjects = subgroupMap[selectedSubgroup] || baseSubjects;
    }

    return baseSubjects;
  }, [selectedGrade, selectedSubgroup, isHigherSecondary]);

  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
    setSelectedTerm('');
    setSelectedStream('');
    setSelectedSubgroup('');
    setSubjects([]);
  };

  const handleTermChange = (value: string) => {
    setSelectedTerm(value);
    initializeSubjects();
  };

  const handleStreamChange = (value: string) => {
    setSelectedStream(value);
    setSelectedSubgroup('');
    setSubjects([]);
  };

  const handleSubgroupChange = (value: string) => {
    setSelectedSubgroup(value);
    initializeSubjects();
  };

  const initializeSubjects = () => {
    const grade = parseInt(selectedGrade);
    if (!grade || !selectedTerm) return;

    const config = getMaxMarksConfig(grade, isBoardExam);
    const initialSubjects: SubjectInput[] = availableSubjects.map((subject) => {
      let maxMarks = config.regularSubjectMax;
      if (subject === 'Computer') {
        maxMarks = config.computerMax;
      } else if (subject === 'AI') {
        maxMarks = config.aiMax;
      }

      return {
        name: subject,
        marks: '',
        maxMarks,
        isElective: false,
      };
    });

    setSubjects(initialSubjects);
  };

  const addElectiveSubject = (subjectName: string) => {
    const config = getMaxMarksConfig(parseInt(selectedGrade), isBoardExam);
    const newSubject: SubjectInput = {
      name: subjectName,
      marks: '',
      maxMarks: config.regularSubjectMax,
      isElective: true,
    };
    setSubjects([...subjects, newSubject]);
  };

  const removeElectiveSubject = (index: number) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const handleMarksChange = (index: number, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index].marks = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const grade = parseInt(selectedGrade);
    const term = parseInt(selectedTerm);

    if (!grade || !term) {
      toast.error('Please select grade and term');
      return;
    }

    if (isHigherSecondary && !selectedStream) {
      toast.error('Please select a stream for grades 11-12');
      return;
    }

    if (isHigherSecondary && !selectedSubgroup) {
      toast.error('Please select a subgroup');
      return;
    }

    // Validate that at least one subject has marks
    const hasMarks = subjects.some((s) => s.marks.trim() !== '');
    if (!hasMarks) {
      toast.error('Please enter marks for at least one subject');
      return;
    }

    // Build SubjectScores object
    const subjectScores: SubjectScores = {};
    const subjectKeyMap: Record<string, keyof SubjectScores> = {
      Math: 'math',
      English: 'english',
      Hindi: 'hindi',
      EVS: 'evs',
      Computer: 'computer',
      Kannada: 'kannada',
      Science: 'science',
      Social: 'social',
      AI: 'ai',
      Physics: 'physics',
      Chemistry: 'chemistry',
      Biology: 'biology',
      Economics: 'economics',
      'Business Studies': 'businessStudies',
      Accountancy: 'accountancy',
      Statistics: 'statistics',
      Management: 'management',
      Psychology: 'psychology',
      PE: 'pe',
    };

    subjects.forEach((subject) => {
      if (subject.marks.trim() !== '') {
        const key = subjectKeyMap[subject.name];
        if (key) {
          subjectScores[key] = BigInt(parseInt(subject.marks));
        }
      }
    });

    // Calculate term max marks
    const activeSubjects = subjects.filter((s) => s.marks.trim() !== '').map((s) => s.name);
    const termMaxMarks = calculateTermMaxMarks(activeSubjects, grade, isBoardExam);

    // Get stored max marks for backend
    const { computerMaxMarks, aiMaxMarks } = getStoredMaxMarks(grade, isBoardExam);

    try {
      await addAcademicEntry.mutateAsync({
        grade: grade,
        term: term,
        stream: isHigherSecondary ? selectedStream : null,
        subgroup: isHigherSecondary ? selectedSubgroup : null,
        section: isHigherSecondary ? `${selectedStream}-${selectedSubgroup}` : '',
        marks: subjectScores,
        marks9: null,
        termMaxMarks: termMaxMarks,
        computerMaxMarks: computerMaxMarks,
        aiMaxMarks: aiMaxMarks,
      });

      toast.success('Academic entry added successfully!');
      
      // Reset form
      setSelectedGrade('');
      setSelectedTerm('');
      setSelectedStream('');
      setSelectedSubgroup('');
      setSubjects([]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding academic entry:', error);
      toast.error('Failed to add academic entry');
    }
  };

  // Calculate preview grade
  const previewGrade = useMemo(() => {
    const totalMarks = subjects.reduce((sum, s) => {
      const marks = parseInt(s.marks) || 0;
      return sum + marks;
    }, 0);

    const totalMaxMarks = subjects.reduce((sum, s) => {
      if (s.marks.trim() !== '') {
        return sum + s.maxMarks;
      }
      return sum;
    }, 0);

    if (totalMaxMarks === 0) return null;

    const letterGrade = calculateLetterGrade(totalMarks, totalMaxMarks);
    const percentage = ((totalMarks * 100) / totalMaxMarks).toFixed(1);

    return {
      totalMarks,
      totalMaxMarks,
      percentage,
      letterGrade,
    };
  }, [subjects]);

  // Check if PE is already added
  const hasPE = subjects.some((s) => s.name === 'PE');
  // Check if Math is already added (for Commerce subgroups)
  const hasMath = subjects.some((s) => s.name === 'Math');

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader>
        <CardTitle>Add Academic Entry</CardTitle>
        <CardDescription>
          Enter raw marks for each subject (e.g., 73 out of 100). PE is available as an elective for all subgroups.
          {isCommerceSubgroup && ' Mathematics is an elective subject for Commerce subgroups.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grade Selection */}
          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Select value={selectedGrade} onValueChange={handleGradeChange}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                  <SelectItem key={grade} value={String(grade)}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Term Selection */}
          {selectedGrade && (
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select value={selectedTerm} onValueChange={handleTermChange}>
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                  {(selectedGrade === '10' || selectedGrade === '12') && (
                    <>
                      <SelectItem value="8">Board Exam</SelectItem>
                      <SelectItem value="9">Board Exam (with AI substitution)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stream and Subgroup for Grades 11-12 */}
          {isHigherSecondary && selectedTerm && (
            <>
              <div className="space-y-2">
                <Label htmlFor="stream">Stream</Label>
                <Select value={selectedStream} onValueChange={handleStreamChange}>
                  <SelectTrigger id="stream">
                    <SelectValue placeholder="Select stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {STREAM_OPTIONS.map((stream) => (
                      <SelectItem key={stream} value={stream}>
                        {stream}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStream && (
                <div className="space-y-2">
                  <Label htmlFor="subgroup">Subgroup</Label>
                  <Select value={selectedSubgroup} onValueChange={handleSubgroupChange}>
                    <SelectTrigger id="subgroup">
                      <SelectValue placeholder="Select subgroup" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBGROUP_OPTIONS[selectedStream as keyof typeof SUBGROUP_OPTIONS]?.map((subgroup) => (
                        <SelectItem key={subgroup} value={subgroup}>
                          {subgroup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Grade 10 Board Exam Alert */}
          {selectedGrade === '10' && selectedTerm === '9' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Grade 10 Board Exam with AI substitution: AI will replace the lowest of Math/Science/Social only if it
                improves the total.
              </AlertDescription>
            </Alert>
          )}

          {/* Subject Marks Input */}
          {subjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Subject Marks (Raw Marks)</Label>
                {selectedTerm && (
                  <div className="flex gap-2">
                    {!hasPE && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addElectiveSubject('PE')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add PE (Elective)
                      </Button>
                    )}
                    {isCommerceSubgroup && !hasMath && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addElectiveSubject('Math')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Math (Elective)
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center">
                    <Label htmlFor={`subject-${index}`} className="font-medium">
                      {subject.name}
                      {subject.isElective && (
                        <span className="ml-2 text-xs text-muted-foreground">(Elective)</span>
                      )}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`subject-${index}`}
                        type="number"
                        min="0"
                        max={subject.maxMarks}
                        value={subject.marks}
                        onChange={(e) => handleMarksChange(index, e.target.value)}
                        placeholder={`0-${subject.maxMarks}`}
                        className="font-mono"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">/ {subject.maxMarks}</span>
                      {subject.marks.trim() !== '' && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          (Grade: {calculateNineScaleGrade(parseInt(subject.marks) || 0, subject.maxMarks)})
                        </span>
                      )}
                    </div>
                    {subject.isElective && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeElectiveSubject(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Grade */}
          {previewGrade && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Preview:</p>
                  <p className="text-sm">
                    Total: {previewGrade.totalMarks}/{previewGrade.totalMaxMarks} ({previewGrade.percentage}%)
                  </p>
                  <p className="text-sm">Letter Grade: <strong>{previewGrade.letterGrade}</strong></p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={addAcademicEntry.isPending || subjects.length === 0}>
            {addAcademicEntry.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Entry...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
