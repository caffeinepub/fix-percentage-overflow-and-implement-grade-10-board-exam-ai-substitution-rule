import React, { useState, useEffect } from 'react';
import { useAddAcademicEntry } from '../hooks/useQueries';
import { Subjects } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Award } from 'lucide-react';
import { calculateLetterGrade } from '../lib/gradeCalculation';
import { getMaxMarksConfig, calculateTermMaxMarks, getStoredMaxMarks } from '../lib/maxMarks';
import { isBoardExamGrade } from '../lib/boardExam';

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const TERMS = [1, 2, 3];

// Stream options for grades 11-12
const STREAM_OPTIONS: Record<number, string[]> = {
  11: ['Science', 'Commerce', 'Arts'],
  12: ['Science', 'Commerce', 'Arts'],
};

// Science sub-streams (updated per user requirements)
// PCM-Psych: Physics, Chemistry, Maths, Psychology, English
// PCMCs: Physics, Chemistry, Maths, Computer Science, English
// PCMB: Physics, Chemistry, Maths, Biology, English
const SCIENCE_SUBGROUPS = [
  { label: 'PCM-Psychology (Physics, Chemistry, Maths, Psychology)', value: 'PCM-Psych' },
  { label: 'PCMCs (Physics, Chemistry, Maths, Computer Science)', value: 'PCMCs' },
  { label: 'PCMB (Physics, Chemistry, Maths, Biology)', value: 'PCMB' },
];

// Subgroup options per stream
const SUBGROUP_OPTIONS: Record<string, { label: string; value: string }[]> = {
  Science: SCIENCE_SUBGROUPS,
  // Commerce stream: C stands for Computer Science (a subject within Commerce, not a stream)
  Commerce: [
    { label: 'BSEA (Business Studies, Economics, Accountancy)', value: 'BSEA' },
    { label: 'BSEA+C (+ Computer Science)', value: 'BSEA+C' },
    { label: 'BSEA+M (+ Management)', value: 'BSEA+M' },
    { label: 'BSEA+S (+ Statistics)', value: 'BSEA+S' },
    { label: 'BSEA+P (+ Psychology)', value: 'BSEA+P' },
  ],
  Arts: [
    { label: 'History, Political Science, Economics', value: 'HPE' },
    { label: 'Psychology, Sociology, Economics', value: 'PSE' },
  ],
};

interface SubjectField {
  key: keyof Subjects;
  label: string;
  maxMarks: number;
  required?: boolean;
}

function getSubjectFields(grade: number, stream?: string, subgroup?: string): SubjectField[] {
  const config = getMaxMarksConfig(grade);
  const maxMarks = config.regularSubjectMax;
  const computerMax = config.computerMax;
  const aiMax = config.aiMax;

  // Grades 11-12
  if (grade >= 11) {
    // English is always compulsory for grades 11-12
    const fields: SubjectField[] = [
      { key: 'english', label: 'English', maxMarks, required: true },
    ];

    if (stream === 'Science') {
      // Science sub-streams: PCM-Psych, PCMCs, PCMB
      // All include Physics, Chemistry, Maths, English
      fields.push({ key: 'physics', label: 'Physics', maxMarks });
      fields.push({ key: 'chemistry', label: 'Chemistry', maxMarks });
      fields.push({ key: 'math', label: 'Mathematics', maxMarks });

      if (subgroup === 'PCM-Psych') {
        fields.push({ key: 'psychology', label: 'Psychology', maxMarks });
      } else if (subgroup === 'PCMCs') {
        fields.push({ key: 'computer', label: 'Computer Science', maxMarks: computerMax || maxMarks });
      } else if (subgroup === 'PCMB') {
        fields.push({ key: 'biology', label: 'Biology', maxMarks });
      }
    } else if (stream === 'Commerce') {
      // Commerce stream subjects; C = Computer Science (subject, not stream)
      fields.push({ key: 'businessStudies', label: 'Business Studies', maxMarks });
      fields.push({ key: 'economics', label: 'Economics', maxMarks });
      fields.push({ key: 'accountancy', label: 'Accountancy', maxMarks });
      if (subgroup && subgroup.includes('+C')) {
        fields.push({ key: 'computer', label: 'Computer Science', maxMarks: computerMax || maxMarks });
      }
      if (subgroup && subgroup.includes('+M')) {
        fields.push({ key: 'management', label: 'Management', maxMarks });
      }
      if (subgroup && subgroup.includes('+S')) {
        fields.push({ key: 'statistics', label: 'Statistics', maxMarks });
      }
      if (subgroup && subgroup.includes('+P')) {
        fields.push({ key: 'psychology', label: 'Psychology', maxMarks });
      }
    } else if (stream === 'Arts') {
      if (subgroup === 'HPE') {
        fields.push({ key: 'ssc', label: 'History & Political Science', maxMarks });
        fields.push({ key: 'economics', label: 'Economics', maxMarks });
      } else if (subgroup === 'PSE') {
        fields.push({ key: 'psychology', label: 'Psychology', maxMarks });
        fields.push({ key: 'economics', label: 'Economics', maxMarks });
      }
    }

    // PE as elective for grades 11-12
    fields.push({ key: 'pe', label: 'Physical Education (Elective)', maxMarks });

    return fields;
  }

  // Grade 10: Maths, Science, SSC, English, Kannada — all 100 marks for board exam
  // For term entries use regular max marks
  if (grade === 10) {
    return [
      { key: 'english', label: 'English', maxMarks },
      { key: 'math', label: 'Mathematics', maxMarks },
      { key: 'science', label: 'Science', maxMarks },
      { key: 'ssc', label: 'SSC (Social Science)', maxMarks },
      { key: 'kannada', label: 'Kannada', maxMarks },
      { key: 'ai', label: 'AI', maxMarks: aiMax || maxMarks },
    ];
  }

  // Grade 9
  if (grade === 9) {
    return [
      { key: 'english', label: 'English', maxMarks },
      { key: 'math', label: 'Mathematics', maxMarks },
      { key: 'science', label: 'Science', maxMarks },
      { key: 'ssc', label: 'SSC (Social Science)', maxMarks },
      { key: 'kannada', label: 'Kannada', maxMarks },
      { key: 'ai', label: 'AI', maxMarks: aiMax || maxMarks },
    ];
  }

  // Grades 5-8
  if (grade >= 5 && grade <= 8) {
    const fields: SubjectField[] = [
      { key: 'english', label: 'English', maxMarks },
      { key: 'math', label: 'Mathematics', maxMarks },
      { key: 'hindi', label: 'Hindi', maxMarks },
      { key: 'kannada', label: 'Kannada', maxMarks },
      { key: 'science', label: 'Science', maxMarks },
      { key: 'ssc', label: 'SSC (Social Science)', maxMarks },
      { key: 'computer', label: 'Computer Science', maxMarks: computerMax },
    ];
    return fields;
  }

  // Grades 3-4: no Kannada, no EVS, Science and SSC from grade 3
  if (grade >= 3 && grade <= 4) {
    return [
      { key: 'english', label: 'English', maxMarks },
      { key: 'math', label: 'Mathematics', maxMarks },
      { key: 'hindi', label: 'Hindi', maxMarks },
      { key: 'science', label: 'Science', maxMarks },
      { key: 'ssc', label: 'SSC (Social Science)', maxMarks },
      { key: 'computer', label: 'Computer Science', maxMarks: computerMax },
    ];
  }

  // Grades 1-2: no Kannada, EVS available, Computer Science available
  return [
    { key: 'english', label: 'English', maxMarks },
    { key: 'math', label: 'Mathematics', maxMarks },
    { key: 'hindi', label: 'Hindi', maxMarks },
    { key: 'evs', label: 'EVS (Environmental Studies)', maxMarks },
    { key: 'computer', label: 'Computer Science', maxMarks: computerMax },
  ];
}

export default function AddMarksForm({ onSuccess }: { onSuccess?: () => void }) {
  const [grade, setGrade] = useState<number>(1);
  const [term, setTerm] = useState<number>(1);
  const [stream, setStream] = useState<string | undefined>(undefined);
  const [subgroup, setSubgroup] = useState<string | undefined>(undefined);
  const [marks, setMarks] = useState<Partial<Record<keyof Subjects, string>>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addEntry = useAddAcademicEntry();

  const subjectFields = getSubjectFields(grade, stream, subgroup);
  const isBoardExam = isBoardExamGrade(grade);

  // Reset stream/subgroup when grade changes
  useEffect(() => {
    setStream(undefined);
    setSubgroup(undefined);
    setMarks({});
  }, [grade]);

  useEffect(() => {
    setSubgroup(undefined);
    setMarks({});
  }, [stream]);

  useEffect(() => {
    setMarks({});
  }, [subgroup, term]);

  const handleMarkChange = (key: keyof Subjects, value: string) => {
    setMarks(prev => ({ ...prev, [key]: value }));
  };

  const buildSubjects = (): Subjects => {
    const subjects: Subjects = {};
    for (const field of subjectFields) {
      const val = marks[field.key];
      if (val !== undefined && val !== '') {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          (subjects as Record<string, unknown>)[field.key] = BigInt(Math.min(num, field.maxMarks));
        }
      }
    }
    return subjects;
  };

  const calculatePreviewPercentage = (): number | null => {
    const subjects = buildSubjects();
    let total = 0;
    let totalMax = 0;
    for (const field of subjectFields) {
      const val = (subjects as Record<string, unknown>)[field.key];
      if (val !== undefined) {
        total += Number(val);
        totalMax += field.maxMarks;
      }
    }
    if (totalMax === 0) return null;
    return Math.round((total / totalMax) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const subjects = buildSubjects();
    const filledKeys = Object.keys(subjects);

    if (filledKeys.length === 0) {
      setErrorMsg('Please enter marks for at least one subject.');
      return;
    }

    // Calculate term max marks based on filled subjects
    const activeSubjectNames = subjectFields
      .filter(f => {
        const val = marks[f.key];
        return val !== undefined && val !== '';
      })
      .map(f => f.key as string);

    const { computerMaxMarks, aiMaxMarks } = getStoredMaxMarks(grade);
    const termMaxMarks = calculateTermMaxMarks(activeSubjectNames, grade);

    try {
      await addEntry.mutateAsync({
        grade,
        term,
        stream: stream ?? null,
        subgroup: subgroup ?? null,
        section: stream && subgroup ? `${stream}-${subgroup}` : '',
        marks: subjects,
        marks9: null,
        termMaxMarks,
        computerMaxMarks,
        aiMaxMarks,
      });

      setSuccessMsg(`Marks for Grade ${grade}, Term ${term} saved successfully!`);
      setMarks({});
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg.includes('Unauthorized') ? 'You are not authorized to add entries.' : `Error: ${msg}`);
    }
  };

  const percentage = calculatePreviewPercentage();
  const letterGrade = percentage !== null ? calculateLetterGrade(percentage, 100) : null;

  const showStreamSelect = grade >= 11;
  const showSubgroupSelect = showStreamSelect && !!stream && !!SUBGROUP_OPTIONS[stream];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Grade & Term */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grade">Grade</Label>
          <Select value={String(grade)} onValueChange={v => setGrade(Number(v))}>
            <SelectTrigger id="grade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map(g => (
                <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="term">Term</Label>
          <Select value={String(term)} onValueChange={v => setTerm(Number(v))}>
            <SelectTrigger id="term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TERMS.map(t => (
                <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Board Exam Badge */}
      {isBoardExam && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg">
          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-400 border font-semibold dark:bg-amber-900 dark:text-amber-200">
              Board Exam Year — Grade {grade}
            </Badge>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {grade === 10
                ? 'All subjects carry 100 marks. AI can substitute the lowest scoring core subject (Maths/Science/SSC) if it improves the total.'
                : 'Grade 12 Board Examination year.'}
            </p>
          </div>
        </div>
      )}

      {/* Stream (grades 11-12) */}
      {showStreamSelect && (
        <div className="space-y-2">
          <Label htmlFor="stream">Stream</Label>
          <Select value={stream || ''} onValueChange={v => setStream(v || undefined)}>
            <SelectTrigger id="stream">
              <SelectValue placeholder="Select stream" />
            </SelectTrigger>
            <SelectContent>
              {STREAM_OPTIONS[grade]?.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {stream === 'Commerce' && (
            <p className="text-xs text-muted-foreground">
              Note: Under Commerce stream, C stands for Computer Science (a subject within Commerce, not a separate stream).
            </p>
          )}
          {stream === 'Science' && (
            <p className="text-xs text-muted-foreground">
              English is compulsory for all Science sub-streams.
            </p>
          )}
        </div>
      )}

      {/* Subgroup */}
      {showSubgroupSelect && (
        <div className="space-y-2">
          <Label htmlFor="subgroup">
            {stream === 'Science' ? 'Science Sub-stream' : 'Subgroup'}
          </Label>
          <Select value={subgroup || ''} onValueChange={v => setSubgroup(v || undefined)}>
            <SelectTrigger id="subgroup">
              <SelectValue placeholder={stream === 'Science' ? 'Select sub-stream' : 'Select subgroup'} />
            </SelectTrigger>
            <SelectContent>
              {SUBGROUP_OPTIONS[stream!]?.map(sg => (
                <SelectItem key={sg.value} value={sg.value}>{sg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Subject Marks */}
      {subjectFields.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Subject Marks</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjectFields.map(field => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={field.key} className="text-sm">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                  <span className="text-muted-foreground ml-1">/ {field.maxMarks}</span>
                </Label>
                <Input
                  id={field.key}
                  type="number"
                  min={0}
                  max={field.maxMarks}
                  placeholder={`0–${field.maxMarks}`}
                  value={marks[field.key] ?? ''}
                  onChange={e => handleMarkChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview */}
      {percentage !== null && (
        <div className="p-3 bg-muted/40 rounded-lg border text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Estimated percentage:</span>
          <span className="font-bold text-primary">
            {percentage}% — {letterGrade}
          </span>
        </div>
      )}

      {/* Messages */}
      {successMsg && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">{successMsg}</AlertDescription>
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={addEntry.isPending} className="w-full">
        {addEntry.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Marks'
        )}
      </Button>
    </form>
  );
}
